import SavingsGoal from "../models/savingsGoal.model.js";
import { getSummary } from "./dashboard.service.js";

// Helper to get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// POST /api/dashboard/savings-goal
export const createSavingsGoal = async (userId, data) => {
  const { monthlyGoal, month = getCurrentMonth() } = data;

  // Check if goal already exists for this month
  const existing = await SavingsGoal.findOne({ userId, month });
  if (existing) {
    throw new Error("A savings goal already exists for this month. Use PUT to update it.");
  }

  const goal = new SavingsGoal({ userId, monthlyGoal, month });
  return await goal.save();
};

// GET /api/dashboard/savings-goal
export const getSavingsGoal = async (userId, filters = {}) => {
  const { month = getCurrentMonth() } = filters;

  const goal = await SavingsGoal.findOne({ userId, month });

  if (!goal) {
    throw new Error("No savings goal found for this month");
  }

  return goal;
};

// PUT /api/dashboard/savings-goal
export const updateSavingsGoal = async (userId, data) => {
  const { monthlyGoal, month = getCurrentMonth() } = data;

  const goal = await SavingsGoal.findOneAndUpdate(
    { userId, month },
    { monthlyGoal },
    { new: true, runValidators: true }
  );

  if (!goal) {
    throw new Error("No savings goal found for this month. Use POST to create one.");
  }

  return goal;
};

// GET /api/dashboard/savings-goal-progress
export const getSavingsGoalProgress = async (userId, filters = {}) => {
  const { month = getCurrentMonth() } = filters;

  // Get the savings goal for the month
  const goal = await SavingsGoal.findOne({ userId, month });

  if (!goal) {
    throw new Error("No savings goal set for this month");
  }

  // Get actual savings from dashboard summary
  const summary = await getSummary(userId, { month });
  const actualSavings = summary.netSavings;

  // Handle negative savings
  const isNegative = actualSavings < 0;
  const percentage = isNegative
    ? 0
    : parseFloat(((actualSavings / goal.monthlyGoal) * 100).toFixed(2));

  const remaining = isNegative
    ? parseFloat((goal.monthlyGoal + Math.abs(actualSavings)).toFixed(2))
    : parseFloat((goal.monthlyGoal - actualSavings).toFixed(2));

  const achieved = actualSavings >= goal.monthlyGoal;

  return {
    month,
    goal: goal.monthlyGoal,
    saved: actualSavings,
    percentage: Math.min(100, percentage),
    remaining: remaining > 0 ? remaining : 0,
    achieved,
    warning: isNegative
      ? "You are currently spending more than you earn this month."
      : achieved
      ? "Congratulations! You have achieved your savings goal this month!"
      : null,
  };
};