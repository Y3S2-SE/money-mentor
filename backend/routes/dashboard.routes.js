import express from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { validateDashboardQuery } from "../validations/dashboard.validation.js";

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

export default router;