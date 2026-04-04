import * as transactionService from "../services/transaction.service.js";
import { awardActionBadge } from "../utils/gamificationEngine.js";

// POST /api/transactions
export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(
      req.user.id,
      req.body
    );

    if (transaction.type === 'income') {
      try {
        const incomeCount = await transactionService.countTrasactionsByType(req.user.id, 'income');

        if (incomeCount === 1) {
          await awardActionBadge(req.user._id, 'first_investment');
        }
      } catch (badgeErr) {
        console.error('[Badge] first_investment award failed:', badgeErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions
export const getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(
      req.user.id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      data: transaction,
    });
  } catch (error) {
    if (error.message === "Transaction not found") {
      res.status(404);
    }
    next(error);
  }
};

// PUT /api/transactions/:id
export const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(
      req.params.id,
      req.user.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    if (error.message === "Transaction not found") {
      res.status(404);
    }
    next(error);
  }
};

// DELETE /api/transactions/:id
export const deleteTransaction = async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    if (error.message === "Transaction not found") {
      res.status(404);
    }
    next(error);
  }
};