import * as dashboardService from "../services/dashboard.service.js";

// GET /api/dashboard/summary
export const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(
      req.user._id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/category-breakdown
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await dashboardService.getCategoryBreakdown(
      req.user._id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Category breakdown retrieved successfully",
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/trends
export const getMonthlyTrends = async (req, res, next) => {
  try {
    const trends = await dashboardService.getMonthlyTrends(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Monthly trends retrieved successfully",
      data: trends,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/insight
export const getFinancialInsight = async (req, res, next) => {
  try {
    const insight = await dashboardService.getFinancialInsight(
      req.user._id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Financial insight retrieved successfully",
      data: insight,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/recent-transactions
export const getRecentTransactions = async (req, res, next) => {
  try {
    const transactions = await dashboardService.getRecentTransactions(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Recent transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};
