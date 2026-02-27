import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

// ── jest.unstable_mockModule MUST come before any dynamic imports ──
// jest.mock() does NOT work with ES Modules. With "type": "module" in package.json,
// the module system loads all static imports before any code runs, so jest.mock()
// fires too late — the real Gemini SDK is already loaded by then.
// jest.unstable_mockModule() is the ES-module-compatible alternative.
// All imports that depend on the mock MUST use dynamic await import() BELOW
// this block so they load after the mock is registered.

jest.unstable_mockModule('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            // Used in startConversation and sendMessage controllers
            startChat: jest.fn().mockReturnValue({
                sendMessage: jest.fn().mockResolvedValue({
                    response: {
                        text: () => 'This is a mock MoneyMentor response about personal finance.'
                    }
                })
            }),
            // Used in generateKeywords helper
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () => '["budgeting for beginners", "how to save money", "50 30 20 rule"]'
                }
            })
        })
    }))
}));

// ── Dynamic imports AFTER mock registration ──
// Static imports are hoisted before any code runs so the mock would not be
// in place yet. await import() runs at this point in execution, after the mock.
const { default: request } = await import('supertest');
const { default: app } = await import('../../app.js');
const { default: User } = await import('../../models/user.model.js');
const { default: Chat } = await import('../../models/chat.model.js');
const { clearTestDB, setupTestDB, teardownTestDB } = await import('../setup/testSetup.js');

