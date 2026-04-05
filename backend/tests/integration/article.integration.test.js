import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import Article from '../../models/article.model.js';
import { clearTestDB, setupTestDB, teardownTestDB } from '../setup/testSetup.js';

describe('Article API Integration Tests', () => {
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

    const validArticlePayload = (overrides = {}) => ({
        title: 'Mastering Budgeting',
        summary: 'A comprehensive guide to managing your finances.',
        content: JSON.stringify([
            { text: 'This is a test article about budgeting. It needs to be long enough to have a read time calculation that we can test easily.' },
            { text: 'Adding more text to reach a certain word count. Budgeting is important for financial health.' }
        ]),
        category: 'budgeting',
        difficulty: 'beginner',
        pointsPerRead: 15,
        ...overrides
    });

    // ── POST /api/articles/create ────────────────────────────────
    describe('POST /api/articles/create', () => {
        it('should create an article as admin', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload())
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Mastering Budgeting');
            expect(response.body.data.createdBy.toString()).toBe(adminId.toString());
        });

        it('should reject creation by regular user', async () => {
            await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send(validArticlePayload())
                .expect(403);
        });

        it('should reject unauthorized request', async () => {
            await request(app)
                .post('/api/articles/create')
                .send(validArticlePayload())
                .expect(401);
        });
    });

    // ── GET /api/articles ─────────────────────────────────────────
    describe('GET /api/articles', () => {
        beforeEach(async () => {
            await Article.create({
                ...validArticlePayload({ content: [{ text: 'Published' }] }),
                createdBy: adminId,
                isPublished: true
            });
            await Article.create({
                ...validArticlePayload({ title: 'Draft', content: [{ text: 'Draft' }] }),
                createdBy: adminId,
                isPublished: false
            });
        });

        it('should return all articles for admin', async () => {
            const response = await request(app)
                .get('/api/articles')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBe(2);
        });

        it('should return only published articles for user', async () => {
            const response = await request(app)
                .get('/api/articles')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].isPublished).toBe(true);
        });

        it('should mark articles as read for the current user', async () => {
            const article = await Article.findOne({ isPublished: true });
            article.completions.push({ user: userId, pointsEarned: 15, timeSpentSeconds: 100 });
            await article.save();

            const response = await request(app)
                .get('/api/articles')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const fetchedArticle = response.body.data.find(a => a._id === article._id.toString());
            expect(fetchedArticle.isRead).toBe(true);
        });
    });

    // ── GET /api/articles/:id ─────────────────────────────────────
    describe('GET /api/articles/:id', () => {
        let articleId;
        let draftId;

        beforeEach(async () => {
            const article = await Article.create({
                ...validArticlePayload({ content: [{ text: 'Published' }] }),
                createdBy: adminId,
                isPublished: true
            });
            articleId = article._id;

            const draft = await Article.create({
                ...validArticlePayload({ title: 'Draft', content: [{ text: 'Draft' }] }),
                createdBy: adminId,
                isPublished: false
            });
            draftId = draft._id;
        });

        it('should return published article for user', async () => {
            const response = await request(app)
                .get(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(articleId.toString());
            expect(response.body.data).toHaveProperty('isRead');
        });

        it('should return 404 for draft article for user', async () => {
            await request(app)
                .get(`/api/articles/${draftId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });

        it('should return draft article for admin', async () => {
            const response = await request(app)
                .get(`/api/articles/${draftId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data._id).toBe(draftId.toString());
        });
    });

    // ── PUT /api/articles/:id ─────────────────────────────────────
    describe('PUT /api/articles/:id', () => {
        let articleId;

        beforeEach(async () => {
            const article = await Article.create({
                ...validArticlePayload({ content: [{ text: 'Original content' }] }),
                createdBy: adminId
            });
            articleId = article._id;
        });

        it('should update article as admin', async () => {
            const response = await request(app)
                .put(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Updated Title', isPublished: true })
                .expect(200);

            expect(response.body.data.title).toBe('Updated Title');
            expect(response.body.data.isPublished).toBe(true);
        });

        it('should reject update by user', async () => {
            await request(app)
                .put(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'Hacked' })
                .expect(403);
        });
    });

    // ── DELETE /api/articles/:id ──────────────────────────────────
    describe('DELETE /api/articles/:id', () => {
        let articleId;

        beforeEach(async () => {
            const article = await Article.create({
                ...validArticlePayload({ content: [{ text: 'Content' }] }),
                createdBy: adminId
            });
            articleId = article._id;
        });

        it('should delete article as admin', async () => {
            await request(app)
                .delete(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const deleted = await Article.findById(articleId);
            expect(deleted).toBeNull();
        });

        it('should reject delete by user', async () => {
            await request(app)
                .delete(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    // ── POST /api/articles/complete ──────────────────────────────
    describe('POST /api/articles/complete', () => {
        let articleId;
        let readTime;

        beforeEach(async () => {
            // Create a long article
            // Each "word " is 5 chars. 200 words = 1000 chars.
            const longText = 'word '.repeat(210);
            const article = await Article.create({
                ...validArticlePayload({
                    content: [{ text: longText }],
                    isPublished: true
                }),
                createdBy: adminId
            });
            articleId = article._id;
            readTime = article.readTime; // Should be 2 (Math.ceil(210/200))
        });

        it('should earn points after reading long enough', async () => {
            // minimumSeconds = floor(2 * 60 * 0.6) = 72 seconds
            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: articleId.toString(), timeSpentSeconds: 80 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pointsEarned).toBe(15);
        });

        it('should reject if reading too fast', async () => {
            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: articleId.toString(), timeSpentSeconds: 40 })
                .expect(400);

            expect(response.body.message).toContain('Reading too fast');
        });

        it('should reject duplicate completion', async () => {
            await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: articleId.toString(), timeSpentSeconds: 80 });

            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: articleId.toString(), timeSpentSeconds: 85 })
                .expect(400);

            expect(response.body.message).toContain('already earned points');
        });
    });

    // ── GET /api/articles/my-points ─────────────────────────────
    describe('GET /api/articles/my-points', () => {
        it('should return total points for user', async () => {
            const article = await Article.create({
                ...validArticlePayload({ content: [{ text: 'test' }] }),
                createdBy: adminId,
                isPublished: true,
                completions: [{ user: userId, pointsEarned: 25, timeSpentSeconds: 100 }]
            });

            const response = await request(app)
                .get('/api/articles/my-points')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.data.totalPoints).toBe(25);
            expect(response.body.data.completedArticleIds).toContain(article._id.toString());
        });
    });
});
