import * as transactionService from "../services/transaction.service.js";

// POST /api/transactions
export const createTransaction = async (req, res) => {
  try {
    const transaction = await transactionService.createTransaction(
      req.user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

// GET /api/transactions
export const getTransactions = async (req, res) => {
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
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
};

// GET /api/transactions/:id
export const getTransactionById = async (req, res) => {
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
    const isNotFound = error.message === "Transaction not found";
    return res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/transactions/:id
export const updateTransaction = async (req, res) => {
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
    const isNotFound = error.message === "Transaction not found";
    return res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    await transactionService.deleteTransaction(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    const isNotFound = error.message === "Transaction not found";
    return res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};