import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import { clearTestDB, setupTestDB, teardownTestDB } from '../setup/testSetup.js';

describe('Auth integration Tests', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('username', userData.username);
            expect(response.body.data.user).toHaveProperty('email', userData.email);
            expect(response.body.data.user).not.toHaveProperty('password');
            expect(response.body.data.user.role).toBe('user');
            expect(response.body.data.user).not.toHaveProperty('tokenVersion');
        });

        it.each(['admin', 'user'])(
          'should reject public registration when role is "%s"',
          async (role) => {
             const userData = {
                username: 'roleuser',
                email: 'roleuser@example.com',
                password: 'Test123!',
                role
             };
 
             const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
 
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    field: 'role',
                    message: 'Role cannot be set during registration'
                })
            ]));
            expect(await User.countDocuments()).toBe(0);
          }
        );

        it('should reject registration with duplicate email', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            };

            await User.create(userData);

            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, username: 'testuser2'})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email already registered');
        });

        it('should reject registration with duplicate username', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            };

            await User.create(userData);

            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...userData, email: 'different@example.com'})
                .expect(400);

             expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Username already taken');
        });

        it('should reject registration with invalid email format', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject registration with weak password', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'weak'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject registration with short username', async () => {
            const userData = {
                username: 'ab',
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject registration without required fields', async () => {

            const response = await request(app)
                .post('/api/auth/register')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Test123!'
        };

        beforeEach(async () => {
            await User.create(userData);
        });

        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('email', userData.email);
            expect(response.body.data.user).not.toHaveProperty('password');
            expect(response.body.data.user).not.toHaveProperty('tokenVersion');
        });

        it('should reject login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: 'WrongPassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
            expect(response.body).not.toHaveProperty('code');
        });

        it('should reject login with non-exist email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexist@example.com',
                    password: userData.password
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should reject login for inactive user', async () => {
            await User.findOneAndUpdate(
                { email: userData.email },
                { isActive: false }
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('deactivat');
        });

        it('should update lastLogin timestamp on successful login', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            const user = await User.findOne({ email: userData.email });
            expect(user.lastLogin).toBeDefined();
            expect(user.lastLogin).toBeInstanceOf(Date);
        });

        it('should reject login without email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: userData.password
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject login without password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let token;
        let userId;

        beforeEach(async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });

            userId = user._id;

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            token = response.body.data.token;
        });

        it('should get profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('username', 'testuser');
            expect(response.body.data).toHaveProperty('email', 'test@example.com');
            expect(response.body.data).not.toHaveProperty('password');
            expect(response.body.data).not.toHaveProperty('tokenVersion');
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('AUTH_SESSION_INVALID');
            expect(response.body.message).toContain('token');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token-here')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('AUTH_SESSION_INVALID');
        });

        it('should reject request with malformed authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'InvalidFormat')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/auth/profile', () => {
        let token;
        let userId;

        beforeEach(async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });

            userId = user._id;

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            token = response.body.data.token;
        });

        it('should update username successfully', async () => {
            const respone = await request(app)
                .put('/api/auth/profile')
                .set('Authorization',  `Bearer ${token}`)
                .send({ username: 'updateuser' })
                .expect(200);

            expect(respone.body.success).toBe(true);
            expect(respone.body.message).toBe('Profile updated successfully');
            expect(respone.body.data.username).toBe('updateuser');
        });

        it('should reject duplicate username', async () => {
            await User.create({
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'Test123!'
            });

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ username: 'existinguser' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Username already taken');
        });

        it('should reject unauthorized request', async () => {
            const response = await request(app)
                .put('/api/auth/profile')
                .send({ username: 'hacker' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/auth/change-password', () => {
        let token;

        beforeEach(async () => {
            await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            token = response.body.data.token;
        });

        it('should change password successfully', async () => {
            const respone = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'Test123!',
                    newPassword: 'NewTest123!'
                })
                .expect(200);

            expect(respone.body.success).toBe(true);
            expect(respone.body.message).toBe('Password changed successfully');
            expect(respone.body.data).toHaveProperty('token');

            const loginRespone = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'NewTest123!'
                })
                .expect(200);
            
            expect(loginRespone.body.success).toBe(true);
        });

        it('should reject incorrect current password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'WrongPassword123!',
                    newPassword: 'NewTest123!'
                })
                .expect(401);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Current password is incorrect');
            expect(response.body).not.toHaveProperty('code');
            await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });

        it('should reject weak new password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'Test123!',
                    newPassword: 'weak'
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
        });

        it('should reject request without new password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'Test123!'
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
        });

        it('should reject unauthorized request', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .send({
                    currentPassword: 'Test123!',
                    newPassword: 'NewTest123!'
                })
                .expect(401);
            
            expect(response.body.success).toBe(false);
        });

        it('should invalidate old password after change', async () => {
            await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'Test123!',
                    newPassword: 'NewTest123!'
                })
                .expect(200);

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!'
                })
                .expect(401);

            expect(loginResponse.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        let token;

        beforeEach(async () => {
            await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            token = response.body.data.token;
        });

        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successfully');
        });

        it('should reject unauthorized logout', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('tokenVersion sessions', () => {
        const credentials = { email: 'session@example.com', password: 'Test123!' };
        const loginSession = () => request(app).post('/api/auth/login').send(credentials);
        const profileWith = (token) => request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`);

        beforeEach(async () => {
            await User.create({
                username: 'sessionuser',
                ...credentials
            });
        });

        it('issues a login JWT with version 0', async () => {
            const response = await loginSession().expect(200);
            const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET);

            expect(decoded.id).toBe(response.body.data.user.id);
            expect(decoded.tokenVersion).toBe(0);
            expect(response.body.data.user).not.toHaveProperty('tokenVersion');
        });

        it('marks an expired JWT as an invalid session', async () => {
            const user = await User.findOne({ email: credentials.email });
            const expiredToken = jwt.sign(
                { id: user._id.toString(), tokenVersion: 0 },
                process.env.JWT_SECRET,
                { expiresIn: -1 }
            );

            const response = await profileWith(expiredToken).expect(401);
            expect(response.body.code).toBe('AUTH_SESSION_INVALID');
        });

        it('revokes the token used to log out', async () => {
            const tokenA = (await loginSession().expect(200)).body.data.token;
            await profileWith(tokenA).expect(200);

            await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200);

            const rejected = await profileWith(tokenA).expect(401);
            expect(rejected.body.message).toBe('Session is no longer valid');
            expect(rejected.body.code).toBe('AUTH_SESSION_INVALID');
        });

        it('revokes all tokens issued for the account', async () => {
            const tokenA = (await loginSession().expect(200)).body.data.token;
            const tokenB = (await loginSession().expect(200)).body.data.token;
            await profileWith(tokenA).expect(200);
            await profileWith(tokenB).expect(200);

            await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200);

            await profileWith(tokenA).expect(401);
            await profileWith(tokenB).expect(401);
        });

        it('rotates the token and password together', async () => {
            const tokenA = (await loginSession().expect(200)).body.data.token;
            const changed = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    currentPassword: 'Test123!',
                    newPassword: 'NewTest123!'
                })
                .expect(200);
            const tokenB = changed.body.data.token;

            expect(jwt.verify(tokenB, process.env.JWT_SECRET).tokenVersion).toBe(1);
            expect(changed.body.data.user).not.toHaveProperty('tokenVersion');
            await profileWith(tokenA).expect(401);
            await profileWith(tokenB).expect(200);
            await loginSession().expect(401);
            await request(app)
                .post('/api/auth/login')
                .send({ email: credentials.email, password: 'NewTest123!' })
                .expect(200);
        });

        it('rejects a correctly signed pre-remediation token', async () => {
            const user = await User.findOne({ email: credentials.email });
            const oldToken = jwt.sign(
                { id: user._id.toString() },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const rejected = await profileWith(oldToken).expect(401);
            expect(rejected.body.message).toBe('Session is no longer valid');
            expect(rejected.body.code).toBe('AUTH_SESSION_INVALID');
        });

        it('accepts and revokes a user without a physical tokenVersion field', async () => {
            await User.collection.updateOne(
                { email: credentials.email },
                { $unset: { tokenVersion: '' } }
            );
            const rawBefore = await User.collection.findOne({ email: credentials.email });
            expect(rawBefore).not.toHaveProperty('tokenVersion');

            const token = (await loginSession().expect(200)).body.data.token;
            expect(jwt.verify(token, process.env.JWT_SECRET).tokenVersion).toBe(0);
            await profileWith(token).expect(200);

            await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const rawAfter = await User.collection.findOne({ email: credentials.email });
            expect(rawAfter.tokenVersion).toBe(1);
            await profileWith(token).expect(401);
        });

        it('does not persist a stale password change after a concurrent version increment', async () => {
            const token = (await loginSession().expect(200)).body.data.token;
            const before = await User.findOne({ email: credentials.email }).select('+password');
            const originalHash = before.password;
            const realComparePassword = User.prototype.comparePassword;
            let incremented = false;
            const compareSpy = jest.spyOn(User.prototype, 'comparePassword')
                .mockImplementation(async function (candidate) {
                    const valid = await realComparePassword.call(this, candidate);
                    if (valid && !incremented) {
                        expect(this.tokenVersion).toBe(0);
                        const result = await User.updateOne(
                            { _id: this._id },
                            { $inc: { tokenVersion: 1 } }
                        );
                        expect(result.matchedCount).toBe(1);
                        incremented = true;
                    }
                    return valid;
                });

            let response;
            try {
                response = await request(app)
                    .put('/api/auth/change-password')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        currentPassword: 'Test123!',
                        newPassword: 'NewTest123!'
                    })
                    .expect(401);
            } finally {
                compareSpy.mockRestore();
            }

            expect(incremented).toBe(true);
            expect(response.body).not.toHaveProperty('data.token');
            const persisted = await User.findOne({ email: credentials.email })
                .select('+password +tokenVersion');
            expect(persisted.tokenVersion).toBe(1);
            expect(persisted.password).toBe(originalHash);
            expect(await persisted.comparePassword('Test123!')).toBe(true);
            expect(await persisted.comparePassword('NewTest123!')).toBe(false);
        });
    });
});
