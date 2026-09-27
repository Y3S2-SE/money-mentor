import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const getToken = jest.fn();
const verifyIdToken = jest.fn();
const OAuth2Client = jest.fn().mockImplementation(() => ({ getToken, verifyIdToken }));
jest.unstable_mockModule('google-auth-library', () => ({ OAuth2Client }));

const app = (await import('../../app.js')).default;
const User = (await import('../../models/user.model.js')).default;
const { clearTestDB, setupTestDB, teardownTestDB } = await import('../setup/testSetup.js');

const allowedOrigin = 'http://localhost:5173';
const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googlePayload = {
    sub: 'google-sub-123',
    email: 'google@example.com',
    email_verified: true
};

const googleRequest = (code = 'one-time-code') => request(app)
    .post('/api/auth/google')
    .set('Origin', allowedOrigin)
    .set('X-Requested-With', 'XmlHttpRequest')
    .send({ code });

beforeAll(async () => {
    await setupTestDB();
});

afterAll(async () => {
    await teardownTestDB();
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
});

beforeEach(async () => {
    await clearTestDB();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    getToken.mockReset().mockResolvedValue({
        tokens: {
            id_token: 'provider-id-token',
            access_token: 'provider-access-token',
            refresh_token: 'provider-refresh-token'
        }
    });
    verifyIdToken.mockReset().mockResolvedValue({
        getPayload: () => ({ ...googlePayload })
    });
});

describe('Google auth model and account compatibility', () => {
    it('hashes local passwords and allows multiple local users without googleSub', async () => {
        const first = await User.create({
            username: 'firstlocal', email: 'first@example.com', password: 'Test123!'
        });
        await User.create({
            username: 'secondlocal', email: 'second@example.com', password: 'Test123!'
        });

        const stored = await User.findById(first._id).select('+password');
        expect(stored.authProvider).toBe('local');
        expect(stored.password).not.toBe('Test123!');
        expect(stored.password).toMatch(/^\$2/);
        expect(await stored.comparePassword('Test123!')).toBe(true);
        expect(await User.countDocuments()).toBe(2);
    });

    it('saves a passwordless Google user without hashing and hides googleSub in normal queries', async () => {
        const created = await User.create({
            username: 'googleuser',
            email: 'google@example.com',
            authProvider: 'google',
            googleSub: 'google-sub-123',
            role: 'user'
        });
        const ordinary = await User.findById(created._id);
        const selected = await User.findById(created._id).select('+googleSub +password');

        expect(ordinary.googleSub).toBeUndefined();
        expect(selected.googleSub).toBe('google-sub-123');
        expect(selected.password).toBeUndefined();
        expect(await selected.comparePassword('anything')).toBe(false);
        expect(ordinary.toAuthJSON()).not.toHaveProperty('googleSub');
        expect(ordinary.toAuthJSON()).not.toHaveProperty('tokenVersion');
        expect(ordinary.toAuthJSON()).not.toHaveProperty('authProvider');
    });

    it('enforces the partial unique googleSub index in the test database', async () => {
        // clearTestDB drops indexes; recreate them for this uniqueness assertion.
        await User.createIndexes();
        const indexes = await User.collection.indexes();
        expect(indexes).toEqual(expect.arrayContaining([
            expect.objectContaining({
                key: { googleSub: 1 },
                unique: true,
                partialFilterExpression: { googleSub: { $type: 'string' } }
            })
        ]));

        await User.create({
            username: 'googlefirst', email: 'first@example.com',
            authProvider: 'google', googleSub: 'same-google-sub'
        });
        await expect(User.create({
            username: 'googlesecond', email: 'second@example.com',
            authProvider: 'google', googleSub: 'same-google-sub'
        })).rejects.toMatchObject({ code: 11000 });
    });

    it('hydrates a legacy document without a physical authProvider as local', async () => {
        const user = await User.create({
            username: 'legacyuser', email: 'legacy@example.com', password: 'Test123!'
        });
        await User.collection.updateOne({ _id: user._id }, { $unset: { authProvider: '' } });
        const raw = await User.collection.findOne({ _id: user._id });
        const hydrated = await User.findById(user._id);

        expect(raw).not.toHaveProperty('authProvider');
        expect(hydrated.authProvider).toBe('local');
    });

    it('gives Google-only users a generic local-login failure', async () => {
        await User.create({
            username: 'googleuser', email: 'google@example.com',
            authProvider: 'google', googleSub: 'google-sub-123'
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'google@example.com', password: 'Test123!' })
            .expect(401);

        expect(response.body.message).toBe('Invalid email or password');
        expect(response.body).not.toHaveProperty('code');
        expect(JSON.stringify(response.body)).not.toMatch(/google|provider/i);
    });
});

