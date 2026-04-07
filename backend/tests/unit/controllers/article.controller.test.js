import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/article.model.js', () => ({
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../middleware/upload.middleware.js', () => ({
  uploadToCloudinary: jest.fn(),
}));

jest.unstable_mockModule('../../../utils/gamificationEngine.js', () => ({
  awardActionBadge: jest.fn().mockResolvedValue(null),
  processXPEvent: jest.fn().mockResolvedValue({
    xpResult: { leveledUp: false, newLevel: 1 },
    newlyEarnedBadges: [],
  }),
}));

const Article = (await import('../../../models/article.model.js')).default;
const articleController = await import('../../../controllers/article.controller.js');
const { uploadToCloudinary } = await import('../../../middleware/upload.middleware.js');

const mockUserId = new mongoose.Types.ObjectId();
const mockArticleId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, params = {}, query = {}, user = { _id: mockUserId, role: 'user' }, file = null } = {}) => ({
  req: { body, params, query, user, file },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
  next: jest.fn(),
});

jest.doMock('../../../utils/gamificationEngine.js', () => ({
  awardActionBadge: jest.fn().mockResolvedValue(null),
  processXPEvent: jest.fn().mockResolvedValue({
    xpResult: { leveledUp: false, newLevel: 1 },
    newlyEarnedBadges: [],
  }),
}));

const mockArticle = (overrides = {}) => ({
  _id: mockArticleId,
  title: 'Test Article',
  summary: 'A summary',
  content: { type: 'doc', content: [] },
  category: 'budgeting',
  isPublished: true,
  readTime: 2,
  pointsPerRead: 15,
  createdBy: mockUserId,
  completions: [],
  toObject: jest.fn().mockReturnThis(),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


// ── createArticle ──────────────────────────────────────────────────
describe('Article Controller - createArticle', () => {
  it('should return 201 on successful creation', async () => {
    const article = mockArticle();
    Article.create.mockResolvedValue(article);

    const { req, res } = buildMocks({
      body: { title: 'Test', summary: 'Summary', content: { type: 'doc' }, category: 'budgeting' },
      user: { _id: mockUserId, role: 'admin' }
    });

    await articleController.createArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Article created successfully',
    }));
  });

  it('should parse content if it is a string', async () => {
    const article = mockArticle();
    Article.create.mockResolvedValue(article);

    const { req, res } = buildMocks({
      body: {
        title: 'Test',
        summary: 'Summary',
        content: JSON.stringify({ type: 'doc' }),
        category: 'budgeting'
      },
      user: { _id: mockUserId, role: 'admin' }
    });

    await articleController.createArticle(req, res);

    expect(Article.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: { type: 'doc' } })
    );
  });

  it('should convert isPublished string "true" to boolean', async () => {
    Article.create.mockResolvedValue(mockArticle());

    const { req, res } = buildMocks({
      body: { title: 'Test', summary: 'S', content: {}, category: 'budgeting', isPublished: 'true' },
      user: { _id: mockUserId, role: 'admin' }
    });

    await articleController.createArticle(req, res);

    expect(Article.create).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: true })
    );
  });

  it('should return 500 on error', async () => {
    Article.create.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({ body: {}, user: { _id: mockUserId, role: 'admin' } });

    await articleController.createArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ─getAllArticles tests ──────────────────────────────────
describe('Article Controller - getAllArticles', () => {
  it('should filter by category', async () => {
    Article.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
    Article.countDocuments.mockResolvedValue(0);

    const { req, res } = buildMocks({ query: { category: 'investing' } });

    await articleController.getAllArticles(req, res);

    expect(Article.find).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'investing' })
    );
  });

  it('should filter by difficulty', async () => {
    Article.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
    Article.countDocuments.mockResolvedValue(0);

    const { req, res } = buildMocks({ query: { difficulty: 'advanced' } });

    await articleController.getAllArticles(req, res);

    expect(Article.find).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'advanced' })
    );
  });

  it('should search by title and summary', async () => {
    Article.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
    Article.countDocuments.mockResolvedValue(0);

    const { req, res } = buildMocks({ query: { search: 'budget' } });

    await articleController.getAllArticles(req, res);

    expect(Article.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          expect.objectContaining({ title: expect.any(Object) }),
          expect.objectContaining({ summary: expect.any(Object) })
        ])
      })
    );
  });

  it('should respect pagination limit and page', async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    };
    Article.find.mockReturnValue(mockQuery);
    Article.countDocuments.mockResolvedValue(100);

    const { req, res } = buildMocks({ query: { page: '2', limit: '20' } });

    await articleController.getAllArticles(req, res);

    expect(mockQuery.skip).toHaveBeenCalledWith(20); // (2-1) * 20
    expect(mockQuery.limit).toHaveBeenCalledWith(20);
  });

  it('should add isRead flag and user points to article response', async () => {
    const completion = { user: mockUserId, pointsEarned: 15, completedAt: new Date() };
    const article = mockArticle();
    article.completions = [completion];
    article.toObject = () => ({
      ...article,
      completions: [{ ...completion, user: mockUserId }]
    });

    Article.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([article]),
    });
    Article.countDocuments.mockResolvedValue(1);

    const { req, res } = buildMocks({ query: {} });

    await articleController.getAllArticles(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data[0]).toHaveProperty('isRead');
  });
});

