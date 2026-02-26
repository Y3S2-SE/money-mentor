import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Group from '../../../models/group.model.js';

describe('Group Model - Unit Tests', () => {
  const mockAdminId = new mongoose.Types.ObjectId();
  const mockMemberId = new mongoose.Types.ObjectId();

  // ── Default Values ─────────────────────────────────────────
  describe('Default Values', () => {
    it('should default maxMembers to 5', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId });
      expect(group.maxMembers).toBe(5);
    });

    it('should default members to an empty array', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId });
      expect(Array.isArray(group.members)).toBe(true);
      expect(group.members).toHaveLength(0);
    });

    it('should allow overriding maxMembers default', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, maxMembers: 20 });
      expect(group.maxMembers).toBe(20);
    });
  });

  // ── Field Assignments ──────────────────────────────────────
  describe('Field Assignments', () => {
    it('should assign name correctly', () => {
      const group = new Group({ name: 'My Group', admin: mockAdminId });
      expect(group.name).toBe('My Group');
    });

    it('should trim whitespace from name', () => {
      const group = new Group({ name: '  Trimmed Group  ', admin: mockAdminId });
      expect(group.name).toBe('Trimmed Group');
    });

    it('should assign description correctly', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, description: 'A description' });
      expect(group.description).toBe('A description');
    });

    it('should trim whitespace from description', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, description: '  Some description  ' });
      expect(group.description).toBe('Some description');
    });

    it('should assign inviteCode correctly', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, inviteCode: 'ABC123' });
      expect(group.inviteCode).toBe('ABC123');
    });

    it('should leave inviteCode undefined when not provided', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId });
      expect(group.inviteCode).toBeUndefined();
    });

    it('should allow setting maxMembers', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, maxMembers: 10 });
      expect(group.maxMembers).toBe(10);
    });
  });

  // ── Admin Reference ────────────────────────────────────────
  describe('Admin Reference', () => {
    it('should store admin as an ObjectId', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId });
      expect(group.admin).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(group.admin.toString()).toBe(mockAdminId.toString());
    });

    it('should require admin field', () => {
      const group = new Group({ name: 'Test Group' });
      const error = group.validateSync();
      expect(error.errors.admin).toBeDefined();
    });
  });

  // ── Members ────────────────────────────────────────────────
  describe('Members', () => {
    it('should store members as ObjectIds', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, members: [mockMemberId] });
      expect(group.members[0]).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(group.members[0].toString()).toBe(mockMemberId.toString());
    });

    it('should add a member correctly', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, members: [mockMemberId] });
      expect(group.members).toHaveLength(1);
    });

    it('should add multiple members correctly', () => {
      const extraId = new mongoose.Types.ObjectId();
      const group = new Group({ name: 'Test Group', admin: mockAdminId, members: [mockMemberId, extraId] });
      expect(group.members).toHaveLength(2);
    });

    it('should allow pushing a member', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId });
      group.members.push(mockMemberId);
      expect(group.members).toHaveLength(1);
    });

    it('should allow removing a member', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId, members: [mockMemberId] });
      group.members.pull(mockMemberId);
      expect(group.members).toHaveLength(0);
    });
  });

  // ── Validation ─────────────────────────────────────────────
  describe('Validation', () => {
    it('should require name', () => {
      const group = new Group({ admin: mockAdminId });
      const error = group.validateSync();
      expect(error.errors.name).toBeDefined();
    });

    it('should require admin', () => {
      const group = new Group({ name: 'Test Group' });
      const error = group.validateSync();
      expect(error.errors.admin).toBeDefined();
    });

    it('should pass validation with required fields only', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId });
      const error = group.validateSync();
      expect(error).toBeUndefined();
    });

    it('should pass validation with all fields', () => {
      const group = new Group({
        name: 'Full Group',
        description: 'A description',
        inviteCode: 'ABC123',
        admin: mockAdminId,
        members: [mockMemberId],
        maxMembers: 10
      });
      const error = group.validateSync();
      expect(error).toBeUndefined();
    });
  });

  // ── Timestamps ─────────────────────────────────────────────
  describe('Timestamps', () => {
    it('should have timestamps option enabled', () => {
      const group = new Group({ name: 'Test Group', admin: mockAdminId });
      // Timestamps are added by MongoDB on save, but the schema
      // paths exist on the model
      expect(Group.schema.paths.createdAt).toBeDefined();
      expect(Group.schema.paths.updatedAt).toBeDefined();
    });
  });
});