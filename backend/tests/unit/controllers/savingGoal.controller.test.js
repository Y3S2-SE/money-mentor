import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../services/savingsGoal.service.js', () => ({
  createSavingsGoal: jest.fn(),
  getSavingsGoal: jest.fn(),
  updateSavingsGoal: jest.fn(),
  getSavingsGoalProgress: jest.fn(),
}));

jest.unstable_mockModule('../../../utils/gamificationEngine.js', () => ({
  awardActionBadge: jest.fn().mockResolvedValue(null),
}));

const savingsGoalService = await import('../../../services/savingsGoal.service.js');
const savingsGoalController = await import('../../../controllers/savingsGoal.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, query = {}, user = { _id: mockUserId } } = {}) => ({
  req: { body, query, user },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
  next: jest.fn(),
});

const mockGoal = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  userId: mockUserId,
  monthlyGoal: 5000,
  month: '2024-01',
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


// ── createSavingsGoal ──────────────────────────────────────────────
describe('SavingsGoal Controller - createSavingsGoal', () => {
  it('should return 201 on successful creation', async () => {
    const goal = mockGoal();
    savingsGoalService.createSavingsGoal.mockResolvedValue(goal);

    const { req, res, next } = buildMocks({ body: { monthlyGoal: 5000, month: '2024-01' } });

    await savingsGoalController.createSavingsGoal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Savings goal created successfully',
      data: goal,
    }));
  });

  it('should set 409 status and call next when goal already exists', async () => {
    const error = new Error('A savings goal already exists for this month');
    savingsGoalService.createSavingsGoal.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ body: { monthlyGoal: 5000 } });

    await savingsGoalController.createSavingsGoal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next with error on unexpected failure', async () => {
    const error = new Error('Unexpected error');
    savingsGoalService.createSavingsGoal.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ body: {} });

    await savingsGoalController.createSavingsGoal(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should try to award first_saving_goal badge on creation', async () => {
    const { awardActionBadge } = await import('../../../utils/gamificationEngine.js');
    savingsGoalService.createSavingsGoal.mockResolvedValue(mockGoal());

    const { req, res, next } = buildMocks({ body: { monthlyGoal: 5000 } });

    await savingsGoalController.createSavingsGoal(req, res, next);

    expect(awardActionBadge).toHaveBeenCalledWith(mockUserId, 'first_saving_goal');
  });
});


// ── getSavingsGoal ─────────────────────────────────────────────────
describe('SavingsGoal Controller - getSavingsGoal', () => {
  it('should return 200 with the goal', async () => {
    const goal = mockGoal();
    savingsGoalService.getSavingsGoal.mockResolvedValue(goal);

    const { req, res, next } = buildMocks({ query: { month: '2024-01' } });

    await savingsGoalController.getSavingsGoal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: goal }));
  });

  it('should set 404 and call next when goal not found', async () => {
    const error = new Error('No savings goal found for this month');
    savingsGoalService.getSavingsGoal.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ query: {} });

    await savingsGoalController.getSavingsGoal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(error);
  });
});


// ── updateSavingsGoal ──────────────────────────────────────────────
describe('SavingsGoal Controller - updateSavingsGoal', () => {
  it('should return 200 on successful update', async () => {
    const updated = mockGoal({ monthlyGoal: 8000 });
    savingsGoalService.updateSavingsGoal.mockResolvedValue(updated);

    const { req, res, next } = buildMocks({ body: { monthlyGoal: 8000 } });

    await savingsGoalController.updateSavingsGoal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: updated }));
  });

  it('should set 404 and call next when goal not found', async () => {
    const error = new Error('No savings goal found for this month. Use POST to create one.');
    savingsGoalService.updateSavingsGoal.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ body: { monthlyGoal: 8000 } });

    await savingsGoalController.updateSavingsGoal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(error);
  });
});


// ── getSavingsGoalProgress ─────────────────────────────────────────
describe('SavingsGoal Controller - getSavingsGoalProgress', () => {
  it('should return 200 with progress data', async () => {
    const progress = {
      month: '2024-01',
      goal: 5000,
      saved: 3000,
      percentage: 60,
      remaining: 2000,
      achieved: false,
      warning: null,
    };
    savingsGoalService.getSavingsGoalProgress.mockResolvedValue(progress);

    const { req, res, next } = buildMocks({ query: { month: '2024-01' } });

    await savingsGoalController.getSavingsGoalProgress(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: progress }));
  });

  it('should return achieved true when savings meets goal', async () => {
    const progress = {
      month: '2024-01',
      goal: 5000,
      saved: 5500,
      percentage: 100,
      remaining: 0,
      achieved: true,
      warning: 'Congratulations! You have achieved your savings goal this month!',
    };
    savingsGoalService.getSavingsGoalProgress.mockResolvedValue(progress);

    const { req, res, next } = buildMocks({ query: {} });

    await savingsGoalController.getSavingsGoalProgress(req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.achieved).toBe(true);
  });

  it('should set 404 and call next when no goal set', async () => {
    const error = new Error('No savings goal set for this month');
    savingsGoalService.getSavingsGoalProgress.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ query: {} });

    await savingsGoalController.getSavingsGoalProgress(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(error);
  });
});