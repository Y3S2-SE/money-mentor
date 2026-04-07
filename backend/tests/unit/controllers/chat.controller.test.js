import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

const mockChatResponse = {
  response: {
    text: jest.fn().mockReturnValue('This is an AI response about budgeting.')
  }
};

const mockChatSession = {
  sendMessage: jest.fn().mockResolvedValue(mockChatResponse)
};

jest.unstable_mockModule('../../../models/chat.model.js', () => ({
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  }
}));

jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      startChat: jest.fn().mockReturnValue(mockChatSession),
      generateContent: jest.fn().mockResolvedValue(mockChatResponse)
    }))
  }))
}));

const Chat = await import('../../../models/chat.model.js');
const { startConversation, sendMessage, getAllConversations, getConversation, deleteConversation } = await import('../../../controllers/chat.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, params = {}, user = { _id: mockUserId } } = {}) => ({
  req: { user, body, params },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Chat Controller - startConversation', () => {
  it('should start a new conversation with valid message', async () => {
    const mockChat = {
      _id: new mongoose.Types.ObjectId(),
      title: 'How can I save',
      messages: [],
      youtubeKeywords: []
    };
    
    Chat.default.create.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ body: { message: 'How can I save money?' } });

    await startConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should reject empty message', async () => {
    const { req, res } = buildMocks({ body: { message: '' } });

    await startConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should handle missing message', async () => {
    const { req, res } = buildMocks({ body: {} });

    await startConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle database errors', async () => {
    Chat.default.create.mockRejectedValue(new Error('DB error'));
    const { req, res } = buildMocks({ body: { message: 'Help!' } });

    await startConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe('Chat Controller - sendMessage', () => {
  const mockChatId = new mongoose.Types.ObjectId();
  
  it('should send message to existing conversation', async () => {
    const mockChat = {
      _id: mockChatId,
      user: mockUserId,
      messages: [],
      save: jest.fn().mockResolvedValue(true)
    };
    
    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({
      params: { id: mockChatId },
      body: { message: 'Tell me more' }
    });

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should reject if chat not found', async () => {
    Chat.default.findById.mockResolvedValue(null);
    const { req, res } = buildMocks({
      params: { id: mockChatId },
      body: { message: 'Tell me more' }
    });

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should reject if user is not chat owner', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const mockChat = {
      _id: mockChatId,
      user: otherUserId,
      messages: []
    };
    
    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({
      params: { id: mockChatId },
      body: { message: 'Tell me more' }
    });

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should reject empty message', async () => {
    const mockChat = {
      _id: mockChatId,
      user: mockUserId,
      messages: []
    };
    
    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({
      params: { id: mockChatId },
      body: { message: '' }
    });

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Chat Controller - getAllConversations', () => {
  it('should return all user conversations', async () => {
    const mockChats = [
      { _id: new mongoose.Types.ObjectId(), title: 'Chat 1' },
      { _id: new mongoose.Types.ObjectId(), title: 'Chat 2' }
    ];
    
    const mockQuery = { 
      select: jest.fn().mockReturnThis(), 
      sort: jest.fn().mockResolvedValue(mockChats) 
    };
    Chat.default.find.mockReturnValue(mockQuery);
    
    const { req, res } = buildMocks();

    await getAllConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should handle database errors', async () => {
    Chat.default.find.mockImplementation(() => {
      throw new Error('DB error');
    });
    
    const { req, res } = buildMocks();

    await getAllConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Chat Controller - getConversation', () => {
  const mockChatId = new mongoose.Types.ObjectId();

  it('should return conversation if user is owner', async () => {
    const mockChat = {
      _id: mockChatId,
      user: mockUserId,
      title: 'My Chat'
    };
    
    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ params: { id: mockChatId } });

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should reject if chat not found', async () => {
    Chat.default.findById.mockResolvedValue(null);
    const { req, res } = buildMocks({ params: { id: mockChatId } });

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should reject if user is not owner', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const mockChat = {
      _id: mockChatId,
      user: otherUserId
    };
    
    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ params: { id: mockChatId } });

    await getConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('Chat Controller - deleteConversation', () => {
  const mockChatId = new mongoose.Types.ObjectId();

  it('should delete conversation if user is owner', async () => {
    const mockChat = {
      _id: mockChatId,
      user: mockUserId
    };
    
    Chat.default.findById.mockResolvedValue(mockChat);
    Chat.default.findByIdAndDelete.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ params: { id: mockChatId } });

    await deleteConversation(req, res);

    expect(Chat.default.findByIdAndDelete).toHaveBeenCalledWith(mockChatId);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reject if user is not owner', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const mockChat = {
      _id: mockChatId,
      user: otherUserId
    };
    
    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ params: { id: mockChatId } });

    await deleteConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should handle chat not found', async () => {
    Chat.default.findById.mockResolvedValue(null);
    const { req, res } = buildMocks({ params: { id: mockChatId } });

    await deleteConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});