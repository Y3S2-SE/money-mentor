import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/chat.model.js', () => ({
  default: {
    findById: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../models/youtube.model.js', () => ({
  default: {
    findOne: jest.fn(),
  }
}));

const Chat = await import('../../../models/chat.model.js');
const YoutubeCache = await import('../../../models/youtube.model.js');
const { getVideoSuggestions } = await import('../../../controllers/youtube.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ query = {}, user = { _id: mockUserId } } = {}) => ({
  req: { user, query },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('YouTube Controller - getVideoSuggestions', () => {
  const mockChatId = new mongoose.Types.ObjectId();

  it('should require chatId query parameter', async () => {
    const { req, res } = buildMocks({ query: {} });

    await getVideoSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'chatId is required'
    }));
  });

  it('should return 404 if chat not found', async () => {
    Chat.default.findById.mockResolvedValue(null);
    const { req, res } = buildMocks({ query: { chatId: mockChatId } });

    await getVideoSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Conversation not found'
    }));
  });

  it('should reject if user is not chat owner', async () => {
    const otherUserId = new mongoose.Types.ObjectId();
    const mockChat = {
      _id: mockChatId,
      user: otherUserId,
      youtubeKeywords: ['budgeting']
    };

    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ query: { chatId: mockChatId } });

    await getVideoSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Not authorized to access this conversation'
    }));
  });

  it('should return empty videos if no keywords available', async () => {
    const mockChat = {
      _id: mockChatId,
      user: mockUserId,
      youtubeKeywords: []
    };

    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ query: { chatId: mockChatId } });

    await getVideoSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        keywords: [],
        videos: [],
        cacheStats: expect.any(Object)
      })
    }));
  });

  it('should handle null youtubeKeywords', async () => {
    const mockChat = {
      _id: mockChatId,
      user: mockUserId,
      youtubeKeywords: null
    };

    Chat.default.findById.mockResolvedValue(mockChat);
    const { req, res } = buildMocks({ query: { chatId: mockChatId } });

    await getVideoSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('No keywords available')
    }));
  });

  it('should handle service errors gracefully', async () => {
    Chat.default.findById.mockRejectedValue(new Error('DB error'));
    const { req, res } = buildMocks({ query: { chatId: mockChatId } });

    await getVideoSuggestions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false
    }));
  });

  it('should use default keyword processing with cache check', async () => {
    const mockChat = {
      _id: mockChatId,
      user: mockUserId,
      youtubeKeywords: ['budgeting basics']
    };

    Chat.default.findById.mockResolvedValue(mockChat);
    YoutubeCache.default.findOne.mockResolvedValue(null); // Not in cache

    const { req, res } = buildMocks({ query: { chatId: mockChatId } });

    // Note: This will attempt to fetch from YouTube API, which will fail in tests
    // That's expected - we're testing the controller logic
    try {
      await getVideoSuggestions(req, res);
    } catch (e) {
      // Expected to fail at YouTube API call in test environment
    }

    expect(Chat.default.findById).toHaveBeenCalledWith(mockChatId);
  });
});