describe('POST /api/auth/google', () => {
    it('is public, creates a user-only Google account, and uses the existing revocable JWT', async () => {
        const response = await googleRequest().expect(200);
        const { user, token, dailyLogin } = response.body.data;
        const stored = await User.findById(user.id).select('+googleSub +password +tokenVersion');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        expect(response.body).toMatchObject({ success: true, message: 'Login successful' });
        expect(stored).toMatchObject({
            authProvider: 'google', googleSub: 'google-sub-123',
            email: 'google@example.com', role: 'user', tokenVersion: 0
        });
        expect(stored.password).toBeUndefined();
        expect(stored.username).toMatch(/^[a-zA-Z0-9_]{3,30}$/);
        expect(decoded).toMatchObject({ id: user.id, tokenVersion: 0 });
        expect(dailyLogin).toBeDefined();
        expect(user).not.toHaveProperty('googleSub');
        expect(user).not.toHaveProperty('authProvider');
        expect(user).not.toHaveProperty('tokenVersion');
        expect(JSON.stringify(response.body)).not.toMatch(
            /one-time-code|provider-id-token|provider-access-token|provider-refresh-token|test-client-secret/
        );
        expect(getToken).toHaveBeenCalledWith({
            code: 'one-time-code', redirect_uri: allowedOrigin
        });

        await request(app).get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`).expect(200);
        await request(app).post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`).expect(200);
        const afterLogout = await User.findById(stored._id).select('+tokenVersion');
        expect(afterLogout.tokenVersion).toBe(1);
        const rejected = await request(app).get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`).expect(401);
        expect(rejected.body.code).toBe('AUTH_SESSION_INVALID');
    });

    it('matches returning users by sub, preserves role/version, and updates lastLogin', async () => {
        const existing = await User.create({
            username: 'googleadmin', email: 'old@example.com',
            authProvider: 'google', googleSub: 'google-sub-123',
            role: 'admin', tokenVersion: 4
        });
        verifyIdToken.mockResolvedValue({
            getPayload: () => ({ ...googlePayload, email: 'changed@example.com' })
        });

        const response = await googleRequest().expect(200);
        const stored = await User.findById(existing._id).select('+tokenVersion');

        expect(response.body.data.user.id).toBe(existing._id.toString());
        expect(response.body.data.user.role).toBe('admin');
        expect(jwt.verify(response.body.data.token, process.env.JWT_SECRET).tokenVersion).toBe(4);
        expect(stored.email).toBe('old@example.com');
        expect(stored.lastLogin).toBeInstanceOf(Date);
        expect(stored.tokenVersion).toBe(4);
        expect(await User.countDocuments()).toBe(1);
        expect(response.body.data.dailyLogin).toBeDefined();
    });

    it('does not auto-link or authenticate an existing email owner', async () => {
        const local = await User.create({
            username: 'localuser', email: 'google@example.com', password: 'Test123!'
        });
        const response = await googleRequest().expect(409);
        const raw = await User.collection.findOne({ _id: local._id });

        expect(response.body.code).toBe('GOOGLE_ACCOUNT_LINK_REQUIRED');
        expect(response.body).not.toHaveProperty('data.token');
        expect(raw).not.toHaveProperty('googleSub');
        expect(raw.authProvider).toBe('local');
        expect(await User.countDocuments()).toBe(1);
    });

    it('reuses a concurrently created account after a duplicate-sub insert', async () => {
        const originalCreate = User.create.bind(User);
        const createSpy = jest.spyOn(User, 'create').mockImplementationOnce(async fields => {
            await originalCreate(fields);
            throw Object.assign(new Error('duplicate subject'), {
                code: 11000,
                keyPattern: { googleSub: 1 }
            });
        });

        try {
            const response = await googleRequest().expect(200);
            expect(response.body.data.user.email).toBe('google@example.com');
            expect(await User.countDocuments()).toBe(1);
        } finally {
            createSpy.mockRestore();
        }
    });

    it('retries a duplicate username and creates just one Google account', async () => {
        const originalCreate = User.create.bind(User);
        const createSpy = jest.spyOn(User, 'create')
            .mockRejectedValueOnce(Object.assign(new Error('duplicate username'), {
                code: 11000,
                keyPattern: { username: 1 }
            }))
            .mockImplementationOnce(fields => originalCreate(fields));

        try {
            await googleRequest().expect(200);
            expect(createSpy).toHaveBeenCalledTimes(2);
            expect(createSpy.mock.calls[0][0].username)
                .not.toBe(createSpy.mock.calls[1][0].username);
            expect(await User.countDocuments()).toBe(1);
        } finally {
            createSpy.mockRestore();
        }
    });

    it('returns a controlled response when username retries are exhausted', async () => {
        const createSpy = jest.spyOn(User, 'create').mockRejectedValue(
            Object.assign(new Error('duplicate username'), {
                code: 11000,
                keyPattern: { username: 1 }
            })
        );

        try {
            const response = await googleRequest().expect(503);
            expect(response.body.code).toBe('GOOGLE_AUTH_UNAVAILABLE');
            expect(response.body).not.toHaveProperty('data.token');
            expect(createSpy).toHaveBeenCalledTimes(5);
            expect(await User.countDocuments()).toBe(0);
        } finally {
            createSpy.mockRestore();
        }
    });

    it('rejects an inactive linked user without a JWT', async () => {
        await User.create({
            username: 'inactivegoogle', email: 'google@example.com',
            authProvider: 'google', googleSub: 'google-sub-123', isActive: false
        });

        const response = await googleRequest().expect(403);
        expect(response.body.code).toBe('GOOGLE_ACCOUNT_UNAVAILABLE');
        expect(response.body).not.toHaveProperty('data.token');
    });

    it('rejects Google-only password change without rotating the session', async () => {
        const login = await googleRequest().expect(200);
        const token = login.body.data.token;
        const response = await request(app)
            .put('/api/auth/change-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'Test123!', newPassword: 'NewTest123!' })
            .expect(400);
        const stored = await User.findById(login.body.data.user.id)
            .select('+password +tokenVersion');

        expect(response.body.code).toBe('PASSWORD_CHANGE_UNAVAILABLE');
        expect(response.body.code).not.toBe('AUTH_SESSION_INVALID');
        expect(response.body).not.toHaveProperty('data.token');
        expect(stored.password).toBeUndefined();
        expect(stored.tokenVersion).toBe(0);
        await request(app).get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`).expect(200);
    });
});

