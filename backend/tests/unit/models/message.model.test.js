import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Message from '../../../models/message.model.js';

describe('Message Model - Unit Tests', () => {
  const mockGroupId = new mongoose.Types.ObjectId();
  const mockSenderId = new mongoose.Types.ObjectId();
  const mockUserId = new mongoose.Types.ObjectId();

  //  Default Values 
  describe('Default Values', () => {
    it('should default type to text', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      expect(message.type).toBe('text');
    });

    it('should default deletedAt to null', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      expect(message.deletedAt).toBeNull();
    });

    it('should default readBy to an empty array', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      expect(Array.isArray(message.readBy)).toBe(true);
      expect(message.readBy).toHaveLength(0);
    });
  });

  // Field Assignments 
  describe('Field Assignments', () => {
    it('should assign groupId correctly', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      expect(message.groupId.toString()).toBe(mockGroupId.toString());
    });

    it('should assign sender correctly', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      expect(message.sender.toString()).toBe(mockSenderId.toString());
    });

    it('should assign content correctly', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello World' });
      expect(message.content).toBe('Hello World');
    });

    it('should trim whitespace from content', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: '  Hello World  ' });
      expect(message.content).toBe('Hello World');
    });

    it('should assign type text correctly', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello', type: 'text' });
      expect(message.type).toBe('text');
    });

    it('should assign type system correctly', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'User joined', type: 'system' });
      expect(message.type).toBe('system');
    });

    it('should assign deletedAt when provided', () => {
      const deletedAt = new Date('2025-01-01');
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello', deletedAt });
      expect(message.deletedAt).toEqual(deletedAt);
    });

    it('should assign readBy correctly', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello', readBy: [mockUserId] });
      expect(message.readBy[0].toString()).toBe(mockUserId.toString());
    });
  });

  //  References 
  describe('References', () => {
    it('should store groupId as an ObjectId', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      expect(message.groupId).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should store sender as an ObjectId', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      expect(message.sender).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should store readBy entries as ObjectIds', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello', readBy: [mockUserId] });
      expect(message.readBy[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  //  ReadBy 
  describe('ReadBy', () => {
    it('should allow adding a user to readBy', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      message.readBy.push(mockUserId);
      expect(message.readBy).toHaveLength(1);
    });

    it('should allow adding multiple users to readBy', () => {
      const extraUserId = new mongoose.Types.ObjectId();
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      message.readBy.push(mockUserId, extraUserId);
      expect(message.readBy).toHaveLength(2);
    });

    it('should allow removing a user from readBy', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello', readBy: [mockUserId] });
      message.readBy.pull(mockUserId);
      expect(message.readBy).toHaveLength(0);
    });
  });

  //  Validation
  describe('Validation', () => {
    it('should require groupId', () => {
      const message = new Message({ sender: mockSenderId, content: 'Hello' });
      const error = message.validateSync();
      expect(error.errors.groupId).toBeDefined();
    });

    it('should require sender', () => {
      const message = new Message({ groupId: mockGroupId, content: 'Hello' });
      const error = message.validateSync();
      expect(error.errors.sender).toBeDefined();
    });

    it('should require content', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId });
      const error = message.validateSync();
      expect(error.errors.content).toBeDefined();
    });

    it('should fail with invalid type enum', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello', type: 'invalid' });
      const error = message.validateSync();
      expect(error.errors.type).toBeDefined();
    });

    it('should fail when content exceeds maxlength of 2000', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'a'.repeat(2001) });
      const error = message.validateSync();
      expect(error.errors.content).toBeDefined();
    });

    it('should pass validation with required fields only', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'Hello' });
      const error = message.validateSync();
      expect(error).toBeUndefined();
    });

    it('should pass validation with all fields', () => {
      const message = new Message({
        groupId: mockGroupId,
        sender: mockSenderId,
        content: 'Hello World',
        type: 'text',
        readBy: [mockUserId],
        deletedAt: new Date()
      });
      const error = message.validateSync();
      expect(error).toBeUndefined();
    });

    it('should pass validation with content at max length of 2000', () => {
      const message = new Message({ groupId: mockGroupId, sender: mockSenderId, content: 'a'.repeat(2000) });
      const error = message.validateSync();
      expect(error).toBeUndefined();
    });
  });

  //  Timestamps
  describe('Timestamps', () => {
    it('should have createdAt path defined on schema', () => {
      expect(Message.schema.paths.createdAt).toBeDefined();
    });

    it('should have updatedAt path defined on schema', () => {
      expect(Message.schema.paths.updatedAt).toBeDefined();
    });
  });
});