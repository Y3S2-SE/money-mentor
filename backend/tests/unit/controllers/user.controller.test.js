import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/user.model.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  }
}));

const User = (await import('../../../models/user.model.js')).default;
const userController = await import('../../../controllers/user.controller.js');

const mockUserId = new mongoose.Types.ObjectId();
const mockAdminId = new mongoose.Types.ObjectId();

const buildMocks = ({ query = {}, params = {}, user = { _id: mockAdminId } } = {}) => ({
  req: { query, params, user },
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


// ── getAllUsers ────────────────────────────────────────────────────
describe('User Controller - getAllUsers', () => {
  it('should return 200 with list of users', async () => {
    const users = [mockUserDoc(), mockUserDoc({ username: 'user2' })];
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(users),
    });
    User.countDocuments.mockResolvedValue(2);

    const { req, res } = buildMocks({ query: {} });
    await userController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: users,
    }));
  });

  it('should return pagination metadata', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
    User.countDocuments.mockResolvedValue(25);

    const { req, res } = buildMocks({ query: { page: '2', limit: '10' } });
    await userController.getAllUsers(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toHaveProperty('pagination');
    expect(jsonArg.pagination.total).toBe(25);
  });

  it('should apply search filter when provided', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
    User.countDocuments.mockResolvedValue(0);

    const { req, res } = buildMocks({ query: { search: 'john' } });
    await userController.getAllUsers(req, res);

    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({ $or: expect.any(Array) })
    );
  });

  it('should return 500 on error', async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const { req, res } = buildMocks({ query: {} });
    await userController.getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── getUserByID ────────────────────────────────────────────────────
describe('User Controller - getUserByID', () => {
  it('should return 200 with user data', async () => {
    const user = mockUserDoc();
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const { req, res } = buildMocks({ params: { id: mockUserId.toString() } });
    await userController.getUserByID(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: user }));
  });

  it('should return 404 when user not found', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const { req, res } = buildMocks({ params: { id: 'nonexistentid' } });
    await userController.getUserByID(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'User not found'
    }));
  });

  it('should return 500 on unexpected error', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });

    const { req, res } = buildMocks({ params: { id: 'badid' } });
    await userController.getUserByID(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── deleteUser ─────────────────────────────────────────────────────
describe('User Controller - deleteUser', () => {
  it('should return 200 on successful deletion', async () => {
    const user = mockUserDoc();
    User.findById.mockResolvedValue(user);
    User.findByIdAndDelete.mockResolvedValue(user);

    const { req, res } = buildMocks({
      params: { id: mockUserId.toString() },
      user: { _id: mockAdminId }
    });
    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'User deleted successfully'
    }));
  });

  it('should return 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);

    const { req, res } = buildMocks({
      params: { id: 'nonexistentid' },
      user: { _id: mockAdminId }
    });
    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 when admin tries to delete themselves', async () => {
    const user = mockUserDoc({ _id: mockAdminId });
    User.findById.mockResolvedValue(user);

    const { req, res } = buildMocks({
      params: { id: mockAdminId.toString() },
      user: { _id: mockAdminId }
    });
    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Cannot delete your own account'
    }));
  });

  it('should return 500 on unexpected error', async () => {
    User.findById.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({
      params: { id: 'badid' },
      user: { _id: mockAdminId }
    });
    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});