describe('Chat API Integration Tests', () => {
    let userToken;
    let userId;
    let otherToken;
    let otherUserId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const user = await User.create({
            username: 'testuser',
            email: 'user@example.com',
            password: 'User123!'
        });
        userId = user._id;

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
    });

    // ── POST /api/chat ───────────────────────────────────────────
    describe('POST /api/chat', () => {
        it('should start a new conversation', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'How do I start budgeting?' })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Conversation started');
            expect(response.body.data).toHaveProperty('chatId');
            expect(response.body.data).toHaveProperty('aiResponse');
            expect(response.body.data).toHaveProperty('youtubeKeywords');
            expect(response.body.data).toHaveProperty('title');
            expect(response.body.data.title).toBe('How do I start budgeting?');
        });

        it('should save conversation to database', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'What is compound interest?' })
                .expect(201);

            const chatId = response.body.data.chatId;
            const chat = await Chat.findById(chatId);

            expect(chat).not.toBeNull();
            expect(chat.user.toString()).toBe(userId.toString());
            expect(chat.messages).toHaveLength(2);
            expect(chat.messages[0].role).toBe('user');
            expect(chat.messages[1].role).toBe('model');
        });

        it('should save the correct user and AI messages to database', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'What is compound interest?' })
                .expect(201);

            const chat = await Chat.findById(response.body.data.chatId);
            expect(chat.messages[0].content).toBe('What is compound interest?');
            expect(chat.messages[1].content).toBe('This is a mock MoneyMentor response about personal finance.');
        });

        it('should generate a title from first message', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Tell me about investing' })
                .expect(201);

            expect(response.body.data.title).toBe('Tell me about investing');
        });

        it('should truncate long title to 60 characters', async () => {
            const longMessage = 'a'.repeat(70);
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: longMessage })
                .expect(201);

            expect(response.body.data.title.length).toBeLessThanOrEqual(60);
        });

        it('should return youtube keywords', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'How do I invest in stocks?' })
                .expect(201);

            expect(Array.isArray(response.body.data.youtubeKeywords)).toBe(true);
            expect(response.body.data.youtubeKeywords.length).toBeGreaterThan(0);
        });

        it('should return the mocked AI response', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'How do I save money?' })
                .expect(201);

            expect(response.body.data.aiResponse).toBe(
                'This is a mock MoneyMentor response about personal finance.'
            );
        });

        it('should reject empty message', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Message is required');
        });

        it('should reject missing message field', async () => {
            const response = await request(app)
                .post('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            const response = await request(app)
                .post('/api/chat')
                .send({ message: 'Hello' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // ── POST /api/chat/:id/message ───────────────────────────────
    describe('POST /api/chat/:id/message', () => {
        let chatId;

        beforeEach(async () => {
            const chat = await Chat.create({
                user: userId,
                title: 'How do I start budgeting?',
                messages: [
                    { role: 'user', content: 'How do I start budgeting?' },
                    { role: 'model', content: 'Start by tracking your monthly expenses.' }
                ],
                youtubeKeywords: ['budgeting for beginners', 'how to save money']
            });
            chatId = chat._id;
        });

        it('should send a message in existing conversation', async () => {
            const response = await request(app)
                .post(`/api/chat/${chatId}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Tell me more about the 50/30/20 rule' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('chatId');
            expect(response.body.data).toHaveProperty('aiResponse');
            expect(response.body.data).toHaveProperty('youtubeKeywords');
        });

        it('should return the mocked AI response', async () => {
            const response = await request(app)
                .post(`/api/chat/${chatId}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Tell me more about the 50/30/20 rule' })
                .expect(200);

            expect(response.body.data.aiResponse).toBe(
                'This is a mock MoneyMentor response about personal finance.'
            );
        });

        it('should append messages to conversation in database', async () => {
            await request(app)
                .post(`/api/chat/${chatId}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'What is a savings account?' })
                .expect(200);

            const chat = await Chat.findById(chatId);
            expect(chat.messages.length).toBe(4); // original 2 + new user + new model
            expect(chat.messages[2].role).toBe('user');
            expect(chat.messages[3].role).toBe('model');
        });

        it('should update youtube keywords after message', async () => {
            await request(app)
                .post(`/api/chat/${chatId}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Tell me about emergency funds' })
                .expect(200);

            const chat = await Chat.findById(chatId);
            expect(chat.youtubeKeywords.length).toBeGreaterThan(0);
        });

        it('should reject message to another users conversation', async () => {
            const response = await request(app)
                .post(`/api/chat/${chatId}/message`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ message: 'Hello' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent chat', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .post(`/api/chat/${fakeId}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Hello' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject empty message', async () => {
            const response = await request(app)
                .post(`/api/chat/${chatId}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app)
                .post(`/api/chat/${chatId}/message`)
                .send({ message: 'Hello' })
                .expect(401);
        });
    });

    // ── GET /api/chat ────────────────────────────────────────────
    describe('GET /api/chat', () => {
        beforeEach(async () => {
            await Chat.create({ user: userId, title: 'Chat 1', messages: [{ role: 'user', content: 'Hello' }] });
            await Chat.create({ user: userId, title: 'Chat 2', messages: [{ role: 'user', content: 'Hi' }] });
            await Chat.create({ user: otherUserId, title: 'Other Chat' });
        });

        it('should return only conversations for logged in user', async () => {
            const response = await request(app)
                .get('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            response.body.data.forEach(c => {
                expect(c.user.toString()).toBe(userId.toString());
            });
        });

        it('should not include messages in list response', async () => {
            const response = await request(app)
                .get('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            response.body.data.forEach(c => {
                expect(c).not.toHaveProperty('messages');
            });
        });

        it('should sort conversations by updatedAt descending', async () => {
            const response = await request(app)
                .get('/api/chat')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const dates = response.body.data.map(c => new Date(c.updatedAt).getTime());
            for (let i = 0; i < dates.length - 1; i++) {
                expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
            }
        });

        it('should return empty array when user has no conversations', async () => {
            await User.create({ username: 'fresh', email: 'fresh@example.com', password: 'Fresh123!' });
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'fresh@example.com', password: 'Fresh123!' });
            const freshToken = res.body.data.token;

            const response = await request(app)
                .get('/api/chat')
                .set('Authorization', `Bearer ${freshToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(0);
        });

        it('should reject unauthenticated request', async () => {
            await request(app).get('/api/chat').expect(401);
        });
    });

    // ── GET /api/chat/:id ────────────────────────────────────────
    describe('GET /api/chat/:id', () => {
        let chatId;

        beforeEach(async () => {
            const chat = await Chat.create({
                user: userId,
                title: 'Test Chat',
                messages: [
                    { role: 'user', content: 'Hello' },
                    { role: 'model', content: 'Hi there!' }
                ],
                youtubeKeywords: ['budgeting tips']
            });
            chatId = chat._id;
        });

        it('should get conversation with full messages', async () => {
            const response = await request(app)
                .get(`/api/chat/${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('messages');
            expect(response.body.data.messages).toHaveLength(2);
            expect(response.body.data).toHaveProperty('youtubeKeywords');
        });

        it('should reject access to another users conversation', async () => {
            const response = await request(app)
                .get(`/api/chat/${chatId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent conversation', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/chat/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app).get(`/api/chat/${chatId}`).expect(401);
        });
    });

    // ── DELETE /api/chat/:id ─────────────────────────────────────
    describe('DELETE /api/chat/:id', () => {
        let chatId;

        beforeEach(async () => {
            const chat = await Chat.create({ user: userId, title: 'To Delete' });
            chatId = chat._id;
        });

        it('should delete conversation', async () => {
            const response = await request(app)
                .delete(`/api/chat/${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Conversation deleted successfully');

            const deleted = await Chat.findById(chatId);
            expect(deleted).toBeNull();
        });

        it('should reject deleting another users conversation', async () => {
            const response = await request(app)
                .delete(`/api/chat/${chatId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);

            const stillExists = await Chat.findById(chatId);
            expect(stillExists).not.toBeNull();
        });

        it('should return 404 for non-existent conversation', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .delete(`/api/chat/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should reject unauthenticated request', async () => {
            await request(app).delete(`/api/chat/${chatId}`).expect(401);
        });
    });
});