describe('Google request validation and popup-origin checks', () => {
    it.each([
        [{}, 'missing code'],
        [{ code: 42 }, 'non-string code'],
        [{ code: '   ' }, 'empty code'],
        [{ code: 'x'.repeat(4097) }, 'oversized code'],
        [{ code: 'code', extra: true }, 'extra property'],
        ...['role', 'authProvider', 'googleSub', 'tokenVersion',
            'email', 'username', 'password', 'redirect_uri'].map(field => [
            { code: 'code', [field]: 'client-value' }, field
        ])
    ])('rejects %s (%s)', async (body) => {
        await request(app).post('/api/auth/google')
            .set('Origin', allowedOrigin)
            .set('X-Requested-With', 'XmlHttpRequest')
            .send(body)
            .expect(400);
        expect(getToken).not.toHaveBeenCalled();
    });

    it('rejects a missing Origin', async () => {
        const response = await request(app).post('/api/auth/google')
            .set('X-Requested-With', 'XmlHttpRequest')
            .send({ code: 'code' }).expect(403);
        expect(response.body.code).toBe('GOOGLE_ORIGIN_INVALID');
        expect(getToken).not.toHaveBeenCalled();
    });

    it('rejects an unapproved Origin', async () => {
        const response = await request(app).post('/api/auth/google')
            .set('Origin', 'https://unapproved.example')
            .set('X-Requested-With', 'XmlHttpRequest')
            .send({ code: 'code' }).expect(403);
        expect(response.body.code).toBe('GOOGLE_ORIGIN_INVALID');
        expect(getToken).not.toHaveBeenCalled();
    });

    it('rejects a missing X-Requested-With header', async () => {
        const response = await request(app).post('/api/auth/google')
            .set('Origin', allowedOrigin)
            .send({ code: 'code' }).expect(403);
        expect(response.body.code).toBe('GOOGLE_REQUEST_INVALID');
        expect(getToken).not.toHaveBeenCalled();
    });

    it('rejects a wrong X-Requested-With value', async () => {
        const response = await request(app).post('/api/auth/google')
            .set('Origin', allowedOrigin)
            .set('X-Requested-With', 'XMLHttpRequest')
            .send({ code: 'code' }).expect(403);
        expect(response.body.code).toBe('GOOGLE_REQUEST_INVALID');
        expect(getToken).not.toHaveBeenCalled();
    });

    it('accepts the exact header and reflects it during permitted-origin preflight', async () => {
        const preflight = await request(app).options('/api/auth/google')
            .set('Origin', allowedOrigin)
            .set('Access-Control-Request-Method', 'POST')
            .set('Access-Control-Request-Headers', 'content-type,x-requested-with')
            .expect(204);
        expect(preflight.headers['access-control-allow-origin']).toBe(allowedOrigin);
        expect(preflight.headers['access-control-allow-headers']).toContain('x-requested-with');
        expect(getToken).not.toHaveBeenCalled();

        await googleRequest('allowed-code').expect(200);
        expect(getToken).toHaveBeenCalledWith({
            code: 'allowed-code', redirect_uri: allowedOrigin
        });
    });
});
