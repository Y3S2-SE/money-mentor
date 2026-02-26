import { query } from "express-validator";

// Helper: checks if a month string (YYYY-MM) has a valid month (01-12)
const isRealMonth = (value) => {
  const [year, month] = value.split("-").map(Number);
  return month >= 1 && month <= 12 && year >= 1900 && year <= 2100;
};

export const validateDashboardQuery = [
  query("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Month must be in YYYY-MM format")
    .custom((value) => {
      if (!isRealMonth(value)) {
        throw new Error("Month must be between 01 and 12");
      }
      return true;
    }),

  query("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Type must be 'income' or 'expense'"),
];

export const validateCurrencyConvert = [
  query("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),

  query("from")
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage("From currency must be a 3-letter currency code e.g. LKR"),

  query("to")
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage("To currency must be a 3-letter currency code e.g. USD"),
];