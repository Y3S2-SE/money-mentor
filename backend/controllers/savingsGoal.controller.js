import * as savingsGoalService from "../services/savingsGoal.service.js";
import { awardActionBadge } from "../utils/gamificationEngine.js";

// POST /api/dashboard/savings-goal
export const createSavingsGoal = async (req, res, next) => {
  try {
    const goal = await savingsGoalService.createSavingsGoal(
      req.user._id,
      req.body
    );

    try {
      await awardActionBadge(req.user._id, 'first_saving_goal');
    } catch (badgeErr) {
      console.error('[Badge] first_saving_goal award failed:', badgeErr)
    }

    return res.status(201).json({
      success: true,
      message: "Savings goal created successfully",
      data: goal,
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      res.status(409);
    }
    next(error);
  }
};

// GET /api/dashboard/savings-goal
export const getSavingsGoal = async (req, res, next) => {
  try {
    const goal = await savingsGoalService.getSavingsGoal(
      req.user._id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Savings goal retrieved successfully",
      data: goal,
    });
  } catch (error) {
    if (error.message.includes("No savings goal found")) {
      res.status(404);
    }
    next(error);
  }
};

// PUT /api/dashboard/savings-goal
export const updateSavingsGoal = async (req, res, next) => {
  try {
    const goal = await savingsGoalService.updateSavingsGoal(
      req.user._id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Savings goal updated successfully",
      data: goal,
    });
  } catch (error) {
    if (error.message.includes("No savings goal found")) {
      res.status(404);
    }
    next(error);
  }
};

// GET /api/dashboard/savings-goal-progress
export const getSavingsGoalProgress = async (req, res, next) => {
  try {
    const progress = await savingsGoalService.getSavingsGoalProgress(
      req.user._id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Savings goal progress retrieved successfully",
      data: progress,
    });
  } catch (error) {
    if (error.message.includes("No savings goal set")) {
      res.status(404);
    }
    next(error);
  }
};