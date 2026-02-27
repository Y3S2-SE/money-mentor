import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import Course from '../../models/course.model.js';
import { clearTestDB, setupTestDB, teardownTestDB } from '../setup/testSetup.js';

describe('Course API Integration Tests', () => {
    let adminToken;
    let userToken;
    let adminId;
    let userId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        // Create admin
        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'Admin123!',
            role: 'admin'
        });
        adminId = admin._id;

        // Create regular user
        const user = await User.create({
            username: 'normaluser',
            email: 'user@example.com',
            password: 'User123!'
        });
        userId = user._id;

        // Login admin
        const adminRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'Admin123!' });
        adminToken = adminRes.body.data.token;

        // Login user
        const userRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@example.com', password: 'User123!' });
        userToken = userRes.body.data.token;
    });

    // Reusable valid course payload
    const validCoursePayload = (overrides = {}) => ({
        title: 'Budgeting Basics',
        description: 'Learn how to manage your monthly budget effectively.',
        category: 'budgeting',
        difficulty: 'beginner',
        passingScore: 70,
        questions: [
            {
                question: 'What is the 50/30/20 rule?',
                options: ['50% needs, 30% wants, 20% savings', '50% savings, 30% needs, 20% wants', '50% wants, 30% savings, 20% needs'],
                correctAnswerIndex: 0,
                explanation: 'The 50/30/20 rule splits income into needs, wants, and savings.',
                points: 10
            },
            {
                question: 'Which of these is a fixed expense?',
                options: ['Groceries', 'Rent', 'Entertainment'],
                correctAnswerIndex: 1,
                explanation: 'Rent stays the same every month.',
                points: 10
            }
        ],
        ...overrides
    });

    // ── POST /api/course ────────────────────────────────────────
    describe('POST /api/course/create', () => {
        it('should create a course as admin', async () => {
            const response = await request(app)
                .post('/api/course/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCoursePayload())
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Course created successfully');
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.title).toBe('Budgeting Basics');
            expect(response.body.data.isPublished).toBe(false);
            expect(response.body.data.totalPoints).toBe(20);
            expect(response.body.data.createdBy.toString()).toBe(adminId.toString());
        });

        it('should reject course creation by regular user', async () => {
            const response = await request(app)
                .post('/api/course/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send(validCoursePayload())
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should reject course creation without token', async () => {
            const response = await request(app)
                .post('/api/course/create')
                .send(validCoursePayload())
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject course without title', async () => {
            const response = await request(app)
                .post('/api/course/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCoursePayload({ title: undefined }))
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        it('should reject course without questions', async () => {
            const response = await request(app)
                .post('/api/course/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCoursePayload({ questions: [] }))
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        it('should reject invalid category', async () => {
            const response = await request(app)
                .post('/api/course/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCoursePayload({ category: 'crypto' }))
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        it('should auto-calculate totalPoints from questions', async () => {
            const response = await request(app)
                .post('/api/course/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCoursePayload())
                .expect(201);

            expect(response.body.data.totalPoints).toBe(20);
        });
    });

    // ── GET /api/course ─────────────────────────────────────────
    describe('GET /api/course', () => {
        beforeEach(async () => {
            // Create a published and an unpublished course
            await Course.create({
                ...validCoursePayload(),
                createdBy: adminId,
                isPublished: true
            });
            await Course.create({
                ...validCoursePayload({ title: 'Draft Course' }),
                createdBy: adminId,
                isPublished: false
            });
        });

        it('should return all courses including drafts for admin', async () => {
            const response = await request(app)
                .get('/api/course')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        it('should return only published courses for regular user', async () => {
            const response = await request(app)
                .get('/api/course')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].isPublished).toBe(true);
        });

        it('should reject unauthenticated request', async () => {
            const response = await request(app)
                .get('/api/course')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not include correctAnswerIndex in list response', async () => {
            const response = await request(app)
                .get('/api/course')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const questions = response.body.data[0].questions;
            questions.forEach(q => {
                expect(q).not.toHaveProperty('correctAnswerIndex');
            });
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/course?page=1&limit=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(1);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('pages');
        });

        it('should filter by category', async () => {
            const response = await request(app)
                .get('/api/course?category=budgeting')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach(c => expect(c.category).toBe('budgeting'));
        });

        it('should filter by difficulty', async () => {
            const response = await request(app)
                .get('/api/course?difficulty=beginner')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            response.body.data.forEach(c => expect(c.difficulty).toBe('beginner'));
        });

        it('should search by title', async () => {
            const response = await request(app)
                .get('/api/course?search=Budgeting')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.some(c => c.title.includes('Budgeting'))).toBe(true);
        });
    });

    // ── GET /api/course/:id ─────────────────────────────────────
    describe('GET /api/course/:id', () => {
        let publishedCourseId;
        let draftCourseId;

        beforeEach(async () => {
            const published = await Course.create({
                ...validCoursePayload(),
                createdBy: adminId,
                isPublished: true
            });
            publishedCourseId = published._id;

            const draft = await Course.create({
                ...validCoursePayload({ title: 'Draft Course' }),
                createdBy: adminId,
                isPublished: false
            });
            draftCourseId = draft._id;
        });

        it('should get published course as user without answers', async () => {
            const response = await request(app)
                .get(`/api/course/${publishedCourseId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.questions.forEach(q => {
                expect(q).not.toHaveProperty('correctAnswerIndex');
                expect(q).not.toHaveProperty('explanation');
            });
        });

        it('should get course with answers as admin', async () => {
            const response = await request(app)
                .get(`/api/course/${publishedCourseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.questions.forEach(q => {
                expect(q).toHaveProperty('correctAnswerIndex');
                expect(q).toHaveProperty('explanation');
            });
        });

        it('should return 404 for draft course when accessed by user', async () => {
            const response = await request(app)
                .get(`/api/course/${draftCourseId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return draft course for admin', async () => {
            const response = await request(app)
                .get(`/api/course/${draftCourseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isPublished).toBe(false);
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/course/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .get(`/api/course/${publishedCourseId}`)
                .expect(401);
        });
    });

    // ── PUT /api/course/:id ─────────────────────────────────────
    describe('PUT /api/course/:id', () => {
        let courseId;

        beforeEach(async () => {
            const course = await Course.create({
                ...validCoursePayload(),
                createdBy: adminId
            });
            courseId = course._id;
        });

        it('should update course as admin', async () => {
            const response = await request(app)
                .put(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Updated Title', isPublished: true })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Title');
            expect(response.body.data.isPublished).toBe(true);
        });

        it('should publish a course', async () => {
            const response = await request(app)
                .put(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isPublished: true })
                .expect(200);

            expect(response.body.data.isPublished).toBe(true);
        });

        it('should reject update by regular user', async () => {
            const response = await request(app)
                .put(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'Hacked' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .put(`/api/course/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Updated' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .put(`/api/course/${courseId}`)
                .send({ title: 'Updated' })
                .expect(401);
        });
    });

    // ── DELETE /api/course/:id ──────────────────────────────────
    describe('DELETE /api/course/:id', () => {
        let courseId;

        beforeEach(async () => {
            const course = await Course.create({
                ...validCoursePayload(),
                createdBy: adminId
            });
            courseId = course._id;
        });

        it('should delete course as admin', async () => {
            const response = await request(app)
                .delete(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Course deleted successfully');

            const deleted = await Course.findById(courseId);
            expect(deleted).toBeNull();
        });

        it('should reject delete by regular user', async () => {
            const response = await request(app)
                .delete(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);

            const stillExists = await Course.findById(courseId);
            expect(stillExists).not.toBeNull();
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .delete(`/api/course/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .delete(`/api/course/${courseId}`)
                .expect(401);
        });
    });

    // ── POST /api/course/:id/submit ─────────────────────────────
    describe('POST /api/course/:id/submit', () => {
        let courseId;

        beforeEach(async () => {
            const course = await Course.create({
                ...validCoursePayload(),
                createdBy: adminId,
                isPublished: true
            });
            courseId = course._id;
        });

        it('should submit correct answers and pass', async () => {
            const response = await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.passed).toBe(true);
            expect(response.body.data.score).toBe(100);
            expect(response.body.data.pointsEarned).toBe(20);
        });

        it('should submit wrong answers and fail', async () => {
            const response = await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [1, 0] })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.passed).toBe(false);
            expect(response.body.data.pointsEarned).toBe(0);
        });

        it('should not award points on fail', async () => {
            await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [1, 0] });

            const user = await User.findById(userId);
            expect(user.points || 0).toBe(0);
        });

        it('should award points to user on pass', async () => {
            await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] });

            const user = await User.findById(userId);
            expect(user.points).toBe(20);
        });

        it('should record completion in course', async () => {
            await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] });

            const course = await Course.findById(courseId);
            expect(course.completions).toHaveLength(1);
            expect(course.completions[0].user.toString()).toBe(userId.toString());
        });

        it('should prevent submitting twice', async () => {
            await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] });

            const response = await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already completed');
        });

        it('should reject wrong number of answers', async () => {
            const response = await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0] })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject submit on unpublished course', async () => {
            const draft = await Course.create({
                ...validCoursePayload({ title: 'Draft' }),
                createdBy: adminId,
                isPublished: false
            });

            const response = await request(app)
                .post(`/api/course/${draft._id}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated submit', async () => {
            await request(app)
                .post(`/api/course/${courseId}/submit`)
                .send({ answers: [0, 1] })
                .expect(401);
        });

        it('should return per-question results', async () => {
            const response = await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] })
                .expect(200);

            expect(response.body.data.results).toHaveLength(2);
            response.body.data.results.forEach(r => {
                expect(r).toHaveProperty('question');
                expect(r).toHaveProperty('isCorrect');
                expect(r).toHaveProperty('correctIndex');
            });
        });
    });

    // ── Full Workflow ────────────────────────────────────────────
    describe('Course Workflow', () => {
        it('should complete full admin and user workflow', async () => {
            // Admin creates course
            const createRes = await request(app)
                .post('/api/course/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCoursePayload())
                .expect(201);

            const courseId = createRes.body.data._id;

            // User cannot see unpublished course
            await request(app)
                .get(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            // Admin publishes it
            await request(app)
                .put(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isPublished: true })
                .expect(200);

            // User can now see it
            await request(app)
                .get(`/api/course/${courseId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // User submits and passes
            const submitRes = await request(app)
                .post(`/api/course/${courseId}/submit`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ answers: [0, 1] })
                .expect(200);

            expect(submitRes.body.data.passed).toBe(true);
            expect(submitRes.body.data.pointsEarned).toBe(20);
        });
    });
});