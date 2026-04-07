import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/message.model.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../models/group.model.js', () => ({
  default: {
    findById: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../websocket/wsTicketStore.js', () => ({
  createTicket: jest.fn()
}));

const Message = await import('../../../models/message.model.js');
const Group = await import('../../../models/group.model.js');
const { createTicket } = await import('../../../websocket/wsTicketStore.js');
const { getWsTicket, getMessageHistory, deleteMessage } = await import('../../../controllers/chatRoom.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, params = {}, query = {}, user = { _id: mockUserId } } = {}) => ({
  req: { user, body, params, query },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ChatRoom Controller - getWsTicket', () => {
  it('should create and return WebSocket ticket', async () => {
    const mockTicket = 'ticket123';
    createTicket.mockReturnValue(mockTicket);
    const { req, res } = buildMocks();

    await getWsTicket(req, res);

    expect(createTicket).toHaveBeenCalledWith(mockUserId.toString());
    expect(res.json).toHaveBeenCalledWith({ success: true, ticket: mockTicket });
  });

  it('should handle ticket creation errors', async () => {
    createTicket.mockImplementation(() => {
      throw new Error('Ticket error');
    });
    const { req, res } = buildMocks();

    await getWsTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe('ChatRoom Controller - getMessageHistory', () => {
  const mockGroupId = new mongoose.Types.ObjectId();

  it('should return message history for group member', async () => {
    const mockGroup = {
      _id: mockGroupId,
      members: [mockUserId],
      admin: new mongoose.Types.ObjectId()
    };

    const mockMessages = [
      { _id: new mongoose.Types.ObjectId(), content: 'Hello' }
    ];

    Group.default.findById.mockResolvedValue(mockGroup);
    
    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockMessages)
    };
    
    Message.default.find.mockReturnValue(mockQuery);
    Message.default.countDocuments.mockResolvedValue(10);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId },
      query: { page: '1', limit: '10' }
    });

    await getMessageHistory(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ pagination: expect.any(Object) })
    }));
  });

  it('should reject non-members', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const mockGroup = {
      _id: mockGroupId,
      members: [otherUserId],
      admin: otherUserId
    };

    Group.default.findById.mockResolvedValue(mockGroup);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId }
    });

    await getMessageHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should handle group not found', async () => {
    Group.default.findById.mockResolvedValue(null);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId }
    });

    await getMessageHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should use default pagination when not provided', async () => {
    const mockGroup = {
      _id: mockGroupId,
      members: [mockUserId],
      admin: mockUserId
    };

    Group.default.findById.mockResolvedValue(mockGroup);

    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([])
    };

    Message.default.find.mockReturnValue(mockQuery);
    Message.default.countDocuments.mockResolvedValue(5);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId },
      query: {}
    });

    await getMessageHistory(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('ChatRoom Controller - deleteMessage', () => {
  const mockGroupId = new mongoose.Types.ObjectId();
  const mockMessageId = new mongoose.Types.ObjectId();

  it('should allow message owner to delete', async () => {
    const mockMessage = {
      _id: mockMessageId,
      groupId: mockGroupId,
      sender: mockUserId,
      deletedAt: null,
      save: jest.fn().mockResolvedValue(true)
    };

    const mockGroup = {
      _id: mockGroupId,
      admin: new mongoose.Types.ObjectId()
    };

    Message.default.findOne.mockResolvedValue(mockMessage);
    Group.default.findById.mockResolvedValue(mockGroup);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId, messageId: mockMessageId }
    });

    await deleteMessage(req, res);

    expect(mockMessage.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should allow admin to delete message', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const mockMessage = {
      _id: mockMessageId,
      groupId: mockGroupId,
      sender: otherUserId,
      deletedAt: null,
      save: jest.fn().mockResolvedValue(true)
    };

    const mockGroup = {
      _id: mockGroupId,
      admin: mockUserId
    };

    Message.default.findOne.mockResolvedValue(mockMessage);
    Group.default.findById.mockResolvedValue(mockGroup);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId, messageId: mockMessageId }
    });

    await deleteMessage(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should reject non-owner non-admin', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const adminUserId = new mongoose.Types.ObjectId();
    
    const mockMessage = {
      _id: mockMessageId,
      sender: otherUserId
    };

    const mockGroup = {
      _id: mockGroupId,
      admin: adminUserId
    };

    Message.default.findOne.mockResolvedValue(mockMessage);
    Group.default.findById.mockResolvedValue(mockGroup);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId, messageId: mockMessageId }
    });

    await deleteMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should handle message not found', async () => {
    Message.default.findOne.mockResolvedValue(null);

    const { req, res } = buildMocks({
      params: { groupId: mockGroupId, messageId: mockMessageId }
    });

    await deleteMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});