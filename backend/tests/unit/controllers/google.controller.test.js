import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/user.model.js', () => ({
    default: {
        findOne: jest.fn(),
        exists: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule('../../../services/googleAuth.service.js', () => ({
    GoogleAuthError: class GoogleAuthError extends Error {
        constructor(code, status, message) {
            super(message);
            this.code = code;
            this.status = status;
        }
    },
    verifyGoogleCode: jest.fn()
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: { sign: jest.fn(), verify: jest.fn() }
}));

jest.unstable_mockModule('../../../utils/gamificationEngine.js', () => ({
    processDailyLogin: jest.fn()
}));

const User = (await import('../../../models/user.model.js')).default;
const { verifyGoogleCode } = await import('../../../services/googleAuth.service.js');
const { processDailyLogin } = await import('../../../utils/gamificationEngine.js');
const jwt = (await import('jsonwebtoken')).default;
const { googleLogin } = await import('../../../controllers/auth.controller.js');

const userId = new mongoose.Types.ObjectId();
const makeUser = (overrides = {}) => ({
    _id: userId,
    username: 'google_1234567890abcdef',
    email: 'google@example.com',
    authProvider: 'google',
    googleSub: 'verified-sub',
    role: 'user',
    isActive: true,
    tokenVersion: 0,
    toAuthJSON() {
        return {
            id: this._id,
            username: this.username,
            email: this.email,
            role: this.role,
            isActive: this.isActive
        };
    },
    ...overrides
});

const makeRequest = () => ({
    req: { body: { code: 'authorization-code' }, googleRedirectUri: 'https://frontend.test' },
    res: {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
});

const selected = (value) => ({ select: jest.fn().mockResolvedValue(value) });

beforeEach(() => {
    User.findOne.mockReset().mockReturnValue(selected(null));
    User.exists.mockReset().mockResolvedValue(null);
    User.create.mockReset().mockImplementation(async (fields) => makeUser(fields));
    User.findOneAndUpdate.mockReset().mockReturnValue(selected(makeUser()));
    verifyGoogleCode.mockReset().mockResolvedValue({
        sub: 'verified-sub',
        email: 'google@example.com'
    });
    processDailyLogin.mockReset().mockResolvedValue({ xpAwarded: 5 });
    jwt.sign.mockReset().mockReturnValue('moneymentor-token');
});

describe('Google login controller', () => {
    it('signs in the existing subject, preserving role and current tokenVersion', async () => {
        const existing = makeUser({ role: 'admin', tokenVersion: 7 });
        User.findOne.mockReturnValue(selected(existing));
        User.findOneAndUpdate.mockReturnValue(selected(existing));
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(verifyGoogleCode).toHaveBeenCalledWith('authorization-code', 'https://frontend.test');
        expect(User.findOne).toHaveBeenCalledWith({ googleSub: 'verified-sub' });
        expect(User.exists).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: userId, isActive: true },
            { $set: { lastLogin: expect.any(Date) } },
            { new: true }
        );
        expect(jwt.sign).toHaveBeenCalledWith(
            { id: userId, tokenVersion: 7 },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '15m' }
        );
        expect(processDailyLogin).toHaveBeenCalledWith(userId, { silent: true });
        expect(res.status).toHaveBeenCalledWith(200);
        const body = res.json.mock.calls[0][0];
        expect(body).toMatchObject({
            success: true,
            message: 'Login successful',
            data: { token: 'moneymentor-token', user: { role: 'admin' }, dailyLogin: { xpAwarded: 5 } }
        });
        expect(body.data.user).not.toHaveProperty('googleSub');
        expect(body.data.user).not.toHaveProperty('tokenVersion');
        expect(body.data.user).not.toHaveProperty('authProvider');
        expect(JSON.stringify(body)).not.toContain('authorization-code');
    });

    it('creates a passwordless user with verified identity and role user', async () => {
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(User.create).toHaveBeenCalledTimes(1);
        const created = User.create.mock.calls[0][0];
        expect(created).toMatchObject({
            authProvider: 'google',
            googleSub: 'verified-sub',
            email: 'google@example.com',
            role: 'user'
        });
        expect(created).not.toHaveProperty('password');
        expect(created.username).toMatch(/^[a-zA-Z0-9_]{3,30}$/);
        expect(processDailyLogin).toHaveBeenCalledWith(userId, { silent: true });
        expect(jwt.sign).toHaveBeenCalledWith(
            { id: userId, tokenVersion: 0 },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '15m' }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('does not link or authenticate an existing email owner', async () => {
        User.exists.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].code).toBe('GOOGLE_ACCOUNT_LINK_REQUIRED');
        expect(User.create).not.toHaveBeenCalled();
        expect(User.findOneAndUpdate).not.toHaveBeenCalled();
        expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('rejects an inactive linked account without issuing a JWT', async () => {
        User.findOne.mockReturnValue(selected(makeUser({ isActive: false })));
        User.findOneAndUpdate.mockReturnValue(selected(null));
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json.mock.calls[0][0].code).toBe('GOOGLE_ACCOUNT_UNAVAILABLE');
        expect(jwt.sign).not.toHaveBeenCalled();
        expect(processDailyLogin).not.toHaveBeenCalled();
    });

    it('reuses the winner of a same-sub creation race', async () => {
        User.create.mockRejectedValue(Object.assign(new Error('duplicate'), {
            code: 11000,
            keyPattern: { googleSub: 1 }
        }));
        User.findOne.mockReturnValueOnce(selected(null)).mockReturnValueOnce(selected(makeUser()));
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(User.create).toHaveBeenCalledTimes(1);
        expect(User.findOne).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jwt.sign).toHaveBeenCalledTimes(1);
    });

    it('retries after a username uniqueness collision', async () => {
        User.create
            .mockRejectedValueOnce(Object.assign(new Error('duplicate'), {
                code: 11000,
                keyPattern: { username: 1 }
            }))
            .mockImplementationOnce(async (fields) => makeUser(fields));
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(User.create).toHaveBeenCalledTimes(2);
        expect(User.create.mock.calls[0][0].username)
            .not.toBe(User.create.mock.calls[1][0].username);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns a controlled error after username retry exhaustion', async () => {
        User.create.mockRejectedValue(Object.assign(new Error('duplicate'), {
            code: 11000,
            keyPattern: { username: 1 }
        }));
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(User.create).toHaveBeenCalledTimes(5);
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json.mock.calls[0][0].code).toBe('GOOGLE_AUTH_UNAVAILABLE');
        expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('treats a duplicate-email race as a conflict, not account linking', async () => {
        User.exists.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: userId });
        User.create.mockRejectedValue(Object.assign(new Error('duplicate'), {
            code: 11000,
            keyPattern: { email: 1 }
        }));
        const { req, res } = makeRequest();

        await googleLogin(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].code).toBe('GOOGLE_ACCOUNT_LINK_REQUIRED');
        expect(User.findOneAndUpdate).not.toHaveBeenCalled();
        expect(jwt.sign).not.toHaveBeenCalled();
    });
});
