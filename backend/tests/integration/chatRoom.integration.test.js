import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import Message from '../../models/message.model.js';
import Group from '../../models/group.model.js';
import User from '../../models/user.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';

describe('ChatRoom Controller - Integration Tests', () => {
  let adminUser;
  let memberUser;
  let nonMemberUser;
  let adminToken;
  let memberToken;
  let nonMemberToken;
  let testGroup;

  //  Helper to generate JWT token 
  const generateToken = (user) => {
    return jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  };

  //  Helper to create a message 
  const createMessage = async (overrides = {}) => {
    return await Message.create({
      groupId: testGroup._id,
      sender: adminUser._id,
      content: 'Test message',
      type: 'text',
      ...overrides
    });
  };

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test users
    adminUser = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'Test123!'
    });

    memberUser = await User.create({
      username: 'memberuser',
      email: 'member@example.com',
      password: 'Test123!'
    });

    nonMemberUser = await User.create({
      username: 'nonmember',
      email: 'nonmember@example.com',
      password: 'Test123!'
    });

    // Generate tokens
    adminToken = generateToken(adminUser);
    memberToken = generateToken(memberUser);
    nonMemberToken = generateToken(nonMemberUser);

    // Create test group with admin and member
    testGroup = await Group.create({
      name: 'Test Group',
      admin: adminUser._id,
      members: [adminUser._id, memberUser._id],
      maxMembers: 5,
      inviteCode: 'TESTCODE1'
    });
  });

  //  Get ws ticket 
  describe('POST /api/chat-room/ticket', () => {
    it('should return a ticket for authenticated user', async () => {
      const res = await request(app)
        .post('/api/chat-room/ticket')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket).toBeDefined();
      expect(typeof res.body.ticket).toBe('string');
    });

    it('should return a unique ticket on each request', async () => {
      const res1 = await request(app)
        .post('/api/chat-room/ticket')
        .set('Authorization', `Bearer ${adminToken}`);

      const res2 = await request(app)
        .post('/api/chat-room/ticket')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.body.ticket).not.toBe(res2.body.ticket);
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/chat-room/ticket');

      expect(res.status).toBe(401);
    });
  });

  //  get message history
  describe('GET /api/chat-room/:groupId/messages', () => {
    it('should return message history for group admin', async () => {
      await createMessage({ content: 'Hello from admin' });

      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages).toHaveLength(1);
      expect(res.body.data.messages[0].content).toBe('Hello from admin');
    });

    it('should return message history for group member', async () => {
      await createMessage({ content: 'Hello world' });

      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages).toHaveLength(1);
    });

    it('should return 403 for non-member', async () => {
      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not a member of this group');
    });

    it('should return 404 for non-existent group', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/chat-room/${fakeId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Group not found');
    });

    it('should not return soft-deleted messages', async () => {
      await createMessage({ content: 'Visible message' });
      await createMessage({ content: 'Deleted message', deletedAt: new Date() });

      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(1);
      expect(res.body.data.messages[0].content).toBe('Visible message');
    });

    it('should return messages in ascending order (oldest first)', async () => {
      await createMessage({ content: 'First message' });
      await createMessage({ content: 'Second message' });
      await createMessage({ content: 'Third message' });

      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const messages = res.body.data.messages;
      expect(messages[0].content).toBe('First message');
      expect(messages[2].content).toBe('Third message');
    });

    it('should return correct pagination data', async () => {
      await createMessage({ content: 'Message 1' });
      await createMessage({ content: 'Message 2' });
      await createMessage({ content: 'Message 3' });

      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages?page=1&limit=2`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasMore).toBe(true);
    });

    it('should cap limit at 100', async () => {
      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages?limit=999`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(100);
    });

    it('should default to page 1 and limit 50', async () => {
      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(50);
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`);

      expect(res.status).toBe(401);
    });

    it('should populate sender username and not expose password', async () => {
      await createMessage();

      const res = await request(app)
        .get(`/api/chat-room/${testGroup._id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const sender = res.body.data.messages[0].sender;
      expect(sender).toHaveProperty('_id');
      expect(sender).toHaveProperty('username');
      expect(sender).not.toHaveProperty('password');
    });
  });

  //  delete message 
  describe('DELETE /api/chat-room/:groupId/messages/:messageId', () => {
    it('should allow message owner to soft delete their message', async () => {
      const message = await createMessage({
        sender: adminUser._id,
        content: 'Delete me'
      });

      const res = await request(app)
        .delete(`/api/chat-room/${testGroup._id}/messages/${message._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Message deleted');

      // Verify soft delete — deletedAt should be set
      const updated = await Message.findById(message._id);
      expect(updated.deletedAt).not.toBeNull();
    });

    it('should allow group admin to delete any message', async () => {
      const message = await createMessage({
        sender: memberUser._id,
        content: 'Member message'
      });

      const res = await request(app)
        .delete(`/api/chat-room/${testGroup._id}/messages/${message._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 when non-owner non-admin tries to delete', async () => {
      const message = await createMessage({
        sender: adminUser._id,
        content: 'Admin message'
      });

      const res = await request(app)
        .delete(`/api/chat-room/${testGroup._id}/messages/${message._id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized to delete this message');
    });

    it('should return 404 for non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/chat-room/${testGroup._id}/messages/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Message not found');
    });

    it('should return 404 when messageId belongs to different group', async () => {
      const otherGroup = await Group.create({
        name: 'Other Group',
        admin: adminUser._id,
        members: [adminUser._id],
        maxMembers: 5,
        inviteCode: 'OTHER123'
      });

      const message = await createMessage({
        groupId: otherGroup._id,
        content: 'Message in other group'
      });

      const res = await request(app)
        .delete(`/api/chat-room/${testGroup._id}/messages/${message._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Message not found');
    });

    it('should not permanently delete the message', async () => {
      const message = await createMessage();

      await request(app)
        .delete(`/api/chat-room/${testGroup._id}/messages/${message._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const found = await Message.findById(message._id);
      expect(found).not.toBeNull();
      expect(found.deletedAt).toBeInstanceOf(Date);
    });

    it('should return 401 for unauthenticated request', async () => {
      const message = await createMessage();

      const res = await request(app)
        .delete(`/api/chat-room/${testGroup._id}/messages/${message._id}`);

      expect(res.status).toBe(401);
    });
  });
});