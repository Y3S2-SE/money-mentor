import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/gamification.model.js', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../utils/gamificationEngine.js', () => ({
  syncBadgesForUser: jest.fn(),
  processDailyLogin: jest.fn(),
  processXPEvent: jest.fn(),
  awardActionBadge: jest.fn(),
  XP_REWARDS: { 'transaction': 10, 'article': 20 }
}));

jest.unstable_mockModule('../../../models/group.model.js', () => ({
  default: {
    find: jest.fn()
  }
}));

jest.unstable_mockModule('../../../models/badge.model.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  }
}));

const GamificationProfile = await import('../../../models/gamification.model.js');
const BadgeDefinition = await import('../../../models/badge.model.js');
const { syncBadgesForUser, processDailyLogin, processXPEvent, XP_REWARDS } = await import('../../../utils/gamificationEngine.js');
const Group = await import('../../../models/group.model.js');
const {
  getMyProfile,
  dailyLogin,
  awardXP,
  getLeaderboard,
  getAllBadges,
  getXPHistory,
  getAdminStats,
} = await import('../../../controllers/gamification.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

// ── FIXED: buildMocks now includes body so awardXP tests work ──────
const buildMocks = ({ query = {}, body = {}, user = { _id: mockUserId } } = {}) => ({
  req: { user, query, body },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// ── getMyProfile ───────────────────────────────────────────────────
describe('Gamification Controller - getMyProfile', () => {
  it('should return existing gamification profile', async () => {
    const mockProfile = {
      _id: new mongoose.Types.ObjectId(),
      user: mockUserId,
      totalXP: 150,
      level: 2,
      earnedBadges: [],
      toJSON: jest.fn().mockReturnValue({
        totalXP: 150,
        level: 2,
        earnedBadges: []
      })
    };

    const mockPopulateQuery = {
      populate: jest.fn().mockResolvedValue(mockProfile)
    };

    GamificationProfile.default.findOne.mockReturnValue(mockPopulateQuery);
    const { req, res } = buildMocks();

    await getMyProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Object)
    }));
  });

  it('should create profile if not exists', async () => {
    const newProfile = {
      _id: new mongoose.Types.ObjectId(),
      user: mockUserId,
      totalXP: 0,
      level: 1,
      earnedBadges: [],
      toJSON: jest.fn().mockReturnValue({
        totalXP: 0,
        level: 1,
        earnedBadges: []
      })
    };

    const mockPopulateQuery = {
      populate: jest.fn()
        .mockResolvedValueOnce(null)   // first findOne → null
        .mockResolvedValueOnce(newProfile) // second findOne after create
    };

    GamificationProfile.default.findOne.mockReturnValue(mockPopulateQuery);
    GamificationProfile.default.create.mockResolvedValue(newProfile);

    const { req, res } = buildMocks();

    await getMyProfile(req, res);

    expect(GamificationProfile.default.create).toHaveBeenCalledWith({ user: mockUserId });
  });

  it('should sync badges when sync=true', async () => {
    const mockProfile = {
      _id: new mongoose.Types.ObjectId(),
      user: mockUserId,
      earnedBadges: [],
      toJSON: jest.fn().mockReturnValue({})
    };

    const mockPopulateQuery = {
      populate: jest.fn().mockResolvedValue(mockProfile)
    };

    GamificationProfile.default.findOne.mockReturnValue(mockPopulateQuery);
    syncBadgesForUser.mockResolvedValue([{ key: 'badge1', name: 'First Badge', description: '', category: 'action', xpReward: 0 }]);

    const { req, res } = buildMocks({ query: { sync: 'true' } });

    await getMyProfile(req, res);

    expect(syncBadgesForUser).toHaveBeenCalledWith(mockUserId);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle sync error gracefully', async () => {
    const mockProfile = {
      _id: new mongoose.Types.ObjectId(),
      user: mockUserId,
      earnedBadges: [],
      toJSON: jest.fn().mockReturnValue({})
    };

    GamificationProfile.default.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProfile)
    });
    syncBadgesForUser.mockRejectedValue(new Error('Sync failed'));

    const { req, res } = buildMocks({ query: { sync: 'true' } });

    await getMyProfile(req, res);

    // Should still succeed (sync errors are caught)
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return newlyUnlocked badges after sync', async () => {
    const mockProfile = {
      _id: new mongoose.Types.ObjectId(),
      user: mockUserId,
      earnedBadges: [],
      toJSON: jest.fn().mockReturnValue({})
    };

    GamificationProfile.default.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProfile)
    });
    syncBadgesForUser.mockResolvedValue([
      { key: 'streak_7', name: '7-Day Streak', description: 'Login 7 days', category: 'streak', xpReward: 50 }
    ]);

    const { req, res } = buildMocks({ query: { sync: 'true' } });

    await getMyProfile(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.newlyUnlocked).toHaveLength(1);
    expect(jsonArg.newlyUnlocked[0].key).toBe('streak_7');
  });
});

