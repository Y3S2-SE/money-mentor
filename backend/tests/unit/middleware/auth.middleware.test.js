import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../models/user.model.js', () => ({
  default: {
    findById: jest.fn(),
  }
}));

const jwt = (await import('jsonwebtoken')).default;
const User = (await import('../../../models/user.model.js')).default;
const { protect, authorize } = await import('../../../middleware/auth.middleware.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ headers = {}, user = null } = {}) => ({
  req: { headers, user },
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
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


// ── protect ────────────────────────────────────────────────────────
describe('Auth Middleware - protect', () => {
  it('accepts a verified JWT with a matching tokenVersion', async () => {
    const user = mockUserDoc();
    const select = jest.fn().mockResolvedValue(user);
    jwt.verify.mockReturnValue({ id: mockUserId.toString(), tokenVersion: 0 });
    User.findById.mockReturnValue({ select });

    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer valid-token' }
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
    expect(select).toHaveBeenCalledWith('-password +tokenVersion');
    expect(req.user).toEqual(user);
  });

  it('accepts a legacy database user with no stored tokenVersion', async () => {
    const user = mockUserDoc({ tokenVersion: undefined });
    jwt.verify.mockReturnValue({ id: mockUserId.toString(), tokenVersion: 0 });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer version-zero-token' }
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a revoked tokenVersion', async () => {
    jwt.verify.mockReturnValue({ id: mockUserId.toString(), tokenVersion: 2 });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserDoc({ tokenVersion: 3 }))
    });
    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer old-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'AUTH_SESSION_INVALID',
      message: 'Session is no longer valid'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', undefined],
    ['string', '0'],
    ['fractional', 0.5]
  ])('rejects a %s tokenVersion claim', async (_, tokenVersion) => {
    jwt.verify.mockReturnValue({ id: mockUserId.toString(), tokenVersion });
    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer malformed-claim-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'AUTH_SESSION_INVALID',
      message: 'Session is no longer valid'
    }));
    expect(User.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when no token is provided', async () => {
    const { req, res, next } = buildMocks({ headers: {} });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'AUTH_SESSION_INVALID',
      message: 'Not authorized, no token provided'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const error = new Error('invalid signature');
    error.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => { throw error; });

    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer bad-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'AUTH_SESSION_INVALID',
      message: 'Invalid token'
    }));
  });

  it('should return 401 when token is expired', async () => {
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw error; });

    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer expired-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'AUTH_SESSION_INVALID',
      message: 'Token Expired'
    }));
  });

  it('returns a session-invalid code for a not-yet-valid token', async () => {
    const error = new Error('jwt not active');
    error.name = 'NotBeforeError';
    jwt.verify.mockImplementation(() => { throw error; });
    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer future-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'AUTH_SESSION_INVALID',
      message: 'Invalid token'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not found in DB', async () => {
    jwt.verify.mockReturnValue({ id: mockUserId.toString(), tokenVersion: 0 });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer valid-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'AUTH_SESSION_INVALID',
      message: 'User not found'
    }));
  });

  it('should return 403 when user account is deactivated', async () => {
    const user = mockUserDoc({ isActive: false });
    jwt.verify.mockReturnValue({ id: mockUserId.toString(), tokenVersion: 0 });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer valid-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('code');
  });

  it('should return 500 on unexpected error', async () => {
    jwt.verify.mockReturnValue({ id: mockUserId.toString(), tokenVersion: 0 });
    User.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('DB error'))
    });

    const { req, res, next } = buildMocks({
      headers: { authorization: 'Bearer valid-token' }
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── authorize ──────────────────────────────────────────────────────
describe('Auth Middleware - authorize', () => {
  it('should call next() when user has required role', () => {
    const middleware = authorize('admin');
    const { req, res, next } = buildMocks({ user: { role: 'admin' } });
    req.user = { role: 'admin' };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 403 when user lacks required role', () => {
    const middleware = authorize('admin');
    const req = { user: { role: 'user' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access when user role is in the allowed list', () => {
    const middleware = authorize('admin', 'moderator');
    const req = { user: { role: 'moderator' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
