import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
const expectedJwtExpiry = () => process.env.JWT_EXPIRE || '15m';

// Mock dependencies
jest.unstable_mockModule('../../../models/user.model.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateOne: jest.fn(),
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
const jwt = (await import('jsonwebtoken')).default;
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
  tokenVersion: 0,
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
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUserId, tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: expectedJwtExpiry() }
    );
    expect(res.json.mock.calls[0][0].data.user).not.toHaveProperty('tokenVersion');
  });

  it('should use a 15m fallback when JWT_EXPIRE is unset', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUserDoc());
    const previousExpiry = process.env.JWT_EXPIRE;
    delete process.env.JWT_EXPIRE;

    try {
      const { req, res } = buildMocks({
        body: { username: 'testuser', email: 'test@example.com', password: 'Test123!' }
      });
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId, tokenVersion: 0 },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
    } finally {
      if (previousExpiry === undefined) delete process.env.JWT_EXPIRE;
      else process.env.JWT_EXPIRE = previousExpiry;
    }
  });

  it('should force the user role when controller validation is bypassed', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(mockUserDoc());

    const { req, res } = buildMocks({
      body: {
        username: 'attacker',
        email: 'attacker@example.com',
        password: 'Test123!',
        role: 'admin'
      }
    });

    await authController.register(req, res);

    expect(User.create).toHaveBeenCalledWith({
      username: 'attacker',
      email: 'attacker@example.com',
      password: 'Test123!',
      role: 'user'
    });
    expect(res.status).toHaveBeenCalledWith(201);
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
    const user = mockUserDoc({ tokenVersion: undefined, comparePassword: jest.fn().mockResolvedValue(true) });
    const select = jest.fn().mockResolvedValue(user);
    User.findOne.mockReturnValue({ select });

    const { req, res } = buildMocks({
      body: { email: 'test@example.com', password: 'Test123!' }
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(select).toHaveBeenCalledWith('+password +tokenVersion');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUserId, tokenVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: expectedJwtExpiry() }
    );
    expect(res.json.mock.calls[0][0].data.user).not.toHaveProperty('tokenVersion');
  });

  it('should sign with the stored tokenVersion', async () => {
    const user = mockUserDoc({ tokenVersion: 7, comparePassword: jest.fn().mockResolvedValue(true) });
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const { req, res } = buildMocks({
      body: { email: 'test@example.com', password: 'Test123!' }
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUserId, tokenVersion: 7 },
      process.env.JWT_SECRET,
      { expiresIn: expectedJwtExpiry() }
    );
    expect(res.json.mock.calls[0][0].data.user).not.toHaveProperty('tokenVersion');
  })

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
  it('should return 200 after saving the new password and version', async () => {
    const user = mockUserDoc({ tokenVersion: 4, comparePassword: jest.fn().mockResolvedValue(true) });
    let filterDuringSave;
    user.save.mockImplementation(async function () {
      filterDuringSave = this.$where;
    });
    const select = jest.fn().mockResolvedValue(user);
    User.findById.mockReturnValue({ select });

    const { req, res } = buildMocks({
      body: { currentPassword: 'OldPass!', newPassword: 'NewPass123!' },
      user: { _id: mockUserId }
    });

    await authController.changePassword(req, res);
    
    expect(select).toHaveBeenCalledWith('+password +tokenVersion');
    expect(user.comparePassword).toHaveBeenCalledWith('OldPass!');
    expect(user.password).toBe('NewPass123!');
    expect(user.tokenVersion).toBe(5);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(filterDuringSave).toEqual({ tokenVersion: 4 });
    expect(user).not.toHaveProperty('$where');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUserId, tokenVersion: 5 },
      process.env.JWT_SECRET,
      { expiresIn: expectedJwtExpiry() }
    );
    expect(user.save.mock.invocationCallOrder[0]).toBeLessThan(jwt.sign.mock.invocationCallOrder[0]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.user).not.toHaveProperty('tokenVersion');
  });

  it('does not sign a replacement token after a stale-version save conflict', async () => {
    const conflict = Object.assign(new Error('stale version'), { name: 'DocumentNotFoundError' });
    const user = mockUserDoc({
      tokenVersion: 4,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockRejectedValue(conflict)
    });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const { req, res } = buildMocks({
      body: { currentPassword: 'OldPass!', newPassword: 'NewPass123!' },
      user: { _id: mockUserId }
    });

    await authController.changePassword(req, res);

    expect(user.save).toHaveBeenCalledTimes(1);
    expect(user).not.toHaveProperty('$where');
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('data.token');
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
    expect(user.comparePassword).toHaveBeenCalledWith('WrongPass!');
    expect(user.save).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
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
  it('should atomically revoke tokens for the authenticated user', async () => {
    User.updateOne.mockResolvedValue({ matchedCount: 1 });
    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await authController.logout(req, res);

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: mockUserId, isActive: true },
      { $inc: { tokenVersion: 1 } }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Logout successfully'
    }));
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('does not report revocation when no active user matched', async () => {
    User.updateOne.mockResolvedValue({ matchedCount: 0 });
    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await authController.logout(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});