// ── getArticleById ─────────────────────────────────────────────────
describe('Article Controller - getArticleById', () => {
  it('should return 200 with article for published article', async () => {
    const article = mockArticle({ isPublished: true });
    article.toObject = () => ({ ...article, completions: [] });
    Article.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(article) });

    const { req, res } = buildMocks({ params: { id: mockArticleId.toString() } });

    await articleController.getArticleById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 404 when article not found', async () => {
    Article.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    const { req, res } = buildMocks({ params: { id: 'badid' } });

    await articleController.getArticleById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 404 when non-admin tries to access unpublished article', async () => {
    const article = mockArticle({ isPublished: false });
    Article.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(article) });

    const { req, res } = buildMocks({
      params: { id: mockArticleId.toString() },
      user: { _id: mockUserId, role: 'user' }
    });

    await articleController.getArticleById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 500 on error', async () => {
    Article.findById.mockReturnValue({
      populate: jest.fn().mockRejectedValue(new Error('DB error'))
    });

    const { req, res } = buildMocks({ params: { id: 'badid' } });

    await articleController.getArticleById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── updateArticle ─────────────────────────────────────────────────
describe('Article Controller - updateArticle', () => {
  it('should update article with new title and summary', async () => {
    const article = mockArticle();
    article.save = jest.fn().mockResolvedValue(article);

    Article.findByIdAndUpdate.mockResolvedValue(article);

    const { req, res } = buildMocks({
      params: { id: mockArticleId.toString() },
      body: { title: 'Updated Title', summary: 'Updated summary' }
    });

    await articleController.updateArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Article updated successfully'
    }));
  });

  it('should handle file upload for thumbnail during update', async () => {
    const article = mockArticle();
    article.save = jest.fn().mockResolvedValue(article);

    Article.findById.mockResolvedValue(article);

    uploadToCloudinary.mockResolvedValue({
      secure_url: 'https://example.com/thumbnail.jpg'
    });

    const { req, res } = buildMocks({
      params: { id: mockArticleId.toString() },
      body: { title: 'Updated', content: { type: 'doc' } },
      file: { buffer: Buffer.from('test') }
    });

    await articleController.updateArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should parse content string to JSON during update', async () => {
    const article = mockArticle();
    article.save = jest.fn().mockResolvedValue(article);

    Article.findById.mockResolvedValue(article);

    const { req, res } = buildMocks({
      params: { id: mockArticleId.toString() },
      body: {
        title: 'Test',
        content: JSON.stringify({ type: 'doc', content: [] })
      }
    });

    await articleController.updateArticle(req, res);

    expect(article.content).toEqual({ type: 'doc', content: [] });
  });

  it('should convert isPublished string to boolean', async () => {
    const article = mockArticle();
    article.save = jest.fn().mockResolvedValue(article);

    Article.findById.mockResolvedValue(article);

    const { req, res } = buildMocks({
      params: { id: mockArticleId.toString() },
      body: { isPublished: 'true', content: { type: 'doc' } }
    });

    await articleController.updateArticle(req, res);

    expect(article.isPublished).toBe(true);
  });

  it('should return 404 when article not found', async () => {
    Article.findById.mockResolvedValue(null);

    const { req, res } = buildMocks({
      params: { id: 'nonexistent' },
      body: { title: 'Updated', content: { type: 'doc' } }
    });

    await articleController.updateArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Article not found'
    }));
  });

  it('should return 404 when article not found in findByIdAndUpdate', async () => {
    Article.findByIdAndUpdate.mockResolvedValue(null);

    const { req, res } = buildMocks({
      params: { id: mockArticleId.toString() },
      body: { title: 'Updated' }
    });

    await articleController.updateArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 500 on error', async () => {
    Article.findById.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({
      params: { id: mockArticleId.toString() },
      body: { title: 'Updated', content: { type: 'doc' } }
    });

    await articleController.updateArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── deleteArticle ──────────────────────────────────────────────────
describe('Article Controller - deleteArticle', () => {
  it('should return 200 on successful deletion', async () => {
    Article.findByIdAndDelete.mockResolvedValue(mockArticle());

    const { req, res } = buildMocks({ params: { id: mockArticleId.toString() } });

    await articleController.deleteArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Article deleted successfully'
    }));
  });

  it('should return 404 when article not found', async () => {
    Article.findByIdAndDelete.mockResolvedValue(null);

    const { req, res } = buildMocks({ params: { id: 'nonexistentid' } });

    await articleController.deleteArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 500 on error', async () => {
    Article.findByIdAndDelete.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({ params: { id: 'badid' } });

    await articleController.deleteArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── completeArticle ───────────────────────────────────────────────
describe('Article Controller - completeArticle', () => {
  it('should complete article and award points', async () => {
    const article = mockArticle({ readTime: 5, pointsPerRead: 15 });
    article.completions = [];
    article.save = jest.fn().mockResolvedValue(article);

    Article.findById.mockResolvedValue(article);
    Article.countDocuments.mockResolvedValue(1);

    const { req, res } = buildMocks({
      body: {
        articleId: mockArticleId.toString(),
        timeSpentSeconds: 300 // 5 minutes * 60 = 300s (meets 60% threshold)
      }
    });

    const awardActionBadge = jest.fn().mockResolvedValue(null);
    const processXPEvent = jest.fn().mockResolvedValue({
      xpResult: { leveledUp: false, newLevel: 1 },
      newlyEarnedBadges: []
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ pointsEarned: 15 })
    }));
  });

  it('should reject if article not found', async () => {
    Article.findById.mockResolvedValue(null);

    const { req, res } = buildMocks({
      body: { articleId: 'nonexistent', timeSpentSeconds: 300 }
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Article not found'
    }));
  });

  it('should reject if article is not published', async () => {
    const article = mockArticle({ isPublished: false });
    Article.findById.mockResolvedValue(article);

    const { req, res } = buildMocks({
      body: { articleId: mockArticleId.toString(), timeSpentSeconds: 300 }
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should reject duplicate completion', async () => {
    const article = mockArticle({ readTime: 5 });
    article.completions = [
      { user: mockUserId, pointsEarned: 15, timeSpentSeconds: 300 }
    ];

    Article.findById.mockResolvedValue(article);

    const { req, res } = buildMocks({
      body: { articleId: mockArticleId.toString(), timeSpentSeconds: 300 }
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'You have already earned points for this article'
    }));
  });

  it('should reject if user spends too little time (anti-gaming)', async () => {
    const article = mockArticle({ readTime: 10, pointsPerRead: 15 });
    article.completions = [];

    Article.findById.mockResolvedValue(article);

    const { req, res } = buildMocks({
      body: {
        articleId: mockArticleId.toString(),
        timeSpentSeconds: 60 // Only 1 minute, needs 6 min (10 * 60 * 0.6)
      }
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Reading too fast')
    }));
  });

  it('should award badge when user completes 5 articles', async () => {
    const article = mockArticle({ readTime: 5, pointsPerRead: 15 });
    article.completions = [];
    article.save = jest.fn().mockResolvedValue(article);

    Article.findById.mockResolvedValue(article);
    Article.countDocuments.mockResolvedValue(5); // User just completed their 5th

    const { req, res } = buildMocks({
      body: { articleId: mockArticleId.toString(), timeSpentSeconds: 300 }
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data).toHaveProperty('newlyEarnedBadges');
  });

  it('should include XP and badge data in response', async () => {
    const article = mockArticle({ readTime: 5, pointsPerRead: 15 });
    article.completions = [];
    article.save = jest.fn().mockResolvedValue(article);

    Article.findById.mockResolvedValue(article);
    Article.countDocuments.mockResolvedValue(2);

    const { req, res } = buildMocks({
      body: { articleId: mockArticleId.toString(), timeSpentSeconds: 300 }
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data).toHaveProperty('leveledUp');
    expect(jsonArg.data).toHaveProperty('level');
    expect(jsonArg.data).toHaveProperty('newlyEarnedBadges');
  });

  it('should return 500 on error', async () => {
    Article.findById.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({
      body: { articleId: mockArticleId.toString(), timeSpentSeconds: 300 }
    });

    await articleController.completeArticle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── getUserReadPoints ──────────────────────────────────────────────
describe('Article Controller - getUserReadPoints', () => {
  it('should return 200 with total points and completed article IDs', async () => {
    const completedArticle = mockArticle();
    completedArticle.completions = [{ user: mockUserId, pointsEarned: 15 }];
    completedArticle.completions[0].user = { toString: () => mockUserId.toString() };

    Article.find.mockResolvedValue([completedArticle]);

    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await articleController.getUserReadPoints(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data).toHaveProperty('totalPoints');
    expect(jsonArg.data).toHaveProperty('completedArticleIds');
  });

  it('should return 0 points when user has not read anything', async () => {
    Article.find.mockResolvedValue([]);

    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await articleController.getUserReadPoints(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.totalPoints).toBe(0);
  });

  it('should return 500 on error', async () => {
    Article.find.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await articleController.getUserReadPoints(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});