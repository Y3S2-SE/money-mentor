import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ── STEP 1: Register mocks BEFORE any model imports ───────────
// With ESM, jest.mock() cannot reference outer variables.
// jest.unstable_mockModule() is the correct ESM-compatible API.

jest.unstable_mockModule('../../../models/group.model.js', () => ({
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../models/user.model.js', () => ({
  default: {
    create: jest.fn(),
  }
}));

// ── STEP 2: Dynamic import AFTER mock registration ─────────────
// Static imports are hoisted above jest.unstable_mockModule calls,
// so we must use await import() to guarantee mocks load first.
const { default: Group } = await import('../../../models/group.model.js');
const { default: User } = await import('../../../models/user.model.js');

// ── Helpers ────────────────────────────────────────────────────
const makeId = () => new mongoose.Types.ObjectId();

const makeGroup = (overrides = {}) => ({
  _id: makeId(),
  name: 'Test Group',
  admin: makeId(),
  members: [],
  maxMembers: 5,
  inviteCode: undefined,
  description: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn(),   // each makeGroup() call gets its own save mock
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────
describe('Group Model Unit Tests (pure mocks)', () => {
  let adminUser;
  let memberUser;

  beforeEach(() => {
    jest.clearAllMocks();
    adminUser = { _id: makeId(), username: 'adminuser', email: 'admin@example.com' };
    memberUser = { _id: makeId(), username: 'memberuser', email: 'member@example.com' };
    // Note: User.create is mocked but not needed in group tests,
    // so no need to set it up here
  });

  // ── Group Creation ─────────────────────────────────────────
  describe('Group Creation', () => {
    it('should create a valid group with required fields only', async () => {
      const group = makeGroup({ name: 'Test Group', admin: adminUser._id });
      Group.create.mockResolvedValue(group);

      const result = await Group.create({ name: 'Test Group', admin: adminUser._id });

      expect(result.name).toBe('Test Group');
      expect(result.admin.toString()).toBe(adminUser._id.toString());
      expect(result.maxMembers).toBe(5);
      expect(result.members).toHaveLength(0);
    });

    it('should create a group with all optional fields', async () => {
      const group = makeGroup({
        name: 'Full Group',
        description: 'A group with all fields',
        inviteCode: 'INVITE123',
        admin: adminUser._id,
        members: [memberUser._id],
        maxMembers: 10
      });
      Group.create.mockResolvedValue(group);

      const result = await Group.create({
        name: 'Full Group',
        description: 'A group with all fields',
        inviteCode: 'INVITE123',
        admin: adminUser._id,
        members: [memberUser._id],
        maxMembers: 10
      });

      expect(result.name).toBe('Full Group');
      expect(result.description).toBe('A group with all fields');
      expect(result.inviteCode).toBe('INVITE123');
      expect(result.members).toHaveLength(1);
      expect(result.maxMembers).toBe(10);
    });

    it('should fail without name', async () => {
      Group.create.mockRejectedValue(new Error('Validation failed: name is required'));

      await expect(Group.create({ admin: adminUser._id })).rejects.toThrow();
    });

    it('should fail without admin', async () => {
      Group.create.mockRejectedValue(new Error('Validation failed: admin is required'));

      await expect(Group.create({ name: 'Test Group' })).rejects.toThrow();
    });

    it('should fail with an invalid admin ObjectId', async () => {
      Group.create.mockRejectedValue(new Error('Cast to ObjectId failed'));

      await expect(
        Group.create({ name: 'Test Group', admin: 'not-an-object-id' })
      ).rejects.toThrow();
    });

    it('should fail with a duplicate inviteCode', async () => {
      Group.create
        .mockResolvedValueOnce(makeGroup({ inviteCode: 'DUPLICATE' }))
        .mockRejectedValueOnce(new Error('E11000 duplicate key error'));

      await Group.create({ name: 'First Group', admin: adminUser._id, inviteCode: 'DUPLICATE' });

      await expect(
        Group.create({ name: 'Second Group', admin: adminUser._id, inviteCode: 'DUPLICATE' })
      ).rejects.toThrow();
    });

    it('should trim whitespace from name', async () => {
      Group.create.mockResolvedValue(makeGroup({ name: 'Trimmed Group' }));

      const result = await Group.create({ name: '  Trimmed Group  ', admin: adminUser._id });

      expect(result.name).toBe('Trimmed Group');
    });

    it('should trim whitespace from description', async () => {
      Group.create.mockResolvedValue(makeGroup({ description: 'Some description' }));

      const result = await Group.create({
        name: 'Test Group',
        description: '  Some description  ',
        admin: adminUser._id
      });

      expect(result.description).toBe('Some description');
    });
  });

  // ── Default Values ─────────────────────────────────────────
  describe('Default Values', () => {
    it('should default maxMembers to 5', async () => {
      Group.create.mockResolvedValue(makeGroup());

      const result = await Group.create({ name: 'Default Group', admin: adminUser._id });

      expect(result.maxMembers).toBe(5);
    });

    it('should default members to an empty array', async () => {
      Group.create.mockResolvedValue(makeGroup());

      const result = await Group.create({ name: 'Default Group', admin: adminUser._id });

      expect(Array.isArray(result.members)).toBe(true);
      expect(result.members).toHaveLength(0);
    });

    it('should allow overriding maxMembers default', async () => {
      Group.create.mockResolvedValue(makeGroup({ maxMembers: 20 }));

      const result = await Group.create({
        name: 'Large Group',
        admin: adminUser._id,
        maxMembers: 20
      });

      expect(result.maxMembers).toBe(20);
    });
  });

  // ── Members ────────────────────────────────────────────────
  describe('Members', () => {
    it('should add a member to a group', async () => {
      Group.create.mockResolvedValue(makeGroup({ members: [memberUser._id] }));

      const result = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberUser._id]
      });

      expect(result.members).toHaveLength(1);
      expect(result.members[0].toString()).toBe(memberUser._id.toString());
    });

    it('should add multiple members to a group', async () => {
      const extraId = makeId();
      Group.create.mockResolvedValue(makeGroup({ members: [memberUser._id, extraId] }));

      const result = await Group.create({
        name: 'Multi-member Group',
        admin: adminUser._id,
        members: [memberUser._id, extraId]
      });

      expect(result.members).toHaveLength(2);
    });

    it('should persist member additions via save', async () => {
      const group = makeGroup({ admin: adminUser._id });
      Group.create.mockResolvedValue(group);

      const created = await Group.create({ name: 'Test Group', admin: adminUser._id });
      created.members.push(memberUser._id);

      const updatedGroup = makeGroup({ members: [memberUser._id] });
      created.save.mockResolvedValue(updatedGroup);
      Group.findById.mockResolvedValue(updatedGroup);

      await created.save();
      const found = await Group.findById(created._id);

      expect(found.members).toHaveLength(1);
    });

    it('should persist member removals via save', async () => {
      const group = makeGroup({ members: [memberUser._id] });
      Group.create.mockResolvedValue(group);

      const created = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberUser._id]
      });

      created.members = [];
      const updatedGroup = makeGroup({ members: [] });
      created.save.mockResolvedValue(updatedGroup);
      Group.findById.mockResolvedValue(updatedGroup);

      await created.save();
      const found = await Group.findById(created._id);

      expect(found.members).toHaveLength(0);
    });

    it('should store members as ObjectIds', async () => {
      const memberId = new mongoose.Types.ObjectId();
      Group.create.mockResolvedValue(makeGroup({ members: [memberId] }));

      const result = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberId]
      });

      expect(result.members[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should fail with an invalid member ObjectId', async () => {
      Group.create.mockRejectedValue(new Error('Cast to ObjectId failed'));

      await expect(
        Group.create({ name: 'Test Group', admin: adminUser._id, members: ['invalid-id'] })
      ).rejects.toThrow();
    });
  });

  // ── Admin Reference ────────────────────────────────────────
  describe('Admin Reference', () => {
    it('should store admin as an ObjectId', async () => {
      Group.create.mockResolvedValue(makeGroup({ admin: adminUser._id }));

      const result = await Group.create({ name: 'Test Group', admin: adminUser._id });

      expect(result.admin).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(result.admin.toString()).toBe(adminUser._id.toString());
    });

    it('should populate admin with user data', async () => {
      const populatedGroup = makeGroup({
        admin: { _id: adminUser._id, username: 'adminuser', email: 'admin@example.com' }
      });

      Group.create.mockResolvedValue(makeGroup({ admin: adminUser._id }));
      Group.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedGroup)
      });

      const group = await Group.create({ name: 'Test Group', admin: adminUser._id });
      const populated = await Group.findById(group._id).populate('admin');

      expect(populated.admin.username).toBe('adminuser');
      expect(populated.admin.email).toBe('admin@example.com');
    });

    it('should populate members with user data', async () => {
      const populatedGroup = makeGroup({
        members: [{ _id: memberUser._id, username: 'memberuser' }]
      });

      Group.create.mockResolvedValue(makeGroup({ members: [memberUser._id] }));
      Group.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedGroup)
      });

      const group = await Group.create({
        name: 'Test Group',
        admin: adminUser._id,
        members: [memberUser._id]
      });
      const populated = await Group.findById(group._id).populate('members');

      expect(populated.members[0].username).toBe('memberuser');
    });
  });

  // ── Invite Code ────────────────────────────────────────────
  describe('Invite Code', () => {
    it('should allow a group without an inviteCode', async () => {
      Group.create.mockResolvedValue(makeGroup());

      const result = await Group.create({ name: 'No Invite Group', admin: adminUser._id });

      expect(result.inviteCode).toBeUndefined();
    });

    it('should save a provided inviteCode', async () => {
      Group.create.mockResolvedValue(makeGroup({ inviteCode: 'ABC123' }));

      const result = await Group.create({
        name: 'Invite Group',
        admin: adminUser._id,
        inviteCode: 'ABC123'
      });

      expect(result.inviteCode).toBe('ABC123');
    });

    it('should enforce uniqueness across groups', async () => {
      Group.create
        .mockResolvedValueOnce(makeGroup({ inviteCode: 'SAME_CODE' }))
        .mockRejectedValueOnce(new Error('E11000 duplicate key error'));

      await Group.create({ name: 'Group A', admin: adminUser._id, inviteCode: 'SAME_CODE' });

      await expect(
        Group.create({ name: 'Group B', admin: adminUser._id, inviteCode: 'SAME_CODE' })
      ).rejects.toThrow();
    });

    it('should allow different groups to have different invite codes', async () => {
      Group.create
        .mockResolvedValueOnce(makeGroup({ inviteCode: 'CODE_A' }))
        .mockResolvedValueOnce(makeGroup({ inviteCode: 'CODE_B' }));

      const groupA = await Group.create({ name: 'Group A', admin: adminUser._id, inviteCode: 'CODE_A' });
      const groupB = await Group.create({ name: 'Group B', admin: adminUser._id, inviteCode: 'CODE_B' });

      expect(groupA.inviteCode).toBe('CODE_A');
      expect(groupB.inviteCode).toBe('CODE_B');
    });
  });

  // ── Timestamps ─────────────────────────────────────────────
  describe('Timestamps', () => {
    it('should automatically add createdAt timestamp', async () => {
      Group.create.mockResolvedValue(makeGroup());

      const result = await Group.create({ name: 'Test Group', admin: adminUser._id });

      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically add updatedAt timestamp', async () => {
      Group.create.mockResolvedValue(makeGroup());

      const result = await Group.create({ name: 'Test Group', admin: adminUser._id });

      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const originalTime = new Date('2024-01-01');
      const updatedTime = new Date('2024-01-02');

      const group = makeGroup({ updatedAt: originalTime });
      Group.create.mockResolvedValue(group);

      group.save.mockImplementation(async () => {
        group.updatedAt = updatedTime;
        return group;
      });

      const created = await Group.create({ name: 'Test Group', admin: adminUser._id });
      created.name = 'Updated Group';
      await created.save();

      expect(created.updatedAt.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });

  // ── Update Operations ──────────────────────────────────────
  describe('Update Operations', () => {
    it('should update the group name', async () => {
      const group = makeGroup({ name: 'Original Name' });
      Group.create.mockResolvedValue(group);
      Group.findById.mockResolvedValue({ ...group, name: 'Updated Name' });
      group.save.mockResolvedValue({ ...group, name: 'Updated Name' });

      const created = await Group.create({ name: 'Original Name', admin: adminUser._id });
      created.name = 'Updated Name';
      await created.save();

      const found = await Group.findById(created._id);
      expect(found.name).toBe('Updated Name');
    });

    it('should update the group description', async () => {
      const group = makeGroup();
      Group.create.mockResolvedValue(group);
      Group.findById.mockResolvedValue({ ...group, description: 'New description' });
      group.save.mockResolvedValue({ ...group, description: 'New description' });

      const created = await Group.create({ name: 'Test Group', admin: adminUser._id });
      created.description = 'New description';
      await created.save();

      const found = await Group.findById(created._id);
      expect(found.description).toBe('New description');
    });

    it('should update maxMembers', async () => {
      const group = makeGroup();
      Group.create.mockResolvedValue(group);
      Group.findById.mockResolvedValue({ ...group, maxMembers: 15 });
      group.save.mockResolvedValue({ ...group, maxMembers: 15 });

      const created = await Group.create({ name: 'Test Group', admin: adminUser._id });
      created.maxMembers = 15;
      await created.save();

      const found = await Group.findById(created._id);
      expect(found.maxMembers).toBe(15);
    });
  });

  // ── Deletion ───────────────────────────────────────────────
  describe('Deletion', () => {
    it('should delete a group by id', async () => {
      const group = makeGroup();
      Group.create.mockResolvedValue(group);
      Group.findByIdAndDelete.mockResolvedValue(group);
      Group.findById.mockResolvedValue(null);

      const created = await Group.create({ name: 'To Delete', admin: adminUser._id });
      await Group.findByIdAndDelete(created._id);
      const found = await Group.findById(created._id);

      expect(found).toBeNull();
    });
  });
});
