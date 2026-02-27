import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import Chat from '../../models/chat.model.js';
import YoutubeCache from '../../models/youtube.model.js';
import { clearTestDB, setupTestDB, teardownTestDB } from '../setup/testSetup.js';

describe('YouTube API Integration Tests', () => {
    let userToken;
    let userId;
    let otherToken;
    let otherUserId;
    let chatId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        // Create main user
        const user = await User.create({
            username: 'testuser',
            email: 'user@example.com',
            password: 'User123!'
        });
        userId = user._id;

        // Create other user
        const other = await User.create({
            username: 'otheruser',
            email: 'other@example.com',
            password: 'Other123!'
        });
        otherUserId = other._id;

        const userRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@example.com', password: 'User123!' });
        userToken = userRes.body.data.token;

        const otherRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'other@example.com', password: 'Other123!' });
        otherToken = otherRes.body.data.token;

        // Create a chat with keywords for the user
        const chat = await Chat.create({
            user: userId,
            title: 'Budgeting Chat',
            messages: [
                { role: 'user', content: 'How do I budget?' },
                { role: 'model', content: 'Start by tracking expenses.' }
            ],
            youtubeKeywords: ['budgeting for beginners', 'how to save money']
        });
        chatId = chat._id;
    });

    // ── GET /api/youtube/search ──────────────────────────────────
    describe('GET /api/youtube/search', () => {
        it('should return video suggestions for a chat', async () => {
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('keywords');
            expect(response.body.data).toHaveProperty('videos');
            expect(response.body.data).toHaveProperty('cacheStats');
            expect(Array.isArray(response.body.data.videos)).toBe(true);
            expect(response.body.data.keywords).toEqual(['budgeting for beginners', 'how to save money']);
        }, 30000);

        it('should return correct video structure', async () => {
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            if (response.body.data.videos.length > 0) {
                const video = response.body.data.videos[0];
                expect(video).toHaveProperty('videoId');
                expect(video).toHaveProperty('title');
                expect(video).toHaveProperty('url');
                expect(video).toHaveProperty('thumbnail');
                expect(video).toHaveProperty('channelName');
                expect(video.url).toContain('youtube.com/watch?v=');
            }
        }, 30000);

        it('should cache results in database after first fetch', async () => {
            await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const cached = await YoutubeCache.findOne({ keyword: 'budgeting for beginners' });
            expect(cached).not.toBeNull();
            expect(cached.videos).toBeDefined();
            expect(cached.cachedAt).toBeDefined();
        }, 30000);

        it('should serve from cache on second request', async () => {
            // First request — hits YouTube API
            await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`);

            // Second request — should come from cache
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.data.cacheStats.fromCache).toBeGreaterThan(0);
            expect(response.body.data.cacheStats.fromApi).toBe(0);
        }, 30000);

        it('should fetch from API when cache is stale', async () => {
            // Insert stale cache entry (8 days old)
            const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
            await YoutubeCache.create({
                keyword: 'budgeting for beginners',
                videos: [],
                cachedAt: eightDaysAgo
            });

            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // At least one keyword should have been fetched fresh
            expect(response.body.data.cacheStats.fromApi).toBeGreaterThan(0);
        }, 30000);

        it('should return empty videos and message for chat with no keywords', async () => {
            const noKeywordsChat = await Chat.create({
                user: userId,
                title: 'Empty Chat',
                youtubeKeywords: []
            });

            const response = await request(app)
                .get(`/api/youtube/search?chatId=${noKeywordsChat._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.videos).toHaveLength(0);
        });

        it('should reject request without chatId', async () => {
            const response = await request(app)
                .get('/api/youtube/search')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('chatId is required');
        });

        it('should return 404 for non-existent chat', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Conversation not found');
        });

        it('should reject access to another users chat', async () => {
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return deduplicated videos across keywords', async () => {
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const videoIds = response.body.data.videos.map(v => v.videoId);
            const uniqueIds = new Set(videoIds);
            expect(videoIds.length).toBe(uniqueIds.size);
        }, 30000);

        it('should include cacheStats in response', async () => {
            const response = await request(app)
                .get(`/api/youtube/search?chatId=${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.data.cacheStats).toHaveProperty('fromCache');
            expect(response.body.data.cacheStats).toHaveProperty('fromApi');
        }, 30000);
    });
});