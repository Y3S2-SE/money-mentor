import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Chat from '../../../models/chat.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup/testSetup.js';

describe('Chat Model Unit Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  // Helper — fake ObjectId for the user field
  const fakeUserId = () => new mongoose.Types.ObjectId();

  // ── Chat Creation ──────────────────────────────────────────────
  describe('Chat Creation', () => {
    it('should create a valid chat with required fields', async () => {
      const userId = fakeUserId();
      const chat = await Chat.create({ user: userId });

      expect(chat.user.toString()).toBe(userId.toString());
      expect(chat.title).toBe('New Conversation');
      expect(chat.messages).toEqual([]);
      expect(chat.youtubeKeywords).toEqual([]);
    });

    it('should fail without a user field', async () => {
      await expect(Chat.create({})).rejects.toThrow();
    });

    it('should use default title when not provided', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      expect(chat.title).toBe('New Conversation');
    });

    it('should save a custom title', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        title: 'How do I budget?'
      });
      expect(chat.title).toBe('How do I budget?');
    });

    it('should fail when title exceeds 60 characters', async () => {
      await expect(
        Chat.create({ user: fakeUserId(), title: 'a'.repeat(61) })
      ).rejects.toThrow();
    });

    it('should accept exactly 60 character title', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        title: 'a'.repeat(60)
      });
      expect(chat.title.length).toBe(60);
    });
  });

  // ── Messages ───────────────────────────────────────────────────
  describe('Messages', () => {
    it('should save messages with user role', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        messages: [{ role: 'user', content: 'How do I save money?' }]
      });

      expect(chat.messages).toHaveLength(1);
      expect(chat.messages[0].role).toBe('user');
      expect(chat.messages[0].content).toBe('How do I save money?');
    });

    it('should save messages with model role', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        messages: [{ role: 'model', content: 'Start by tracking your expenses.' }]
      });

      expect(chat.messages[0].role).toBe('model');
    });

    it('should fail with invalid message role', async () => {
      await expect(
        Chat.create({
          user: fakeUserId(),
          messages: [{ role: 'assistant', content: 'Hello' }]
        })
      ).rejects.toThrow();
    });

    it('should fail when message content is missing', async () => {
      await expect(
        Chat.create({
          user: fakeUserId(),
          messages: [{ role: 'user' }]
        })
      ).rejects.toThrow();
    });

    it('should fail when message role is missing', async () => {
      await expect(
        Chat.create({
          user: fakeUserId(),
          messages: [{ content: 'Hello' }]
        })
      ).rejects.toThrow();
    });

    it('should save multiple messages in order', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        messages: [
          { role: 'user', content: 'What is budgeting?' },
          { role: 'model', content: 'Budgeting is tracking your income and expenses.' },
          { role: 'user', content: 'How do I start?' }
        ]
      });

      expect(chat.messages).toHaveLength(3);
      expect(chat.messages[0].role).toBe('user');
      expect(chat.messages[1].role).toBe('model');
      expect(chat.messages[2].role).toBe('user');
    });

    it('should default to empty messages array', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      expect(chat.messages).toEqual([]);
    });

    it('should add message timestamps', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        messages: [{ role: 'user', content: 'Test message' }]
      });

      expect(chat.messages[0].createdAt).toBeDefined();
      expect(chat.messages[0].createdAt).toBeInstanceOf(Date);
    });

    it('should push new messages and save', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      chat.messages.push({ role: 'user', content: 'New message' });
      await chat.save();

      const updated = await Chat.findById(chat._id);
      expect(updated.messages).toHaveLength(1);
      expect(updated.messages[0].content).toBe('New message');
    });

    it('should trim whitespace from message content', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        messages: [{ role: 'user', content: '  hello  ' }]
      });
      expect(chat.messages[0].content).toBe('hello');
    });
  });

  // ── YouTube Keywords ───────────────────────────────────────────
  describe('YouTube Keywords', () => {
    it('should default to empty keywords array', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      expect(chat.youtubeKeywords).toEqual([]);
    });

    it('should save provided keywords', async () => {
      const chat = await Chat.create({
        user: fakeUserId(),
        youtubeKeywords: ['budgeting for beginners', '50 30 20 rule']
      });

      expect(chat.youtubeKeywords).toHaveLength(2);
      expect(chat.youtubeKeywords).toContain('budgeting for beginners');
    });

    it('should update keywords on save', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      chat.youtubeKeywords = ['investing basics', 'compound interest explained'];
      await chat.save();

      const updated = await Chat.findById(chat._id);
      expect(updated.youtubeKeywords).toHaveLength(2);
      expect(updated.youtubeKeywords[0]).toBe('investing basics');
    });
  });

  // ── Timestamps ─────────────────────────────────────────────────
  describe('Timestamps', () => {
    it('should add createdAt timestamp', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      expect(chat.createdAt).toBeDefined();
      expect(chat.createdAt).toBeInstanceOf(Date);
    });

    it('should add updatedAt timestamp', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      expect(chat.updatedAt).toBeDefined();
      expect(chat.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const chat = await Chat.create({ user: fakeUserId() });
      const originalUpdatedAt = chat.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      chat.title = 'Updated title';
      await chat.save();

      expect(chat.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});