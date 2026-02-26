import Transaction from "../models/transaction.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper: get start and end of a month
const getMonthRange = (month) => {
  if (month) {
    const [year, mon] = month.split("-");
    return {
      start: new Date(year, mon - 1, 1),
      end: new Date(year, mon, 1),
    };
  }
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
};

// GET /api/dashboard/summary
// Default: current month. Accepts ?month=YYYY-MM
export const getSummary = async (userId, filters = {}) => {
  const { month } = filters;
  const { start, end } = getMonthRange(month);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const totalIncome = result.find((r) => r._id === "income")?.total || 0;
  const totalExpense = result.find((r) => r._id === "expense")?.total || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0
      ? parseFloat(((netSavings / totalIncome) * 100).toFixed(2))
      : 0;

  // Financial health score (0-100)
  let financialHealthScore = 0;
  if (totalIncome > 0) {
    financialHealthScore = Math.min(100, Math.round(savingsRate * 1.5));
  }

  // Spending warning
  const spendingWarning =
    totalExpense > totalIncome
      ? "Your expenses exceeded your income this month. Try to cut back on non-essential spending."
      : null;

  return {
    period: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    financialHealthScore,
    spendingWarning,
  };
};

// GET /api/dashboard/category-breakdown
// Default: current month. Accepts ?month=YYYY-MM&type=expense|income
export const getCategoryBreakdown = async (userId, filters = {}) => {
  const { month, type = "expense" } = filters;
  const { start, end } = getMonthRange(month);

  const breakdown = await Transaction.aggregate([
    {
      $match: {
        userId,
        type,
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        total: 1,
        count: 1,
      },
    },
  ]);

  // Calculate percentage for each category
  const grandTotal = breakdown.reduce((sum, item) => sum + item.total, 0);
  const breakdownWithPercentage = breakdown.map((item) => ({
    ...item,
    percentage:
      grandTotal > 0
        ? parseFloat(((item.total / grandTotal) * 100).toFixed(2))
        : 0,
  }));

  return {
    period: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    type,
    breakdown: breakdownWithPercentage,
  };
};

// GET /api/dashboard/trends
// Returns last 6 months of income vs expense
export const getMonthlyTrends = async (userId) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const trends = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Build a clean month-by-month structure
  const monthMap = {};
  trends.forEach(({ _id, total }) => {
    const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
    if (!monthMap[key]) {
      monthMap[key] = { month: key, income: 0, expense: 0, savings: 0 };
    }
    monthMap[key][_id.type] = total;
  });

  // Calculate savings per month
  const result = Object.values(monthMap).map((entry) => ({
    ...entry,
    savings: parseFloat((entry.income - entry.expense).toFixed(2)),
  }));

  return result;
};

// GET /api/dashboard/insight
// Uses Gemini API to generate a personalized financial tip
export const getFinancialInsight = async (userId, filters = {}) => {
  const summary = await getSummary(userId, filters);
  const categoryData = await getCategoryBreakdown(userId, filters);

  const topCategories = categoryData.breakdown
    .slice(0, 3)
    .map((c) => `${c.category} (${c.percentage}%)`)
    .join(", ");

  const prompt = `
You are a friendly financial coach helping a young person manage their money.

Here is their financial summary for this month:
- Total Income: ${summary.totalIncome}
- Total Expenses: ${summary.totalExpense}
- Net Savings: ${summary.netSavings}
- Savings Rate: ${summary.savingsRate}%
- Financial Health Score: ${summary.financialHealthScore}/100
- Top spending categories: ${topCategories || "No expenses recorded"}
${summary.spendingWarning ? `- Warning: ${summary.spendingWarning}` : ""}

Give a short, friendly, and motivating financial tip (2-3 sentences max) tailored to this data.
Keep it simple and encouraging for a young person. Do not use technical jargon.
  `.trim();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const insight = result.response.text();

  return {
    period: summary.period,
    summary,
    insight,
  };
};