import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Group from '../../../models/group.model.js';
import User from '../../../models/user.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup/testSetup.js';

describe('Group Model Unit Tests', () => {
  let adminUser;
  let memberUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create reusable test users
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
  });

  // ──────────────────────────────────────────────
  // Group Creation
  // ──────────────────────────────────────────────
  describe('Group Creation', () => {
    it('should create a valid group with required fields only', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      expect(group.name).toBe('Test Group');
      expect(group.admin.toString()).toBe(adminUser._id.toString());
      expect(group.maxMembers).toBe(5);
      expect(group.members).toHaveLength(0);
    });

    it('should create a group with all optional fields', async () => {
      const inviteCode = 'INVITE123';
      const group = await Group.create({
        name: 'Full Group',
        description: 'A group with all fields',
        inviteCode,
        admin: adminUser._id,
        members: [memberUser._id],
        maxMembers: 10
      });

      expect(group.name).toBe('Full Group');
      expect(group.description).toBe('A group with all fields');
      expect(group.inviteCode).toBe(inviteCode);
      expect(group.members).toHaveLength(1);
      expect(group.maxMembers).toBe(10);
    });

    it('should fail without name', async () => {
      await expect(
        Group.create({ admin: adminUser._id })
      ).rejects.toThrow();
    });

    it('should fail without admin', async () => {
      await expect(
        Group.create({ name: 'Test Group' })
      ).rejects.toThrow();
    });

    it('should fail with an invalid admin ObjectId', async () => {
      await expect(
        Group.create({ name: 'Test Group', admin: 'not-an-object-id' })
      ).rejects.toThrow();
    });

    it('should fail with a duplicate inviteCode', async () => {
      const inviteCode = 'DUPLICATE';

      await Group.create({
        name: 'First Group',
        admin: adminUser._id,
        inviteCode
      });

      await expect(
        Group.create({
          name: 'Second Group',
          admin: adminUser._id,
          inviteCode
        })
      ).rejects.toThrow();
    });

    it('should trim whitespace from name', async () => {
      const group = await Group.create({
        name: '  Trimmed Group  ',
        admin: adminUser._id
      });

      expect(group.name).toBe('Trimmed Group');
    });

    it('should trim whitespace from description', async () => {
      const group = await Group.create({
        name: 'Test Group',
        description: '  Some description  ',
        admin: adminUser._id
      });

      expect(group.description).toBe('Some description');
    });
  });

  // ──────────────────────────────────────────────
  // Default Values
  // ──────────────────────────────────────────────
  describe('Default Values', () => {
    it('should default maxMembers to 5', async () => {
      const group = await Group.create({
        name: 'Default Group',
        admin: adminUser._id
      });

      expect(group.maxMembers).toBe(5);
    });

    it('should default members to an empty array', async () => {
      const group = await Group.create({
        name: 'Default Group',
        admin: adminUser._id
      });

      expect(Array.isArray(group.members)).toBe(true);
      expect(group.members).toHaveLength(0);
    });

    it('should allow overriding maxMembers default', async () => {
      const group = await Group.create({
        name: 'Large Group',
        admin: adminUser._id,
        maxMembers: 20
      });

      expect(group.maxMembers).toBe(20);
    });
  });

  // ──────────────────────────────────────────────
  // Members
  // ──────────────────────────────────────────────
  describe('Members', () => {
    it('should add a member to a group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberUser._id]
      });

      expect(group.members).toHaveLength(1);
      expect(group.members[0].toString()).toBe(memberUser._id.toString());
    });

    it('should add multiple members to a group', async () => {
      const extraUser = await User.create({
        username: 'extrauser',
        email: 'extra@example.com',
        password: 'Test123!'
      });

      const group = await Group.create({
        name: 'Multi-member Group',
        admin: adminUser._id,
        members: [memberUser._id, extraUser._id]
      });

      expect(group.members).toHaveLength(2);
    });

    it('should persist member additions via save', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      group.members.push(memberUser._id);
      await group.save();

      const updatedGroup = await Group.findById(group._id);
      expect(updatedGroup.members).toHaveLength(1);
    });

    it('should persist member removals via save', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberUser._id]
      });

      group.members.pull(memberUser._id);
      await group.save();

      const updatedGroup = await Group.findById(group._id);
      expect(updatedGroup.members).toHaveLength(0);
    });

    it('should store members as ObjectIds', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberUser._id]
      });

      expect(group.members[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should fail with an invalid member ObjectId', async () => {
      await expect(
        Group.create({
          name: 'Test Group',
          admin: adminUser._id,
          members: ['invalid-id']
        })
      ).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // Admin Reference
  // ──────────────────────────────────────────────
  describe('Admin Reference', () => {
    it('should store admin as an ObjectId', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      expect(group.admin).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(group.admin.toString()).toBe(adminUser._id.toString());
    });

    it('should populate admin with user data', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      const populated = await Group.findById(group._id).populate('admin');
      expect(populated.admin.username).toBe('adminuser');
      expect(populated.admin.email).toBe('admin@example.com');
    });

    it('should populate members with user data', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberUser._id]
      });

      const populated = await Group.findById(group._id).populate('members');
      expect(populated.members[0].username).toBe('memberuser');
    });
  });

  // ──────────────────────────────────────────────
  // Invite Code
  // ──────────────────────────────────────────────
  describe('Invite Code', () => {
    it('should allow a group without an inviteCode', async () => {
      const group = await Group.create({
        name: 'No Invite Group',
        admin: adminUser._id
      });

      expect(group.inviteCode).toBeUndefined();
    });

    it('should save a provided inviteCode', async () => {
      const group = await Group.create({
        name: 'Invite Group',
        admin: adminUser._id,
        inviteCode: 'ABC123'
      });

      expect(group.inviteCode).toBe('ABC123');
    });

    it('should enforce uniqueness across groups', async () => {
      await Group.create({
        name: 'Group A',
        admin: adminUser._id,
        inviteCode: 'SAME_CODE'
      });

      await expect(
        Group.create({
          name: 'Group B',
          admin: adminUser._id,
          inviteCode: 'SAME_CODE'
        })
      ).rejects.toThrow();
    });

    it('should allow different groups to have different invite codes', async () => {
      const groupA = await Group.create({
        name: 'Group A',
        admin: adminUser._id,
        inviteCode: 'CODE_A'
      });

      const groupB = await Group.create({
        name: 'Group B',
        admin: adminUser._id,
        inviteCode: 'CODE_B'
      });

      expect(groupA.inviteCode).toBe('CODE_A');
      expect(groupB.inviteCode).toBe('CODE_B');
    });
  });

  // ──────────────────────────────────────────────
  // Timestamps
  // ──────────────────────────────────────────────
  describe('Timestamps', () => {
    it('should automatically add createdAt timestamp', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      expect(group.createdAt).toBeDefined();
      expect(group.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically add updatedAt timestamp', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      expect(group.updatedAt).toBeDefined();
      expect(group.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      const originalUpdatedAt = group.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      group.name = 'Updated Group';
      await group.save();

      expect(group.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  // ──────────────────────────────────────────────
  // Update Operations
  // ──────────────────────────────────────────────
  describe('Update Operations', () => {
    it('should update the group name', async () => {
      const group = await Group.create({
        name: 'Original Name',
        admin: adminUser._id
      });

      group.name = 'Updated Name';
      await group.save();

      const found = await Group.findById(group._id);
      expect(found.name).toBe('Updated Name');
    });

    it('should update the group description', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      group.description = 'New description';
      await group.save();

      const found = await Group.findById(group._id);
      expect(found.description).toBe('New description');
    });

    it('should update maxMembers', async () => {
      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id
      });

      group.maxMembers = 15;
      await group.save();

      const found = await Group.findById(group._id);
      expect(found.maxMembers).toBe(15);
    });
  });

  // ──────────────────────────────────────────────
  // Deletion
  // ──────────────────────────────────────────────
  describe('Deletion', () => {
    it('should delete a group by id', async () => {
      const group = await Group.create({
        name: 'To Delete',
        admin: adminUser._id
      });

      await Group.findByIdAndDelete(group._id);

      const found = await Group.findById(group._id);
      expect(found).toBeNull();
    });
  });
});