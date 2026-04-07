import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// Mock dependencies
jest.unstable_mockModule('../../../models/user.model.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../utils/gamificationEngine.js', () => ({
  processDailyLogin: jest.fn().mockResolvedValue({
    alreadyCheckedIn: false,
    xpAwarded: 5,
    currentStreak: 1,
    newlyEarnedBadges: []
  })
}));

const User = (await import('../../../models/user.model.js')).default;
const authController = await import('../../../controllers/auth.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, user = null, params = {} } = {}) => ({
  req: { body, user, params },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
  next: jest.fn(),
});

const mockUserDoc = (overrides = {}) => ({
  _id: mockUserId,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  lastLogin: null,
  password: 'hashedpassword',
  comparePassword: jest.fn(),
  toAuthJSON: jest.fn().mockReturnValue({
    id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
  }),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


// ── register ───────────────────────────────────────────────────────
describe('Auth Controller - register', () => {
  it('should return 201 with token on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    const user = mockUserDoc();
    User.create.mockResolvedValue(user);

    const { req, res } = buildMocks({
      body: { username: 'testuser', email: 'test@example.com', password: 'Test123!' }
    });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'User registered successfully',
    }));
  });

  it('should return 400 if email already registered', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', username: 'other' });

    const { req, res } = buildMocks({
      body: { username: 'newuser', email: 'test@example.com', password: 'Test123!' }
    });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should return 400 if username already taken', async () => {
    User.findOne.mockResolvedValue({ email: 'other@example.com', username: 'testuser' });

    const { req, res } = buildMocks({
      body: { username: 'testuser', email: 'new@example.com', password: 'Test123!' }
    });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Username already taken' })
    );
  });

  it('should return 500 on unexpected error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({
      body: { username: 'testuser', email: 'test@example.com', password: 'Test123!' }
    });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should include token in response data', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUserDoc());

    const { req, res } = buildMocks({
      body: { username: 'testuser', email: 'test@example.com', password: 'Test123!' }
    });

    await authController.register(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data).toHaveProperty('token');
  });
});


// ── login ──────────────────────────────────────────────────────────
describe('Auth Controller - login', () => {
  it('should return 200 with token on successful login', async () => {
    const user = mockUserDoc({ comparePassword: jest.fn().mockResolvedValue(true) });
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({
      body: { email: 'test@example.com', password: 'Test123!' }
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if user not found', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const { req, res } = buildMocks({
      body: { email: 'nobody@example.com', password: 'Test123!' }
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email or password' })
    );
  });

  it('should return 403 if account is inactive', async () => {
    const user = mockUserDoc({ isActive: false });
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({
      body: { email: 'test@example.com', password: 'Test123!' }
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 401 if password is incorrect', async () => {
    const user = mockUserDoc({ comparePassword: jest.fn().mockResolvedValue(false) });
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({
      body: { email: 'test@example.com', password: 'WrongPass!' }
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 500 on unexpected error', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });

    const { req, res } = buildMocks({
      body: { email: 'test@example.com', password: 'Test123!' }
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should include user data and token in response', async () => {
    const user = mockUserDoc({ comparePassword: jest.fn().mockResolvedValue(true) });
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({
      body: { email: 'test@example.com', password: 'Test123!' }
    });

    await authController.login(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data).toHaveProperty('token');
    expect(jsonArg.data).toHaveProperty('user');
  });
});


// ── getProfile ─────────────────────────────────────────────────────
describe('Auth Controller - getProfile', () => {
  it('should return 200 with user data', async () => {
    const user = mockUserDoc();
    User.findById.mockResolvedValue(user);

    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await authController.getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 500 on error', async () => {
    User.findById.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await authController.getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── updateProfile ──────────────────────────────────────────────────
describe('Auth Controller - updateProfile', () => {
  it('should return 200 on successful update', async () => {
    User.findOne.mockResolvedValue(null);
    const updatedUser = mockUserDoc({ username: 'newname' });
    User.findByIdAndUpdate.mockResolvedValue(updatedUser);

    const { req, res } = buildMocks({
      body: { username: 'newname' },
      user: { _id: mockUserId }
    });

    await authController.updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 if email already in use by another user', async () => {
    User.findOne.mockResolvedValue({ email: 'taken@example.com', username: 'other' });

    const { req, res } = buildMocks({
      body: { email: 'taken@example.com' },
      user: { _id: mockUserId }
    });

    await authController.updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if username already taken by another user', async () => {
    User.findOne.mockResolvedValue({ email: 'other@example.com', username: 'takenuser' });

    const { req, res } = buildMocks({
      body: { username: 'takenuser' },
      user: { _id: mockUserId }
    });

    await authController.updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Username already taken' })
    );
  });

  it('should return 500 on error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({
      body: { username: 'newname' },
      user: { _id: mockUserId }
    });

    await authController.updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── changePassword ─────────────────────────────────────────────────
describe('Auth Controller - changePassword', () => {
  it('should return 200 on successful password change', async () => {
    const user = mockUserDoc({ comparePassword: jest.fn().mockResolvedValue(true) });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({
      body: { currentPassword: 'OldPass!', newPassword: 'NewPass123!' },
      user: { _id: mockUserId }
    });

    await authController.changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Password changed successfully'
    }));
  });

  it('should return 401 if current password is incorrect', async () => {
    const user = mockUserDoc({ comparePassword: jest.fn().mockResolvedValue(false) });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({
      body: { currentPassword: 'WrongPass!', newPassword: 'NewPass123!' },
      user: { _id: mockUserId }
    });

    await authController.changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 500 on error', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });

    const { req, res } = buildMocks({
      body: { currentPassword: 'OldPass!', newPassword: 'NewPass123!' },
      user: { _id: mockUserId }
    });

    await authController.changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should include new token in response', async () => {
    const user = mockUserDoc({ comparePassword: jest.fn().mockResolvedValue(true) });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({
      body: { currentPassword: 'OldPass!', newPassword: 'NewPass123!' },
      user: { _id: mockUserId }
    });

    await authController.changePassword(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data).toHaveProperty('token');
  });
});


// ── logout ─────────────────────────────────────────────────────────
describe('Auth Controller - logout', () => {
  it('should return 200 on logout', async () => {
    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await authController.logout(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Logout successfully'
    }));
  });
});