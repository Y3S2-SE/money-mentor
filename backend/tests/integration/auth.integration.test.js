import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
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
        });

        it('should register user with admin role when specified', async () => {
            const userData = {
                username: 'adminuser',
                email: 'admin@example.com',
                password: 'Test123!',
                role: 'admin'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201)

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.role).toBe('admin');
        });

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
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('token');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token-here')
                .expect(401);

            expect(response.body.success).toBe(false);
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
});