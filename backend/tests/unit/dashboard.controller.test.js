import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../services/dashboard.service.js', () => ({
  getSummary:            jest.fn(),
  getCategoryBreakdown:  jest.fn(),
  getMonthlyTrends:      jest.fn(),
  getFinancialInsight:   jest.fn(),
  getRecentTransactions: jest.fn(),
  convertCurrency:       jest.fn(),
}));

const dashboardService    = await import('../../services/dashboard.service.js');
const dashboardController = await import('../../controllers/dashboard.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ query = {}, user = { _id: mockUserId } } = {}) => ({
  req: { user, query },
  res: {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  },
  next: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});


// getSummary
describe('Dashboard Controller - getSummary', () => {
  const mockSummary = {
    period: '2024-01',
    totalIncome: 5000,
    totalExpense: 3000,
    netSavings: 2000,
    savingsRate: 40,
    financialHealthScore: 60,
    spendingWarning: null,
  };

  it('should return 200 with summary data on success', async () => {
    dashboardService.getSummary.mockResolvedValue(mockSummary);
    const { req, res, next } = buildMocks({ query: { month: '2024-01' } });

    await dashboardController.getSummary(req, res, next);

    expect(dashboardService.getSummary).toHaveBeenCalledWith(mockUserId, { month: '2024-01' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: mockSummary,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should work with no query params', async () => {
    dashboardService.getSummary.mockResolvedValue(mockSummary);
    const { req, res, next } = buildMocks({ query: {} });

    await dashboardController.getSummary(req, res, next);

    expect(dashboardService.getSummary).toHaveBeenCalledWith(mockUserId, {});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return a spendingWarning when expenses exceed income', async () => {
    const warningSummary = {
      ...mockSummary,
      totalIncome: 2000,
      totalExpense: 3000,
      netSavings: -1000,
      spendingWarning: 'Your expenses exceeded your income this month. Try to cut back on non-essential spending.',
    };
    dashboardService.getSummary.mockResolvedValue(warningSummary);
    const { req, res, next } = buildMocks();

    await dashboardController.getSummary(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ spendingWarning: expect.any(String) }),
      })
    );
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('DB error');
    dashboardService.getSummary.mockRejectedValue(error);
    const { req, res, next } = buildMocks();

    await dashboardController.getSummary(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});


// getCategoryBreakdown
describe('Dashboard Controller - getCategoryBreakdown', () => {
  const mockBreakdown = {
    period: '2024-01',
    type: 'expense',
    breakdown: [
      { category: 'Food',      total: 1500, count: 10, percentage: 50 },
      { category: 'Transport', total: 1500, count: 5,  percentage: 50 },
    ],
  };

  it('should return 200 with breakdown data on success', async () => {
    dashboardService.getCategoryBreakdown.mockResolvedValue(mockBreakdown);
    const { req, res, next } = buildMocks({ query: { month: '2024-01', type: 'expense' } });

    await dashboardController.getCategoryBreakdown(req, res, next);

    expect(dashboardService.getCategoryBreakdown).toHaveBeenCalledWith(mockUserId, {
      month: '2024-01',
      type: 'expense',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Category breakdown retrieved successfully',
      data: mockBreakdown,
    });
  });

  it('should return breakdown for income type', async () => {
    const incomeBreakdown = { ...mockBreakdown, type: 'income' };
    dashboardService.getCategoryBreakdown.mockResolvedValue(incomeBreakdown);
    const { req, res, next } = buildMocks({ query: { type: 'income' } });

    await dashboardController.getCategoryBreakdown(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'income' }) })
    );
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('Aggregation failed');
    dashboardService.getCategoryBreakdown.mockRejectedValue(error);
    const { req, res, next } = buildMocks();

    await dashboardController.getCategoryBreakdown(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


// getMonthlyTrends
describe('Dashboard Controller - getMonthlyTrends', () => {
  const mockTrends = [
    { month: '2023-08', income: 4000, expense: 2500, savings: 1500 },
    { month: '2023-09', income: 4500, expense: 3000, savings: 1500 },
    { month: '2023-10', income: 5000, expense: 3500, savings: 1500 },
  ];

  it('should return 200 with trends data on success', async () => {
    dashboardService.getMonthlyTrends.mockResolvedValue(mockTrends);
    const { req, res, next } = buildMocks();

    await dashboardController.getMonthlyTrends(req, res, next);

    expect(dashboardService.getMonthlyTrends).toHaveBeenCalledWith(mockUserId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Monthly trends retrieved successfully',
      data: mockTrends,
    });
  });

  it('should return empty array when no trend data exists', async () => {
    dashboardService.getMonthlyTrends.mockResolvedValue([]);
    const { req, res, next } = buildMocks();

    await dashboardController.getMonthlyTrends(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('Trends query failed');
    dashboardService.getMonthlyTrends.mockRejectedValue(error);
    const { req, res, next } = buildMocks();

    await dashboardController.getMonthlyTrends(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


// getFinancialInsight
describe('Dashboard Controller - getFinancialInsight', () => {
  const mockInsight = {
    period: '2024-01',
    summary: { totalIncome: 5000, totalExpense: 3000, netSavings: 2000 },
    insight: 'Great job saving 40% of your income this month! Keep it up!',
  };

  it('should return 200 with insight data on success', async () => {
    dashboardService.getFinancialInsight.mockResolvedValue(mockInsight);
    const { req, res, next } = buildMocks({ query: { month: '2024-01' } });

    await dashboardController.getFinancialInsight(req, res, next);

    expect(dashboardService.getFinancialInsight).toHaveBeenCalledWith(mockUserId, { month: '2024-01' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Financial insight retrieved successfully',
      data: mockInsight,
    });
  });

  it('should include both summary and insight text in response data', async () => {
    dashboardService.getFinancialInsight.mockResolvedValue(mockInsight);
    const { req, res, next } = buildMocks();

    await dashboardController.getFinancialInsight(req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data).toHaveProperty('summary');
    expect(jsonCall.data).toHaveProperty('insight');
  });

  it('should call next with error when Gemini API fails', async () => {
    const error = new Error('Gemini API error');
    dashboardService.getFinancialInsight.mockRejectedValue(error);
    const { req, res, next } = buildMocks();

    await dashboardController.getFinancialInsight(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


// getRecentTransactions
describe('Dashboard Controller - getRecentTransactions', () => {
  const mockTransactions = [
    { _id: new mongoose.Types.ObjectId(), amount: 500,  type: 'expense', category: 'Food',   date: new Date('2024-01-10') },
    { _id: new mongoose.Types.ObjectId(), amount: 5000, type: 'income',  category: 'Salary', date: new Date('2024-01-01') },
  ];

  it('should return 200 with recent transactions on success', async () => {
    dashboardService.getRecentTransactions.mockResolvedValue(mockTransactions);
    const { req, res, next } = buildMocks();

    await dashboardController.getRecentTransactions(req, res, next);

    expect(dashboardService.getRecentTransactions).toHaveBeenCalledWith(mockUserId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Recent transactions retrieved successfully',
      data: mockTransactions,
    });
  });

  it('should return empty array when user has no transactions', async () => {
    dashboardService.getRecentTransactions.mockResolvedValue([]);
    const { req, res, next } = buildMocks();

    await dashboardController.getRecentTransactions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  it('should return at most 5 transactions', async () => {
    const fiveTransactions = Array.from({ length: 5 }, (_, i) => ({
      _id: new mongoose.Types.ObjectId(),
      amount: 100 * (i + 1),
      type: 'expense',
      category: 'Food',
      date: new Date(),
    }));
    dashboardService.getRecentTransactions.mockResolvedValue(fiveTransactions);
    const { req, res, next } = buildMocks();

    await dashboardController.getRecentTransactions(req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.length).toBeLessThanOrEqual(5);
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('DB query failed');
    dashboardService.getRecentTransactions.mockRejectedValue(error);
    const { req, res, next } = buildMocks();

    await dashboardController.getRecentTransactions(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


// convertCurrency
describe('Dashboard Controller - convertCurrency', () => {
  const mockResult = {
    amount: 10000,
    from: 'LKR',
    to: 'USD',
    convertedAmount: 33.44,
    rate: 0.003344,
    date: '2024-01-15',
  };

  it('should return 200 using LKR→USD defaults when from/to are omitted', async () => {
    dashboardService.convertCurrency.mockResolvedValue(mockResult);
    const { req, res, next } = buildMocks({ query: { amount: '10000' } });

    await dashboardController.convertCurrency(req, res, next);

    expect(dashboardService.convertCurrency).toHaveBeenCalledWith('10000', 'LKR', 'USD');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Currency converted successfully',
      data: mockResult,
    });
  });

  it('should use custom from and to currencies when provided', async () => {
    const eurResult = { ...mockResult, from: 'EUR', to: 'GBP', convertedAmount: 430.5 };
    dashboardService.convertCurrency.mockResolvedValue(eurResult);
    const { req, res, next } = buildMocks({ query: { amount: '500', from: 'EUR', to: 'GBP' } });

    await dashboardController.convertCurrency(req, res, next);

    expect(dashboardService.convertCurrency).toHaveBeenCalledWith('500', 'EUR', 'GBP');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should call next with error when currency is unsupported', async () => {
    const error = new Error("Currency 'XYZ' is not supported");
    dashboardService.convertCurrency.mockRejectedValue(error);
    const { req, res, next } = buildMocks({ query: { amount: '100', from: 'LKR', to: 'XYZ' } });

    await dashboardController.convertCurrency(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call next with error when external API is unavailable', async () => {
    const error = new Error('Currency conversion failed: Service Unavailable');
    dashboardService.convertCurrency.mockRejectedValue(error);
    const { req, res, next } = buildMocks({ query: { amount: '100' } });

    await dashboardController.convertCurrency(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should pass the amount as a string directly from query', async () => {
    dashboardService.convertCurrency.mockResolvedValue(mockResult);
    const { req, res, next } = buildMocks({ query: { amount: '9999.99' } });

    await dashboardController.convertCurrency(req, res, next);

    expect(dashboardService.convertCurrency).toHaveBeenCalledWith('9999.99', 'LKR', 'USD');
  });
});