// ── dailyLogin ────────────────────────────────────────────────────
describe('Gamification Controller - dailyLogin', () => {
  it('should process daily login successfully', async () => {
    const mockResult = {
      alreadyCheckedIn: false,
      currentStreak: 5
    };

    processDailyLogin.mockResolvedValue(mockResult);
    const { req, res } = buildMocks();

    await dailyLogin(req, res);

    expect(processDailyLogin).toHaveBeenCalledWith(mockUserId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Day 5 streak! Keep it up!'
    }));
  });

  it('should indicate already checked in', async () => {
    const mockResult = {
      alreadyCheckedIn: true,
      currentStreak: 3
    };

    processDailyLogin.mockResolvedValue(mockResult);
    const { req, res } = buildMocks();

    await dailyLogin(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Already checked in today'
    }));
  });

  it('should handle login failure (null result)', async () => {
    processDailyLogin.mockResolvedValue(null);
    const { req, res } = buildMocks();

    await dailyLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Failed to process daily login'
    }));
  });

  it('should handle service errors', async () => {
    processDailyLogin.mockRejectedValue(new Error('Service error'));
    const { req, res } = buildMocks();

    await dailyLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should include data in the response', async () => {
    const mockResult = {
      alreadyCheckedIn: false,
      currentStreak: 1,
      totalXP: 5,
      level: 1
    };

    processDailyLogin.mockResolvedValue(mockResult);
    const { req, res } = buildMocks();

    await dailyLogin(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data).toEqual(mockResult);
  });
});

