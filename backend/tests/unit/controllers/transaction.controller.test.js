import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../services/transaction.service.js', () => ({
  createTransaction: jest.fn(),
  getTransactions: jest.fn(),
  getTransactionById: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  countTrasactionsByType: jest.fn(),
}));

jest.unstable_mockModule('../../../utils/gamificationEngine.js', () => ({
  awardActionBadge: jest.fn().mockResolvedValue(null),
}));

const transactionService = await import('../../../services/transaction.service.js');
const transactionController = await import('../../../controllers/transaction.controller.js');

const mockUserId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, params = {}, query = {}, user = { _id: mockUserId, id: mockUserId.toString() } } = {}) => ({
  req: { body, params, query, user },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
  next: jest.fn(),
});

const mockTransaction = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  userId: mockUserId,
  type: 'expense',
  amount: 500,
  category: 'Food',
  date: new Date(),
  description: '',
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


// ── createTransaction ──────────────────────────────────────────────
describe('Transaction Controller - createTransaction', () => {
  it('should return 201 on successful creation', async () => {
    const transaction = mockTransaction();
    transactionService.createTransaction.mockResolvedValue(transaction);

    const { req, res, next } = buildMocks({
      body: { type: 'expense', amount: 500, category: 'Food', date: new Date() }
    });

    await transactionController.createTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    }));
  });

  it('should award first_investment badge on first income transaction', async () => {
    const { awardActionBadge } = await import('../../../utils/gamificationEngine.js');
    const transaction = mockTransaction({ type: 'income' });
    transactionService.createTransaction.mockResolvedValue(transaction);
    transactionService.countTrasactionsByType.mockResolvedValue(1);

    const { req, res, next } = buildMocks({
      body: { type: 'income', amount: 5000, category: 'Salary', date: new Date() }
    });

    await transactionController.createTransaction(req, res, next);

    expect(awardActionBadge).toHaveBeenCalledWith(expect.anything(), 'first_investment');
  });

  it('should not award badge when income count is not 1', async () => {
    const { awardActionBadge } = await import('../../../utils/gamificationEngine.js');
    const transaction = mockTransaction({ type: 'income' });
    transactionService.createTransaction.mockResolvedValue(transaction);
    transactionService.countTrasactionsByType.mockResolvedValue(5);

    const { req, res, next } = buildMocks({
      body: { type: 'income', amount: 5000, category: 'Salary', date: new Date() }
    });

    await transactionController.createTransaction(req, res, next);

    expect(awardActionBadge).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('DB error');
    transactionService.createTransaction.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ body: {} });

    await transactionController.createTransaction(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


// ── getTransactions ────────────────────────────────────────────────
describe('Transaction Controller - getTransactions', () => {
  it('should return 200 with list of transactions', async () => {
    const transactions = [mockTransaction(), mockTransaction({ type: 'income', amount: 5000 })];
    transactionService.getTransactions.mockResolvedValue({
      transactions,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    });

    const { req, res, next } = buildMocks({ query: {} });

    await transactionController.getTransactions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: transactions,
    }));
  });

  it('should return empty list when no transactions exist', async () => {
    transactionService.getTransactions.mockResolvedValue({
      transactions: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
    });

    const { req, res, next } = buildMocks({ query: {} });

    await transactionController.getTransactions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });

  it('should pass query filters to service', async () => {
    transactionService.getTransactions.mockResolvedValue({ transactions: [], pagination: {} });

    const { req, res, next } = buildMocks({ query: { type: 'expense', month: '2024-01' } });

    await transactionController.getTransactions(req, res, next);

    expect(transactionService.getTransactions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'expense', month: '2024-01' })
    );
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('DB error');
    transactionService.getTransactions.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ query: {} });

    await transactionController.getTransactions(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


// ── getTransactionById ─────────────────────────────────────────────
describe('Transaction Controller - getTransactionById', () => {
  it('should return 200 with the transaction', async () => {
    const transaction = mockTransaction();
    transactionService.getTransactionById.mockResolvedValue(transaction);

    const { req, res, next } = buildMocks({ params: { id: transaction._id.toString() } });

    await transactionController.getTransactionById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: transaction }));
  });

  it('should set status 404 and call next when transaction not found', async () => {
    const error = new Error('Transaction not found');
    transactionService.getTransactionById.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ params: { id: 'nonexistentid' } });

    await transactionController.getTransactionById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next with error on unexpected failure', async () => {
    const error = new Error('Unexpected error');
    transactionService.getTransactionById.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ params: { id: 'someid' } });

    await transactionController.getTransactionById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


// ── updateTransaction ──────────────────────────────────────────────
describe('Transaction Controller - updateTransaction', () => {
  it('should return 200 on successful update', async () => {
    const updated = mockTransaction({ amount: 700 });
    transactionService.updateTransaction.mockResolvedValue(updated);

    const { req, res, next } = buildMocks({
      params: { id: updated._id.toString() },
      body: { amount: 700 }
    });

    await transactionController.updateTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: updated }));
  });

  it('should set status 404 and call next when not found', async () => {
    const error = new Error('Transaction not found');
    transactionService.updateTransaction.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ params: { id: 'badid' }, body: {} });

    await transactionController.updateTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(error);
  });
});


// ── deleteTransaction ──────────────────────────────────────────────
describe('Transaction Controller - deleteTransaction', () => {
  it('should return 200 on successful deletion', async () => {
    transactionService.deleteTransaction.mockResolvedValue(true);

    const { req, res, next } = buildMocks({ params: { id: 'someid' } });

    await transactionController.deleteTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Transaction deleted successfully'
    }));
  });

  it('should set status 404 and call next when not found', async () => {
    const error = new Error('Transaction not found');
    transactionService.deleteTransaction.mockRejectedValue(error);

    const { req, res, next } = buildMocks({ params: { id: 'badid' } });

    await transactionController.deleteTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(error);
  });
});