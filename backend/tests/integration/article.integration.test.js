import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import Article from '../../models/article.model.js';
import { clearTestDB, setupTestDB, teardownTestDB } from '../setup/testSetup.js';

describe('Article API Integration Tests', () => {
    jest.setTimeout(30000); // Increase timeout for cloud DB latency

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

    // Reusable valid article payload
    const validArticlePayload = (overrides = {}) => ({
        title: 'Budgeting for Beginners',
        summary: 'Learn the fundamentals of personal budgeting.',
        content: {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text: 'Budgeting is the process of creating a plan to spend your money. This spending plan is called a budget. Creating this spending plan allows you to determine in advance whether you will have enough money to do the things you need to do or would like to do. Budgeting is simply balancing your expenses with your income.'
                        }
                    ]
                }
            ]
        },
        category: 'budgeting',
        difficulty: 'beginner',
        pointsPerRead: 20,
        ...overrides
    });

    // ─── POST /api/articles/create ────────────────────────────────────────────
    describe('POST /api/articles/create', () => {
        it('should create an article as admin', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload())
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Article created successfully');
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.title).toBe('Budgeting for Beginners');
            expect(response.body.data.isPublished).toBe(false);
            expect(response.body.data.wordCount).toBeGreaterThan(0);
            expect(response.body.data.readTime).toBeGreaterThanOrEqual(1);
            expect(response.body.data.createdBy.toString()).toBe(adminId.toString());
        });

        it('should auto-calculate wordCount and readTime', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload())
                .expect(201);

            expect(response.body.data.wordCount).toBeGreaterThan(0);
            expect(response.body.data.readTime).toBe(
                Math.max(1, Math.ceil(response.body.data.wordCount / 200))
            );
        });

        it('should reject article creation by regular user', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send(validArticlePayload())
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should reject article creation without token', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .send(validArticlePayload())
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject article without title', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload({ title: undefined }))
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject article without content', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload({ content: undefined }))
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject invalid category', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload({ category: 'crypto' }))
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject invalid thumbnail URL', async () => {
            const response = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload({ thumbnail: 'not-a-url' }))
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ─── GET /api/articles ────────────────────────────────────────────────────
    describe('GET /api/articles', () => {
        beforeEach(async () => {
            await Article.create({
                ...validArticlePayload(),
                createdBy: adminId,
                isPublished: true
            });
            await Article.create({
                ...validArticlePayload({ title: 'Draft Article' }),
                createdBy: adminId,
                isPublished: false
            });
        });

        it('should return all articles including drafts for admin', async () => {
            const response = await request(app)
                .get('/api/articles')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        it('should return only published articles for regular user', async () => {
            const response = await request(app)
                .get('/api/articles')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].isPublished).toBe(true);
        });

        it('should reject unauthenticated request', async () => {
            await request(app).get('/api/articles').expect(401);
        });

        it('should include isRead flag on each article', async () => {
            const response = await request(app)
                .get('/api/articles')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            response.body.data.forEach(a => {
                expect(a).toHaveProperty('isRead');
                expect(a.isRead).toBe(false);
            });
        });

        it('should not leak other users completions array', async () => {
            const response = await request(app)
                .get('/api/articles')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            response.body.data.forEach(a => {
                expect(a).not.toHaveProperty('completions');
            });
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/articles?page=1&limit=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(1);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('pages');
        });

        it('should filter by category', async () => {
            const response = await request(app)
                .get('/api/articles?category=budgeting')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            response.body.data.forEach(a => expect(a.category).toBe('budgeting'));
        });

        it('should search by title', async () => {
            const response = await request(app)
                .get('/api/articles?search=Budgeting')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.some(a => a.title.includes('Budgeting'))).toBe(true);
        });
    });

    // ─── GET /api/articles/:id ────────────────────────────────────────────────
    describe('GET /api/articles/:id', () => {
        let publishedArticleId;
        let draftArticleId;

        beforeEach(async () => {
            const published = await Article.create({
                ...validArticlePayload(),
                createdBy: adminId,
                isPublished: true
            });
            publishedArticleId = published._id;

            const draft = await Article.create({
                ...validArticlePayload({ title: 'Draft Article' }),
                createdBy: adminId,
                isPublished: false
            });
            draftArticleId = draft._id;
        });

        it('should get published article as user with isRead flag', async () => {
            const response = await request(app)
                .get(`/api/articles/${publishedArticleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('isRead');
            expect(response.body.data.isRead).toBe(false);
        });

        it('should return 404 for draft article when accessed by user', async () => {
            const response = await request(app)
                .get(`/api/articles/${draftArticleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return draft article for admin', async () => {
            const response = await request(app)
                .get(`/api/articles/${draftArticleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isPublished).toBe(false);
        });

        it('should return 404 for non-existent article', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/articles/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .get(`/api/articles/${publishedArticleId}`)
                .expect(401);
        });
    });

    // ─── PUT /api/articles/:id ────────────────────────────────────────────────
    describe('PUT /api/articles/:id', () => {
        let articleId;

        beforeEach(async () => {
            const article = await Article.create({
                ...validArticlePayload(),
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

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Title');
            expect(response.body.data.isPublished).toBe(true);
        });

        it('should publish an article', async () => {
            const response = await request(app)
                .put(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isPublished: true })
                .expect(200);

            expect(response.body.data.isPublished).toBe(true);
        });

        it('should recalculate readTime when content is updated', async () => {
            const newContent = {
                type: 'doc',
                content: Array.from({ length: 10 }, (_, i) => ({
                    type: 'paragraph',
                    content: [{ type: 'text', text: `Word `.repeat(300) }]
                }))
            };

            const response = await request(app)
                .put(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ content: newContent })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.wordCount).toBeGreaterThan(0);
        });

        it('should reject update by regular user', async () => {
            const response = await request(app)
                .put(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'Hacked' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent article', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .put(`/api/articles/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Updated' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .put(`/api/articles/${articleId}`)
                .send({ title: 'Updated' })
                .expect(401);
        });
    });

    // ─── DELETE /api/articles/:id ─────────────────────────────────────────────
    describe('DELETE /api/articles/:id', () => {
        let articleId;

        beforeEach(async () => {
            const article = await Article.create({
                ...validArticlePayload(),
                createdBy: adminId
            });
            articleId = article._id;
        });

        it('should delete article as admin', async () => {
            const response = await request(app)
                .delete(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Article deleted successfully');

            const deleted = await Article.findById(articleId);
            expect(deleted).toBeNull();
        });

        it('should reject delete by regular user', async () => {
            const response = await request(app)
                .delete(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent article', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .delete(`/api/articles/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .delete(`/api/articles/${articleId}`)
                .expect(401);
        });
    });

    // ─── POST /api/articles/complete ─────────────────────────────────────────
    describe('POST /api/articles/complete', () => {
        let publishedArticleId;
        let readTimeMins;

        beforeEach(async () => {
            const article = await Article.create({
                ...validArticlePayload(),
                createdBy: adminId,
                isPublished: true
            });
            publishedArticleId = article._id;
            readTimeMins = article.readTime;
        });

        it('should complete article with sufficient reading time', async () => {
            // Use enough time (>= 60% of readTime)
            const enoughTime = Math.ceil(readTimeMins * 60 * 0.7);

            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: publishedArticleId, timeSpentSeconds: enoughTime })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pointsEarned).toBe(20);
            expect(response.body.data.totalArticlePoints).toBe(20);
        });

        it('should record completion inside article.completions', async () => {
            const enoughTime = Math.ceil(readTimeMins * 60 * 0.7);

            await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: publishedArticleId, timeSpentSeconds: enoughTime });

            const article = await Article.findById(publishedArticleId);
            expect(article.completions).toHaveLength(1);
            expect(article.completions[0].user.toString()).toBe(userId.toString());
            expect(article.completions[0].pointsEarned).toBe(20);
        });

        it('should reject if user reads too fast', async () => {
            // 35 seconds is more than the validation minimum (30) 
            // but less than the controller minimum for a 1-min article (36)
            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: publishedArticleId.toString(), timeSpentSeconds: 35 })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/too fast/i);
        });

        it('should prevent duplicate completions (farming guard)', async () => {
            const enoughTime = Math.ceil(readTimeMins * 60 * 0.7);

            await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: publishedArticleId, timeSpentSeconds: enoughTime });

            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: publishedArticleId, timeSpentSeconds: enoughTime })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/already earned/i);
        });

        it('should reject completion of unpublished article', async () => {
            const draft = await Article.create({
                ...validArticlePayload({ title: 'Draft' }),
                createdBy: adminId,
                isPublished: false
            });

            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: draft._id, timeSpentSeconds: 9999 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing articleId', async () => {
            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ timeSpentSeconds: 9999 })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject timeSpentSeconds below minimum (30s)', async () => {
            const response = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId: publishedArticleId, timeSpentSeconds: 5 })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .post('/api/articles/complete')
                .send({ articleId: publishedArticleId, timeSpentSeconds: 9999 })
                .expect(401);
        });
    });

    // ─── GET /api/articles/my-points ─────────────────────────────────────────
    describe('GET /api/articles/my-points', () => {
        let articleId;
        let readTimeMins;

        beforeEach(async () => {
            const article = await Article.create({
                ...validArticlePayload(),
                createdBy: adminId,
                isPublished: true
            });
            articleId = article._id;
            readTimeMins = article.readTime;
        });

        it('should return 0 when user has not read any articles', async () => {
            const response = await request(app)
                .get('/api/articles/my-points')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalPoints).toBe(0);
            expect(response.body.data.completedArticleIds).toHaveLength(0);
        });

        it('should return correct total after completing an article', async () => {
            const enoughTime = Math.ceil(readTimeMins * 60 * 0.7);

            await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId, timeSpentSeconds: enoughTime });

            const response = await request(app)
                .get('/api/articles/my-points')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalPoints).toBe(20);
            expect(response.body.data.completedArticleIds).toHaveLength(1);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .get('/api/articles/my-points')
                .expect(401);
        });
    });

    // ─── Full Workflow ────────────────────────────────────────────────────────
    describe('Article Workflow', () => {
        it('should complete full admin→publish→user read workflow', async () => {
            // Admin creates article
            const createRes = await request(app)
                .post('/api/articles/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validArticlePayload())
                .expect(201);

            const articleId = createRes.body.data._id;
            const readTimeMins = createRes.body.data.readTime;

            // User cannot see unpublished article
            await request(app)
                .get(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            // Admin publishes it
            await request(app)
                .put(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isPublished: true })
                .expect(200);

            // User can now see it with isRead = false
            const viewRes = await request(app)
                .get(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(viewRes.body.data.isRead).toBe(false);

            // User completes it with sufficient time
            const enoughTime = Math.ceil(readTimeMins * 60 * 0.7);
            const completeRes = await request(app)
                .post('/api/articles/complete')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ articleId, timeSpentSeconds: enoughTime })
                .expect(200);

            expect(completeRes.body.data.pointsEarned).toBe(20);
            expect(completeRes.body.data.totalArticlePoints).toBe(20);

            // my-points reflects the completion
            const pointsRes = await request(app)
                .get('/api/articles/my-points')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(pointsRes.body.data.totalPoints).toBe(20);
            expect(pointsRes.body.data.completedArticleIds).toHaveLength(1);
        });
    });
});