// ── awardXP ───────────────────────────────────────────────────────
describe('Gamification Controller - awardXP', () => {
  it('should award XP successfully', async () => {
    const mockResult = {
      profile: { level: 2, levelProgress: 50, totalXP: 150, levelTitle: 'Novice' },
      xpResult: { leveledUp: false },
      newlyEarnedBadges: []
    };

    processXPEvent.mockResolvedValue(mockResult);
    const { req, res } = buildMocks({
      body: { source: 'transaction', amount: 10, description: 'Test' }
    });

    await awardXP(req, res);

    expect(processXPEvent).toHaveBeenCalledWith(mockUserId, 'transaction', 10, 'Test');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'XP awarded successfully'
    }));
  });

  it('should indicate level up', async () => {
    const mockResult = {
      profile: { level: 3, levelProgress: 0, totalXP: 200, levelTitle: 'Intermediate' },
      xpResult: { leveledUp: true },
      newlyEarnedBadges: []
    };

    processXPEvent.mockResolvedValue(mockResult);
    const { req, res } = buildMocks({
      body: { source: 'article', amount: 50, description: '' }
    });

    await awardXP(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Level up! You are now level 3'
    }));
  });

  it('should handle missing amount (uses null, falls back to XP_REWARDS)', async () => {
    const mockResult = {
      profile: { level: 1, totalXP: 10, levelProgress: 10, levelTitle: 'Beginner' },
      xpResult: { leveledUp: false },
      newlyEarnedBadges: []
    };

    processXPEvent.mockResolvedValue(mockResult);
    const { req, res } = buildMocks({
      body: { source: 'transaction' } // No amount
    });

    await awardXP(req, res);

    expect(processXPEvent).toHaveBeenCalledWith(mockUserId, 'transaction', null, '');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should use description from body', async () => {
    const mockResult = {
      profile: { level: 1, totalXP: 20, levelProgress: 20, levelTitle: 'Beginner' },
      xpResult: { leveledUp: false },
      newlyEarnedBadges: []
    };

    processXPEvent.mockResolvedValue(mockResult);
    const { req, res } = buildMocks({
      body: { source: 'transaction', amount: 20, description: 'Daily bonus' }
    });

    await awardXP(req, res);

    expect(processXPEvent).toHaveBeenCalledWith(mockUserId, 'transaction', 20, 'Daily bonus');
  });

  it('should include newly earned badges in response', async () => {
    const mockBadge = { key: 'first_login', name: 'First Login', description: 'Logged in', category: 'action' };
    const mockResult = {
      profile: { level: 1, totalXP: 5, levelProgress: 5, levelTitle: 'Beginner' },
      xpResult: { leveledUp: false },
      newlyEarnedBadges: [mockBadge]
    };

    processXPEvent.mockResolvedValue(mockResult);
    const { req, res } = buildMocks({
      body: { source: 'transaction', amount: 5 }
    });

    await awardXP(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.newlyEarnedBadges).toHaveLength(1);
    expect(jsonArg.data.newlyEarnedBadges[0].key).toBe('first_login');
  });

  it('should handle service errors', async () => {
    processXPEvent.mockRejectedValue(new Error('Service error'));
    const { req, res } = buildMocks({
      body: { source: 'transaction', amount: 10 }
    });

    await awardXP(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

// ── getLeaderboard ────────────────────────────────────────────────
describe('Gamification Controller - getLeaderboard', () => {
  it('should return 500 when Group.find throws', async () => {
    Group.default.find.mockImplementation(() => {
      throw new Error('DB error');
    });

    const { req, res } = buildMocks({ query: { limit: '10' } });

    await getLeaderboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should return 500 on DB error with no limit param', async () => {
    Group.default.find.mockImplementation(() => {
      throw new Error('DB error');
    });

    const { req, res } = buildMocks({ query: {} });

    await getLeaderboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return leaderboard data on success', async () => {
    const friendId = new mongoose.Types.ObjectId();
    const mockGroups = [
      { members: [mockUserId, friendId], admin: friendId }
    ];

    const mockLeaderboardEntry = {
      user: { _id: mockUserId, username: 'testuser' },
      totalXP: 200,
      level: 3,
      levelTitle: 'Budget Master',
      currentStreak: 5,
      earnedBadges: []
    };

    Group.default.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockGroups)
    });

    GamificationProfile.default.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([mockLeaderboardEntry])
    });

    GamificationProfile.default.findOne.mockResolvedValue({ totalXP: 200 });
    GamificationProfile.default.countDocuments.mockResolvedValue(2);

    const { req, res } = buildMocks({ query: { limit: '10' } });

    await getLeaderboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ── getAllBadges ──────────────────────────────────────────────────
describe('Gamification Controller - getAllBadges', () => {
  it('should return all active badges with earned status', async () => {
    const mockBadgeId = new mongoose.Types.ObjectId();
    const mockBadges = [
      {
        _id: mockBadgeId,
        key: 'first_login',
        name: 'First Login',
        description: 'Logged in for the first time',
        category: 'action',
        xpReward: 25,
        condition: { type: 'action', actionKey: 'first_login' }
      }
    ];

    const mockProfile = {
      earnedBadges: [{ badge: mockBadgeId, earnedAt: new Date() }]
    };

    BadgeDefinition.default.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockBadges)
    });
    GamificationProfile.default.findOne.mockResolvedValue(mockProfile);

    const { req, res } = buildMocks({ query: {} });

    await getAllBadges(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(true);
    expect(jsonArg.data).toHaveLength(1);
    expect(jsonArg.data[0].earned).toBe(true);
  });

  it('should filter badges by category', async () => {
    BadgeDefinition.default.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });
    GamificationProfile.default.findOne.mockResolvedValue(null);

    const { req, res } = buildMocks({ query: { category: 'streak' } });

    await getAllBadges(req, res);

    expect(BadgeDefinition.default.find).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'streak' })
    );
  });

  it('should mark badges as not earned when profile has no earned badges', async () => {
    const mockBadgeId = new mongoose.Types.ObjectId();
    const mockBadges = [{
      _id: mockBadgeId,
      key: 'streak_7',
      name: '7-Day Streak',
      description: 'Logged in 7 days',
      category: 'streak',
      xpReward: 20,
      condition: { type: 'streak_days', threshold: 7 }
    }];

    BadgeDefinition.default.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockBadges)
    });
    GamificationProfile.default.findOne.mockResolvedValue({ earnedBadges: [] });

    const { req, res } = buildMocks({ query: {} });

    await getAllBadges(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data[0].earned).toBe(false);
    expect(jsonArg.data[0].earnedAt).toBeNull();
  });

  it('should handle service errors', async () => {
    BadgeDefinition.default.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error('DB error'))
    });

    const { req, res } = buildMocks({ query: {} });

    await getAllBadges(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── getXPHistory ──────────────────────────────────────────────────
describe('Gamification Controller - getXPHistory', () => {
  it('should return XP history for user', async () => {
    const mockProfile = {
      xpHistory: [
        { source: 'daily_login', amount: 5, description: 'Login', earnedAt: new Date() },
        { source: 'read_article', amount: 15, description: 'Article', earnedAt: new Date() }
      ],
      totalXP: 20,
      level: 1,
      levelTitle: 'Money Newbie'
    };

    GamificationProfile.default.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProfile)
    });

    const { req, res } = buildMocks({ query: {} });

    await getXPHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.xpHistory).toHaveLength(2);
    expect(jsonArg.data.totalXP).toBe(20);
  });

  it('should return empty history when profile not found', async () => {
    GamificationProfile.default.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const { req, res } = buildMocks({ query: {} });

    await getXPHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.xpHistory).toEqual([]);
    expect(jsonArg.data.totalXP).toBe(0);
    expect(jsonArg.data.level).toBe(1);
  });

  it('should respect the limit query param', async () => {
    const history = Array.from({ length: 50 }, (_, i) => ({
      source: 'daily_login', amount: 5, description: `Login ${i}`, earnedAt: new Date()
    }));

    GamificationProfile.default.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        xpHistory: history, totalXP: 250, level: 3, levelTitle: 'Budget Master'
      })
    });

    const { req, res } = buildMocks({ query: { limit: '5' } });

    await getXPHistory(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.xpHistory.length).toBeLessThanOrEqual(5);
  });

  it('should handle service errors', async () => {
    GamificationProfile.default.findOne.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('DB error'))
    });

    const { req, res } = buildMocks({ query: {} });

    await getXPHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── getAdminStats ─────────────────────────────────────────────────
describe('Gamification Controller - getAdminStats', () => {
  it('should return platform-wide stats', async () => {
    GamificationProfile.default.countDocuments.mockResolvedValue(42);

    GamificationProfile.default.aggregate.mockResolvedValue([
      { avgXP: 150, totalXP: 6300 }
    ]);

    GamificationProfile.default.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue({
        user: { username: 'topuser' },
        totalXP: 5000,
        level: 50
      })
    });

    BadgeDefinition.default.countDocuments.mockResolvedValue(10);

    const { req, res } = buildMocks();

    await getAdminStats(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(true);
    expect(jsonArg.data).toHaveProperty('totalActiveProfiles');
    expect(jsonArg.data).toHaveProperty('averageXP');
    expect(jsonArg.data).toHaveProperty('totalXPAwarded');
  });

  it('should handle service errors', async () => {
    GamificationProfile.default.countDocuments.mockRejectedValueOnce(new Error('DB error'));

    GamificationProfile.default.aggregate.mockResolvedValue([]);

    GamificationProfile.default.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null)
    });

    BadgeDefinition.default.countDocuments.mockResolvedValue(0);

    const { req, res } = buildMocks();

    await getAdminStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});