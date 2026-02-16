import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import { clearTestDB, setupTestDB, teardownTestDB } from '../setup/testSetup';

describe('User Management API Integration Tests', () => {
    let adminToken;
    let userToken;
    let adminId;
    let normalUserId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'Admin123!',
            role: 'admin'
        });
        adminId = admin._id;

        const user = await User.create({
            username: 'normaluser',
            email: 'user@example.com',
            password: 'User123!'
        });
        normalUserId = user._id;

        const adminResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'Admin123!'
            });
        adminToken = adminResponse.body.data.token;

        const userResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'user@example.com',
                password: 'User123!'
            });
        userToken = userResponse.body.data.token;
    });

    describe('GET /api/users', () => {
        it('should get all users as admin', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('page');
            expect(response.body.pagination).toHaveProperty('pages');
            expect(response.body.pagination).toHaveProperty('limit');
        });

        it('should reject non-admin user', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthorized request', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should filters users by search query', async () => {
            await User.create({
                username: 'searchableuser',
                email: 'searchable@example.com',
                password: 'Test123!'
            });

            const response = await request(app)
                .get('/api/users?search=searchable')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.some(u => u.username.includes('searchable'))).toBe(true);
        });

        it('should search by email', async () => {
            const response = await request(app)
                .get('/api/users?search=user@example.com')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should filter by active status', async () => {
            await User.create({
                username: 'inactiveuser',
                email: 'inactive@example.com',
                password: 'Test123!',
                isActive: false
            });

            const response = await request(app)
                .get('/api/users?isActive=false')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.some(u => !u.isActive)).toBe(true);
        });

        it('should paginate results', async () => {
            for (let i = 0; i < 15; i++) {
                await User.create({
                    username: `user${i}`,
                    email: `user${i}@example.com`,
                    password: 'Test123!'
                });
            }

            const response = await request(app)
                .get('/api/users?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(10);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.pages).toBeGreaterThan(1);
        });

        it('should get second page of results', async () => {
            for (let i = 0; i < 15; i++) {
                await User.create({
                    username: `user${i}`,
                    email: `user${i}@example.com`,
                    password: 'Test123!'
                });
            }

            const response = await request(app)
                .get('/api/users?page=2&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.page).toBe(2);
        });

        it('should not include password in response', async () => {
            const respone = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(respone.body.data.every(u => !u.password)).toBe(true);
        });

        it('should sort users by creation date descending', async () => {
            await User.create({
                username: 'user1',
                email: 'user1@example.com',
                password: 'Test123!'
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            await User.create({
                username: 'user2',
                email: 'user2@example.com',
                password: 'Test123!'
            });

            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const dates = response.body.data.map(u => new Date(u.createdAt).getTime());
            for (let i = 0; i < dates.length - 1; i++) {
                expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
            }
        });
    });

    describe('GET /api/users/:id', () => {
        it('should get user by ID as admin', async () => {
            const response = await request(app)
                .get(`/api/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('username', 'normaluser');
            expect(response.body.data).toHaveProperty('email', 'user@example.com');
            expect(response.body.data).not.toHaveProperty('password');
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should reject non-admin user', async () => {
            const response = await request(app)
                .get(`/api/users/${normalUserId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthorized request', async () => {
            const response = await request(app)
                .get(`/api/users/${normalUserId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should handle invalid MongoDB ObjectId', async () => {
            const response = await request(app)
                .get('/api/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete user as admin', async () => {
            const response = await request(app)
                .delete(`/api/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');

            const deletedUser = await User.findById(normalUserId);
            expect(deletedUser).toBeNull();
        });

        it('should prevent admin from deleting themselves', async () => {
            const response = await request(app)
                .delete(`/api/users/${adminId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Cannot delete your own account');

            const admin = await User.findById(adminId);
            expect(admin).not.toBeNull();
        });

        it('should return 404 when deleting non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .delete(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should reject non-admin user deletion attempt', async () => {
            const response = await request(app)
                .delete(`/api/users/${normalUserId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);

            const user = await User.findById(normalUserId);
            expect(user).not.toBeNull();
        });

        it('should reject unauthorized deletion request', async () => {
            const response = await request(app)
                .delete(`/api/users/${normalUserId}`)
                .expect(401);

            expect(response.body.success).toBe(false);

            const user = await User.findById(normalUserId);
            expect(user).not.toBeNull();
        });
    });

    describe('User Management Workflow', () => {
        it('should complete full admin workflow', async () => {
            // 1. Get all users
            const getAllResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const initialCount = getAllResponse.body.pagination.total;

            // 2. Get specific user
            await request(app)
                .get(`/api/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // 3. Search for user
            const searchResponse = await request(app)
                .get('/api/users?search=normaluser')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(searchResponse.body.data.length).toBeGreaterThan(0);

            // 4. Delete user
            await request(app)
                .delete(`/api/users/${normalUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // 5. Verify user count decreased
            const finalGetAllResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(finalGetAllResponse.body.pagination.total).toBe(initialCount - 1);
        });
    });
})