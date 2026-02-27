import { body, query } from "express-validator";

// Helper: checks if a month string (YYYY-MM) has a valid month (01-12)
const isRealMonth = (value) => {
  const [year, month] = value.split("-").map(Number);
  return month >= 1 && month <= 12 && year >= 1900 && year <= 2100;
};

export const validateCreateSavingsGoal = [
  body("monthlyGoal")
    .notEmpty()
    .withMessage("Monthly goal amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Goal amount must be a positive number"),

  body("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Month must be in YYYY-MM format")
    .custom((value) => {
      if (!isRealMonth(value)) {
        throw new Error("Month must be between 01 and 12");
      }
      return true;
    }),
];

export const validateUpdateSavingsGoal = [
  body("monthlyGoal")
    .notEmpty()
    .withMessage("Monthly goal amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Goal amount must be a positive number"),

  body("month")
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Month must be in YYYY-MM format")
    .custom((value) => {
      if (!isRealMonth(value)) {
        throw new Error("Month must be between 01 and 12");
      }
      return true;
    }),
];

export const validateSavingsGoalQuery = [
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
];