import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Chat from '../../../models/chat.model.js';

describe('Chat Model Unit Tests', () => {

    const fakeUserId = () => new mongoose.Types.ObjectId();

    const makeChat = (overrides = {}) => new Chat({
        user: fakeUserId(),
        ...overrides
    });

    // ── Default Values ─────────────────────────────────────────
    describe('Default Values', () => {
        it('should default title to New Conversation', () => {
            const chat = makeChat();
            expect(chat.title).toBe('New Conversation');
        });

        it('should default messages to empty array', () => {
            const chat = makeChat();
            expect(chat.messages).toEqual([]);
        });

        it('should default youtubeKeywords to empty array', () => {
            const chat = makeChat();
            expect(chat.youtubeKeywords).toEqual([]);
        });

        it('should assign a valid ObjectId', () => {
            const chat = makeChat();
            expect(chat._id).toBeInstanceOf(mongoose.Types.ObjectId);
        });
    });

    // ── Schema Validation ──────────────────────────────────────
    describe('Schema Validation', () => {
        it('should pass validation with required user field', async () => {
            const chat = makeChat();
            await expect(chat.validate()).resolves.toBeUndefined();
        });

        it('should fail validation without user field', async () => {
            const chat = new Chat({});
            await expect(chat.validate()).rejects.toThrow();
        });

        it('should save a custom title', async () => {
            const chat = makeChat({ title: 'How do I budget?' });
            await expect(chat.validate()).resolves.toBeUndefined();
            expect(chat.title).toBe('How do I budget?');
        });

        it('should fail validation when title exceeds 60 characters', async () => {
            const chat = makeChat({ title: 'a'.repeat(61) });
            await expect(chat.validate()).rejects.toThrow();
        });

        it('should pass validation with exactly 60 character title', async () => {
            const chat = makeChat({ title: 'a'.repeat(60) });
            await expect(chat.validate()).resolves.toBeUndefined();
            expect(chat.title.length).toBe(60);
        });
    });

    // ── Messages Validation ────────────────────────────────────
    describe('Messages Validation', () => {
        it('should pass validation with valid user message', async () => {
            const chat = makeChat({
                messages: [{ role: 'user', content: 'How do I save money?' }]
            });
            await expect(chat.validate()).resolves.toBeUndefined();
            expect(chat.messages[0].role).toBe('user');
            expect(chat.messages[0].content).toBe('How do I save money?');
        });

        it('should pass validation with valid model message', async () => {
            const chat = makeChat({
                messages: [{ role: 'model', content: 'Start by tracking your expenses.' }]
            });
            await expect(chat.validate()).resolves.toBeUndefined();
            expect(chat.messages[0].role).toBe('model');
        });

        it('should fail validation with invalid message role', async () => {
            const chat = makeChat({
                messages: [{ role: 'assistant', content: 'Hello' }]
            });
            await expect(chat.validate()).rejects.toThrow();
        });

        it('should fail validation when message content is missing', async () => {
            const chat = makeChat({
                messages: [{ role: 'user' }]
            });
            await expect(chat.validate()).rejects.toThrow();
        });

        it('should fail validation when message role is missing', async () => {
            const chat = makeChat({
                messages: [{ content: 'Hello' }]
            });
            await expect(chat.validate()).rejects.toThrow();
        });

        it('should accept multiple messages in order', async () => {
            const chat = makeChat({
                messages: [
                    { role: 'user', content: 'What is budgeting?' },
                    { role: 'model', content: 'Budgeting is tracking your income and expenses.' },
                    { role: 'user', content: 'How do I start?' }
                ]
            });
            await expect(chat.validate()).resolves.toBeUndefined();
            expect(chat.messages).toHaveLength(3);
            expect(chat.messages[0].role).toBe('user');
            expect(chat.messages[1].role).toBe('model');
            expect(chat.messages[2].role).toBe('user');
        });

        it('should trim whitespace from message content', async () => {
            const chat = makeChat({
                messages: [{ role: 'user', content: '  hello  ' }]
            });
            await chat.validate();
            expect(chat.messages[0].content).toBe('hello');
        });

        it('should push new messages into the array', () => {
            const chat = makeChat();
            chat.messages.push({ role: 'user', content: 'New message' });
            expect(chat.messages).toHaveLength(1);
            expect(chat.messages[0].content).toBe('New message');
        });
    });

    // ── YouTube Keywords ───────────────────────────────────────
    describe('YouTube Keywords', () => {
        it('should save provided keywords', async () => {
            const chat = makeChat({
                youtubeKeywords: ['budgeting for beginners', '50 30 20 rule']
            });
            await expect(chat.validate()).resolves.toBeUndefined();
            expect(chat.youtubeKeywords).toHaveLength(2);
            expect(chat.youtubeKeywords).toContain('budgeting for beginners');
        });

        it('should update keywords by reassigning array', () => {
            const chat = makeChat();
            chat.youtubeKeywords = ['investing basics', 'compound interest explained'];
            expect(chat.youtubeKeywords).toHaveLength(2);
            expect(chat.youtubeKeywords[0]).toBe('investing basics');
        });
    });

    // ── User Reference ─────────────────────────────────────────
    describe('User Reference', () => {
        it('should store the user ObjectId correctly', () => {
            const userId = fakeUserId();
            const chat = new Chat({ user: userId });
            expect(chat.user.toString()).toBe(userId.toString());
        });
    });
});