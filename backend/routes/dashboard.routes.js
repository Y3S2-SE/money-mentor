import express from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import * as savingsGoalController from "../controllers/savingsGoal.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { validateDashboardQuery } from "../validations/dashboard.validation.js";
import {
  validateCreateSavingsGoal,
  validateUpdateSavingsGoal,
  validateSavingsGoalQuery,
} from "../validations/savingsGoal.validation.js";

const router = express.Router();

// All dashboard routes are protected
router.use(protect);

// GET /api/dashboard/summary
router.get(
  "/summary",
  validateDashboardQuery,
  validate,
  dashboardController.getSummary
);

// GET /api/dashboard/category-breakdown
router.get(
  "/category-breakdown",
  validateDashboardQuery,
  validate,
  dashboardController.getCategoryBreakdown
);

// GET /api/dashboard/trends
router.get("/trends", dashboardController.getMonthlyTrends);

// GET /api/dashboard/insight
router.get(
  "/insight",
  validateDashboardQuery,
  validate,
  dashboardController.getFinancialInsight
);

// GET /api/dashboard/recent-transactions
router.get("/recent-transactions", dashboardController.getRecentTransactions);

// POST /api/dashboard/savings-goal
router.post(
  "/savings-goal",
  validateCreateSavingsGoal,
  validate,
  savingsGoalController.createSavingsGoal
);

// GET /api/dashboard/savings-goal
router.get(
  "/savings-goal",
  validateSavingsGoalQuery,
  validate,
  savingsGoalController.getSavingsGoal
);

// PUT /api/dashboard/savings-goal
router.put(
  "/savings-goal",
  validateUpdateSavingsGoal,
  validate,
  savingsGoalController.updateSavingsGoal
);

// GET /api/dashboard/savings-goal-progress
router.get(
  "/savings-goal-progress",
  validateSavingsGoalQuery,
  validate,
  savingsGoalController.getSavingsGoalProgress
);

export default router;