import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateGetTransactions,
  validateMongoId,
} from "../validations/transaction.validation.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// POST /api/transactions
router.post(
  "/",
  validateCreateTransaction,
  validate,
  transactionController.createTransaction
);

// GET /api/transactions
router.get(
  "/",
  validateGetTransactions,
  validate,
  transactionController.getTransactions
);

// GET /api/transactions/:id
router.get(
  "/:id",
  validateMongoId,
  validate,
  transactionController.getTransactionById
);

// PUT /api/transactions/:id
router.put(
  "/:id",
  validateUpdateTransaction,
  validate,
  transactionController.updateTransaction
);

// DELETE /api/transactions/:id
router.delete(
  "/:id",
  validateMongoId,
  validate,
  transactionController.deleteTransaction
);

export default router;