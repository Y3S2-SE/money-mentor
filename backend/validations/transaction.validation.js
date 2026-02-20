import { body, query, param } from "express-validator";

export const validateCreateTransaction = [
  body("type")
    .notEmpty().withMessage("Type is required")
    .isIn(["income", "expense"]).withMessage("Type must be 'income' or 'expense'"),

  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),

  body("category")
    .notEmpty().withMessage("Category is required")
    .isString().withMessage("Category must be a string")
    .trim(),

  body("description")
    .optional()
    .isString().withMessage("Description must be a string")
    .trim(),

  body("date")
    .notEmpty().withMessage("Date is required")
    .isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)"),
];

export const validateUpdateTransaction = [
  param("id")
    .isMongoId().withMessage("Invalid transaction ID"),

  body("type")
    .optional()
    .isIn(["income", "expense"]).withMessage("Type must be 'income' or 'expense'"),

  body("amount")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),

  body("category")
    .optional()
    .isString().withMessage("Category must be a string")
    .trim(),

  body("description")
    .optional()
    .isString().withMessage("Description must be a string")
    .trim(),

  body("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)"),
];

export const validateGetTransactions = [
  query("type")
    .optional()
    .isIn(["income", "expense"]).withMessage("Type must be 'income' or 'expense'"),

  query("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/).withMessage("Month must be in YYYY-MM format"),

  query("category")
    .optional()
    .isString().withMessage("Category must be a string"),

  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

export const validateMongoId = [
  param("id")
    .isMongoId().withMessage("Invalid transaction ID"),
];