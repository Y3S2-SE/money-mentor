import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Transaction from '../../models/transaction.model.js';
import User from '../../models/user.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';

describe('Transaction API Integration Tests', () => {
    let userToken;
    let userId;
    let otherUserToken;
    let otherUserId;
    let transactionId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        // Register primary user
        const userRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'testuser@test.com', password: 'Test123!' });
        userToken = userRes.body.data.token;
        userId = userRes.body.data.user.id;

        // Register a second user for isolation tests
        const otherRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'otheruser', email: 'otheruser@test.com', password: 'Test123!' });
        otherUserToken = otherRes.body.data.token;
        otherUserId = otherRes.body.data.user.id;
    });

    // -----------------------------------------------
    // POST /api/transactions
    // -----------------------------------------------
    describe('POST /api/transactions', () => {
        it('should create an income transaction and persist it to the database', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    type: 'income',
                    amount: 50000,
                    category: 'Salary',
                    description: 'Monthly salary',
                    date: '2026-02-01'
                })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Transaction created successfully');
            expect(res.body.data.type).toBe('income');
            expect(res.body.data.amount).toBe(50000);
            expect(res.body.data.category).toBe('Salary');
            expect(res.body.data.description).toBe('Monthly salary');
            expect(res.body.data.userId).toBe(userId);

            // Verify persisted in DB
            const saved = await Transaction.findById(res.body.data._id);
            expect(saved).not.toBeNull();
            expect(saved.amount).toBe(50000);
            expect(saved.type).toBe('income');
        });

        it('should create an expense transaction and persist it to the database', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    type: 'expense',
                    amount: 1500,
                    category: 'Transport',
                    date: '2026-02-10'
                })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.type).toBe('expense');

            // Verify persisted in DB
            const saved = await Transaction.findById(res.body.data._id);
            expect(saved).not.toBeNull();
            expect(saved.type).toBe('expense');
        });

        it('should default description to empty string when not provided', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    type: 'expense',
                    amount: 500,
                    category: 'Food',
                    date: '2026-02-05'
                })
                .expect(201);

            expect(res.body.data.description).toBe('');

            // Verify in DB
            const saved = await Transaction.findById(res.body.data._id);
            expect(saved.description).toBe('');
        });

        it('should assign the correct userId from the token', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    type: 'income',
                    amount: 10000,
                    category: 'Freelance',
                    date: '2026-02-15'
                })
                .expect(201);

            const saved = await Transaction.findById(res.body.data._id);
            expect(saved.userId.toString()).toBe(userId);
        });

        it('should reject transaction with missing type', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 500, category: 'Food', date: '2026-02-05' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].field).toBe('type');

            // Verify nothing saved to DB
            const count = await Transaction.countDocuments({ userId });
            expect(count).toBe(0);
        });

        it('should reject transaction with invalid type', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'savings', amount: 500, category: 'Food', date: '2026-02-05' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should reject transaction with missing amount', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'expense', category: 'Food', date: '2026-02-05' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].field).toBe('amount');
        });

        it('should reject transaction with zero amount', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'expense', amount: 0, category: 'Food', date: '2026-02-05' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should reject transaction with negative amount', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'expense', amount: -500, category: 'Food', date: '2026-02-05' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should reject transaction with missing category', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'expense', amount: 500, date: '2026-02-05' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].field).toBe('category');
        });

        it('should reject transaction with missing date', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'expense', amount: 500, category: 'Food' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].field).toBe('date');
        });

        it('should reject transaction with invalid calendar date', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'expense', amount: 500, category: 'Food', date: '2026-02-30' })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should reject transaction with date beyond current month', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'expense', amount: 500, category: 'Food', date: '2027-06-01' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].message).toBe('Transaction date cannot be beyond the current month');
        });

        it('should reject unauthenticated request with 401', async () => {
            await request(app)
                .post('/api/transactions')
                .send({ type: 'expense', amount: 500, category: 'Food', date: '2026-02-05' })
                .expect(401);
        });
    });

    // -----------------------------------------------
    // GET /api/transactions
    // -----------------------------------------------
    describe('GET /api/transactions', () => {
        beforeEach(async () => {
            // Seed transactions for primary user directly into DB
            await Transaction.insertMany([
                { userId, type: 'income', amount: 50000, category: 'Salary', date: new Date('2026-02-01') },
                { userId, type: 'expense', amount: 1500, category: 'Transport', date: new Date('2026-02-10') },
                { userId, type: 'expense', amount: 500, category: 'Food', date: new Date('2026-02-15') },
                { userId, type: 'income', amount: 10000, category: 'Freelance', date: new Date('2026-01-20') },
                { userId, type: 'expense', amount: 2000, category: 'Food', date: new Date('2025-12-05') },
            ]);

            // Seed a transaction for other user - should not appear in primary user results
            await Transaction.create({
                userId: otherUserId,
                type: 'income',
                amount: 30000,
                category: 'Salary',
                date: new Date('2026-02-01')
            });
        });

        it('should return only transactions belonging to the authenticated user', async () => {
            const res = await request(app)
                .get('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(5);
            res.body.data.forEach(t => {
                expect(t.userId).toBe(userId);
            });
        });

        it('should not return other users transactions', async () => {
            const res = await request(app)
                .get('/api/transactions')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].userId).toBe(otherUserId);
        });

        it('should filter by type income', async () => {
            const res = await request(app)
                .get('/api/transactions?type=income')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(2);
            res.body.data.forEach(t => expect(t.type).toBe('income'));
        });

        it('should filter by type expense', async () => {
            const res = await request(app)
                .get('/api/transactions?type=expense')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(3);
            res.body.data.forEach(t => expect(t.type).toBe('expense'));
        });

        it('should filter by month', async () => {
            const res = await request(app)
                .get('/api/transactions?month=2026-02')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(3);
            res.body.data.forEach(t => {
                expect(new Date(t.date).getMonth()).toBe(1); // February = index 1
            });
        });

        it('should filter by year', async () => {
            const res = await request(app)
                .get('/api/transactions?year=2026')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(4);
            res.body.data.forEach(t => {
                expect(new Date(t.date).getFullYear()).toBe(2026);
            });
        });

        it('should filter by exact date', async () => {
            const res = await request(app)
                .get('/api/transactions?date=2026-02-10')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].category).toBe('Transport');
        });

        it('should filter by category case insensitively', async () => {
            const res = await request(app)
                .get('/api/transactions?category=food')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(2);
            res.body.data.forEach(t => {
                expect(t.category.toLowerCase()).toBe('food');
            });
        });

        it('should return transactions sorted by date descending', async () => {
            const res = await request(app)
                .get('/api/transactions')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const dates = res.body.data.map(t => new Date(t.date).getTime());
            for (let i = 0; i < dates.length - 1; i++) {
                expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
            }
        });

        it('should support pagination and return correct metadata', async () => {
            const res = await request(app)
                .get('/api/transactions?page=1&limit=2')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(2);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(2);
            expect(res.body.pagination.total).toBe(5);
            expect(res.body.pagination.totalPages).toBe(3);
        });

        it('should return correct second page', async () => {
            const res = await request(app)
                .get('/api/transactions?page=2&limit=2')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(2);
            expect(res.body.pagination.page).toBe(2);
        });

        it('should return empty array when no transactions match filter', async () => {
            const res = await request(app)
                .get('/api/transactions?month=2020-01')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(0);
            expect(res.body.pagination.total).toBe(0);
        });

        it('should reject invalid type filter with 400', async () => {
            const res = await request(app)
                .get('/api/transactions?type=savings')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should reject unauthenticated request with 401', async () => {
            await request(app)
                .get('/api/transactions')
                .expect(401);
        });
    });

    // -----------------------------------------------
    // GET /api/transactions/:id
    // -----------------------------------------------
    describe('GET /api/transactions/:id', () => {
        beforeEach(async () => {
            const transaction = await Transaction.create({
                userId,
                type: 'income',
                amount: 50000,
                category: 'Salary',
                date: new Date('2026-02-01')
            });
            transactionId = transaction._id.toString();
        });

        it('should return the correct transaction by id', async () => {
            const res = await request(app)
                .get(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(transactionId);
            expect(res.body.data.amount).toBe(50000);
            expect(res.body.data.category).toBe('Salary');
            expect(res.body.data.userId).toBe(userId);
        });

        it('should not return another users transaction', async () => {
            await request(app)
                .get(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(404);
        });

        it('should return 404 for non-existent transaction', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await request(app)
                .get(`/api/transactions/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });

        it('should return 400 for invalid mongo id format', async () => {
            const res = await request(app)
                .get('/api/transactions/invalid-id')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should reject unauthenticated request with 401', async () => {
            await request(app)
                .get(`/api/transactions/${transactionId}`)
                .expect(401);
        });
    });

    // -----------------------------------------------
    // PUT /api/transactions/:id
    // -----------------------------------------------
    describe('PUT /api/transactions/:id', () => {
        beforeEach(async () => {
            const transaction = await Transaction.create({
                userId,
                type: 'expense',
                amount: 500,
                category: 'Food',
                description: 'Lunch',
                date: new Date('2026-02-05')
            });
            transactionId = transaction._id.toString();
        });

        it('should update amount and persist change to database', async () => {
            const res = await request(app)
                .put(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 1000 })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.amount).toBe(1000);

            // Verify persisted in DB
            const updated = await Transaction.findById(transactionId);
            expect(updated.amount).toBe(1000);
        });

        it('should update category and persist change to database', async () => {
            const res = await request(app)
                .put(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ category: 'Transport' })
                .expect(200);

            expect(res.body.data.category).toBe('Transport');

            const updated = await Transaction.findById(transactionId);
            expect(updated.category).toBe('Transport');
        });

        it('should update type and persist change to database', async () => {
            const res = await request(app)
                .put(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ type: 'income' })
                .expect(200);

            expect(res.body.data.type).toBe('income');

            const updated = await Transaction.findById(transactionId);
            expect(updated.type).toBe('income');
        });

        it('should update description and persist change to database', async () => {
            const res = await request(app)
                .put(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ description: 'Dinner' })
                .expect(200);

            expect(res.body.data.description).toBe('Dinner');

            const updated = await Transaction.findById(transactionId);
            expect(updated.description).toBe('Dinner');
        });

        it('should not allow another user to update the transaction', async () => {
            await request(app)
                .put(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .send({ amount: 9999 })
                .expect(404);

            // Verify original data unchanged in DB
            const unchanged = await Transaction.findById(transactionId);
            expect(unchanged.amount).toBe(500);
        });

        it('should reject update with date beyond current month', async () => {
            const res = await request(app)
                .put(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ date: '2027-06-01' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].message).toBe('Transaction date cannot be beyond the current month');
        });

        it('should reject update with negative amount', async () => {
            const res = await request(app)
                .put(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: -100 })
                .expect(400);

            expect(res.body.success).toBe(false);
        });

        it('should return 404 for non-existent transaction', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await request(app)
                .put(`/api/transactions/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 1000 })
                .expect(404);
        });

        it('should return 400 for invalid mongo id format', async () => {
            await request(app)
                .put('/api/transactions/invalid-id')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 1000 })
                .expect(400);
        });

        it('should reject unauthenticated request with 401', async () => {
            await request(app)
                .put(`/api/transactions/${transactionId}`)
                .send({ amount: 1000 })
                .expect(401);
        });
    });

    // -----------------------------------------------
    // DELETE /api/transactions/:id
    // -----------------------------------------------
    describe('DELETE /api/transactions/:id', () => {
        beforeEach(async () => {
            const transaction = await Transaction.create({
                userId,
                type: 'expense',
                amount: 500,
                category: 'Food',
                date: new Date('2026-02-05')
            });
            transactionId = transaction._id.toString();
        });

        it('should delete transaction and remove it from the database', async () => {
            const res = await request(app)
                .delete(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Transaction deleted successfully');

            // Verify removed from DB
            const deleted = await Transaction.findById(transactionId);
            expect(deleted).toBeNull();
        });

        it('should not allow another user to delete the transaction', async () => {
            await request(app)
                .delete(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(404);

            // Verify still exists in DB
            const stillExists = await Transaction.findById(transactionId);
            expect(stillExists).not.toBeNull();
        });

        it('should return 404 after deleting the same transaction twice', async () => {
            await request(app)
                .delete(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`);

            await request(app)
                .delete(`/api/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });

        it('should return 404 for non-existent transaction', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            await request(app)
                .delete(`/api/transactions/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });

        it('should return 400 for invalid mongo id format', async () => {
            await request(app)
                .delete('/api/transactions/invalid-id')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(400);
        });

        it('should reject unauthenticated request with 401', async () => {
            await request(app)
                .delete(`/api/transactions/${transactionId}`)
                .expect(401);
        });
    });
});