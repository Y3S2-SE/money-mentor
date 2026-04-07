import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/group.model.js', () => ({
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }
}));

const Group = await import('../../../models/group.model.js');
const {
  createGroup,
  joinGroup,
  leaveGroup,
  getUserGroups,
  getGroupById,
  deleteGroup,
  removeMember,
  updateGroup,
  regenerateInviteCode
} = await import('../../../controllers/group.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, user = { id: mockUserId.toString() } } = {}) => ({
  req: { user, body },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Group Controller - createGroup', () => {
  it('should create group with valid data', async () => {
    const mockGroup = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Savings Club',
      admin: mockUserId,
      members: [mockUserId]
    };

    Group.default.create.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { name: 'Savings Club' } });

    await createGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Savings Club' }));
  });

  it('should reject missing group name', async () => {
    const { req, res } = buildMocks({ body: {} });

    await createGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group name is required' }));
  });

  it('should handle creation errors', async () => {
    Group.default.create.mockRejectedValue(new Error('DB error'));
    const { req, res } = buildMocks({ body: { name: 'Club' } });

    await createGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Group Controller - joinGroup', () => {
  const mockGroupId = new mongoose.Types.ObjectId();

  it('should allow user to join group with valid code', async () => {
    const mockGroup = {
      _id: mockGroupId,
      inviteCode: 'abc123',
      members: [new mongoose.Types.ObjectId()],
      maxMembers: 5,
      save: jest.fn().mockResolvedValue(true)
    };

    Group.default.findOne.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { inviteCode: 'abc123' } });

    await joinGroup(req, res);

    expect(mockGroup.members).toContain(mockUserId.toString());
    expect(mockGroup.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Joined successfully' }));
  });

  it('should reject if user already is member', async () => {
    const mockGroup = {
      _id: mockGroupId,
      inviteCode: 'abc123',
      members: [mockUserId.toString()],
      maxMembers: 5
    };

    Group.default.findOne.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { inviteCode: 'abc123' } });

    await joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Already a member' }));
  });

  it('should reject if group is full', async () => {
    const mockGroup = {
      _id: mockGroupId,
      members: [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ],
      maxMembers: 5
    };

    Group.default.findOne.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { inviteCode: 'abc123' } });

    await joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group is full' }));
  });

  it('should reject with missing invite code', async () => {
    const { req, res } = buildMocks({ body: {} });

    await joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invite code is required' }));
  });

  it('should handle group not found', async () => {
    Group.default.findOne.mockResolvedValue(null);
    const { req, res } = buildMocks({ body: { inviteCode: 'invalid' } });

    await joinGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('Group Controller - leaveGroup', () => {
  const mockGroupId = new mongoose.Types.ObjectId();

  it('should allow user to leave group if not admin', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const mockGroup = {
      _id: mockGroupId,
      admin: adminId,
      members: [mockUserId.toString(), adminId.toString()],
      save: jest.fn().mockResolvedValue(true)
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await leaveGroup(req, res);

    expect(mockGroup.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Left group successfully' }));
  });

  it('should prevent admin from leaving', async () => {
    const mockGroup = {
      _id: mockGroupId,
      admin: mockUserId
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Admin cannot leave the group' }));
  });

  it('should handle group not found', async () => {
    Group.default.findById.mockResolvedValue(null);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(404); // Changed from 500 to 404
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group not found' }));
  });

  it('should handle database errors', async () => {
    Group.default.findById.mockImplementation(() => {
      throw new Error('DB error');
    });

    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await leaveGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Group Controller - deleteGroup', () => {
  const mockGroupId = new mongoose.Types.ObjectId();

  it('should allow admin to delete group', async () => {
    const mockGroup = {
      _id: mockGroupId,
      admin: mockUserId
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    Group.default.findByIdAndDelete.mockResolvedValue(mockGroup);

    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await deleteGroup(req, res);

    expect(Group.default.findByIdAndDelete).toHaveBeenCalledWith(mockGroupId);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group deleted successfully' }));
  });

  it('should prevent non-admin from deleting', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const mockGroup = {
      _id: mockGroupId,
      admin: adminId
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await deleteGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('Group Controller - removeMember', () => {
  const mockGroupId = new mongoose.Types.ObjectId();
  const memberId = new mongoose.Types.ObjectId();

  it('should allow admin to remove member', async () => {
    const mockGroup = {
      _id: mockGroupId,
      admin: mockUserId,
      members: [mockUserId.toString(), memberId.toString()],
      save: jest.fn().mockResolvedValue(true)
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId, memberId } });

    await removeMember(req, res);

    expect(mockGroup.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Member removed successfully' }));
  });

  it('should prevent non-admin from removing member', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const mockGroup = {
      _id: mockGroupId,
      admin: adminId
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId, memberId } });

    await removeMember(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('Group Controller - updateGroup', () => {
  const mockGroupId = new mongoose.Types.ObjectId();

  it('should allow admin to update group details', async () => {
    const mockGroup = {
      _id: mockGroupId,
      name: 'Old Name',
      admin: mockUserId,
      save: jest.fn().mockResolvedValue(true)
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({
      body: { groupId: mockGroupId, name: 'New Name' }
    });

    await updateGroup(req, res);

    expect(mockGroup.name).toBe('New Name');
    expect(mockGroup.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group updated successfully' }));
  });

  it('should prevent non-admin from updating', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const mockGroup = {
      _id: mockGroupId,
      admin: adminId
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({
      body: { groupId: mockGroupId, name: 'New Name' }
    });

    await updateGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('Group Controller - regenerateInviteCode', () => {
  const mockGroupId = new mongoose.Types.ObjectId();

  it('should allow admin to regenerate invite code', async () => {
    const mockGroup = {
      _id: mockGroupId,
      inviteCode: 'old123',
      admin: mockUserId,
      save: jest.fn().mockResolvedValue(true)
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await regenerateInviteCode(req, res);

    expect(mockGroup.inviteCode).not.toBe('old123');
    expect(mockGroup.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invite code regenerated' }));
  });

  it('should prevent non-admin from regenerating code', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const mockGroup = {
      _id: mockGroupId,
      admin: adminId
    };

    Group.default.findById.mockResolvedValue(mockGroup);
    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await regenerateInviteCode(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('Group Controller - getUserGroups', () => {
  it('should return all user groups', async () => {
    const mockGroups = [
      { _id: new mongoose.Types.ObjectId(), name: 'Group 1' }
    ];

    // Properly chain populate calls
    Group.default.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: jest.fn(callback => callback(mockGroups)),
    });

    const { req, res } = buildMocks();

    await getUserGroups(req, res);

    expect(res.json).toHaveBeenCalledWith(mockGroups);
  });

  it('should handle database errors', async () => {
    Group.default.find.mockImplementation(() => {
      throw new Error('DB error');
    });

    const { req, res } = buildMocks();

    await getUserGroups(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Group Controller - getGroupById', () => {
  const mockGroupId = new mongoose.Types.ObjectId();

  it('should return group details', async () => {
    const mockGroup = {
      _id: mockGroupId,
      name: 'Test Group'
    };

    // Properly chain populate calls
    Group.default.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: jest.fn(callback => callback(mockGroup)),
    });

    const { req, res } = buildMocks({ body: { groupId: mockGroupId } });

    await getGroupById(req, res);

    expect(res.json).toHaveBeenCalledWith(mockGroup);
  });

  it('should handle group not found', async () => {
    Group.default.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: jest.fn(callback => callback(null)), // Return null for not found
    });

    const { req, res } = buildMocks({ body: { groupId: new mongoose.Types.ObjectId() } });

    await getGroupById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group not found' }));
  });

  it('should handle database errors', async () => {
    Group.default.findById.mockImplementation(() => {
      throw new Error('DB error');
    });

    const { req, res } = buildMocks({ body: { groupId: new mongoose.Types.ObjectId() } });

    await getGroupById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});