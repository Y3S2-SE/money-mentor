import { body, query, param } from "express-validator";

// Helper: checks if a date string is a real calendar date
const isRealDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

// Helper: checks if a month string (YYYY-MM) has a valid month (01-12)
const isRealMonth = (value) => {
  const [year, month] = value.split("-").map(Number);
  return month >= 1 && month <= 12 && year >= 1900 && year <= 2100;
};

// Helper: checks if a year is within a reasonable range
const isRealYear = (value) => {
  const year = parseInt(value);
  return year >= 1900 && year <= 2100;
};

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
    .isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      if (!isRealDate(value)) {
        throw new Error("Date does not exist in the calendar (e.g. Feb 30 is invalid)");
      }
      return true;
    }),
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
    .isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      if (!isRealDate(value)) {
        throw new Error("Date does not exist in the calendar (e.g. Feb 30 is invalid)");
      }
      return true;
    }),
];

export const validateGetTransactions = [
  query("type")
    .optional()
    .isIn(["income", "expense"]).withMessage("Type must be 'income' or 'expense'"),

  query("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      if (!isRealDate(value)) {
        throw new Error("Date does not exist in the calendar (e.g. Feb 30 is invalid)");
      }
      return true;
    }),

  query("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/).withMessage("Month must be in YYYY-MM format")
    .custom((value) => {
      if (!isRealMonth(value)) {
        throw new Error("Month must be between 01 and 12");
      }
      return true;
    }),

  query("year")
    .optional()
    .matches(/^\d{4}$/).withMessage("Year must be in YYYY format")
    .custom((value) => {
      if (!isRealYear(value)) {
        throw new Error("Year must be between 1900 and 2100");
      }
      return true;
    }),

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