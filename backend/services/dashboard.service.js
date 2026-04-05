import Transaction from "../models/transaction.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import InsightCache from "../models/insightCache.model.js";

// Helper to get start and end of a month
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

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_CALLS_PER_MONTH = 5;
const END_OF_MONTH_DAY = 28;

/**
 * Decides whether a new Gemini call is allowed right now.
 * Returns { shouldCall: bool, reason: string }
 */
const shouldCallGemini = (cached, now) => {
  if (!cached) {
    return { shouldCall: true, reason: 'first_call' };
  }

  const todayDate = now.getDate();
  const isEndOfMonthWindow = todayDate >= END_OF_MONTH_DAY;

  if (isEndOfMonthWindow && !cached.isEndOfMonth) {
    return { shouldCall: true, reason: 'end_of_month' }; 
  }

  if (cached.isEndOfMonth) {
    return { shouldCall: false, reason: 'end_of_month_done' };
  }

  if (cached.callCount >= MAX_CALLS_PER_MONTH) {
    return { shouldCall: false, reason: 'monthly_cap_reached' };
  }

  if (cached.nextCallAllowedAt && now < new Date(cached.nextCallAllowedAt)) {
    return { shouldCall: false, reason: 'within_5_day_window' };
  }

  return { shouldCall: true, reason: 'cycle_refresh' };
};

/**
 * Generate a rule-based insight from real financial data.
 * Used when Gemini is unavailable OR between Gemini cycles to keep
 * the displayed insight feeling fresh even without an API call.
 */
const generateRuleBasedInsight = (summary, topCategory) => {
    if (summary.totalIncome === 0 && summary.totalExpense === 0) {
        return 'Add your income and expenses this month to get personalized financial tips!';
    }
    if (summary.totalExpense > summary.totalIncome) {
        return `Your expenses exceeded your income by ${(summary.totalExpense - summary.totalIncome).toLocaleString()} this month. Your biggest spending area is ${topCategory || 'general expenses'} - even a small reduction there would help.`;
    }
    if (summary.savingsRate >= 30) {
        return `Outstanding! You're saving ${summary.savingsRate}% of your income. You're well ahead of the recommended 20% target - consider putting the surplus toward a specific goal.`;
    }
    if (summary.savingsRate >= 20) {
        return `Great discipline - you saved ${summary.savingsRate}% of your income this month. Keep this habit consistent and your financial position will compound over time.`;
    }
    if (summary.savingsRate >= 10) {
        return `You saved ${summary.savingsRate}% this month - solid progress. Trimming a little from ${topCategory || 'your top spending area'} could push you past the 20% mark next month.`;
    }
    return `You saved ${summary.savingsRate}% this month. Even small consistent savings build meaningful wealth over time. Try setting a specific savings target for next month.`;
};

// GET /api/dashboard/insight
// Uses Gemini API to generate a personalized financial tip
export const getFinancialInsight = async (userId, filters = {}) => {
    const { month } = filters;
    const now = new Date();
    const period = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Always fetch fresh financial data — this is cheap (your own DB)
    const summary = await getSummary(userId, filters);
    const categoryData = await getCategoryBreakdown(userId, filters);
    const topCategory = categoryData.breakdown[0]?.category || null;

    // Check existing cache for this user+month
    const cached = await InsightCache.findOne({ userId, month: period });

    const { shouldCall, reason } = shouldCallGemini(cached, now);

    let insight;
    let callCount = cached?.callCount || 0;
    let isEndOfMonth = cached?.isEndOfMonth || false;

    if (!shouldCall) {
        // Within cache window — use cached Gemini insight if available,
        // otherwise generate rule-based from fresh data
        insight = cached?.insight || generateRuleBasedInsight(summary, topCategory);

        return {
            period,
            summary,          // always fresh from DB
            insight,          // cached Gemini text or rule-based
            fromCache: true,
            cacheReason: reason,
            callCount,
            nextRefresh: cached?.nextCallAllowedAt || null,
        };
    }

    // Gemini call is allowed — build prompt
    const topCategories = categoryData.breakdown
        .slice(0, 3)
        .map((c) => `${c.category} (${c.percentage}%)`)
        .join(', ');

    const isEndOfMonthCall = reason === 'end_of_month';

    const prompt = isEndOfMonthCall
        ? `
You are a friendly financial coach helping a young person manage their money.

It's the end of the month. Here is their complete financial picture:
- Total Income: ${summary.totalIncome}
- Total Expenses: ${summary.totalExpense}
- Net Savings: ${summary.netSavings}
- Savings Rate: ${summary.savingsRate}%
- Financial Health Score: ${summary.financialHealthScore}/100
- Top spending categories: ${topCategories || 'No expenses recorded'}
${summary.spendingWarning ? `- Warning: ${summary.spendingWarning}` : ''}

Give a brief end-of-month financial summary and one specific actionable goal for next month.
Keep it encouraging, simple, and under 3 sentences.
        `.trim()
        : `
You are a friendly financial coach helping a young person manage their money.

Here is their financial summary so far this month:
- Total Income: ${summary.totalIncome}
- Total Expenses: ${summary.totalExpense}
- Net Savings: ${summary.netSavings}
- Savings Rate: ${summary.savingsRate}%
- Financial Health Score: ${summary.financialHealthScore}/100
- Top spending categories: ${topCategories || 'No expenses recorded'}
${summary.spendingWarning ? `- Warning: ${summary.spendingWarning}` : ''}

Give a short, friendly, and motivating financial tip (2-3 sentences max) tailored to this data.
Keep it simple and encouraging for a young person. Do not use technical jargon.
        `.trim();

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        insight = result.response.text();

        // Update call count and schedule next allowed call
        callCount = (cached?.callCount || 0) + 1;
        isEndOfMonth = isEndOfMonthCall;

        const nextCallAllowedAt = isEndOfMonthCall
            ? null  // end of month call — no more calls this month
            : new Date(now.getTime() + FIVE_DAYS_MS);

        // Upsert — update existing or create new
        await InsightCache.findOneAndUpdate(
            { userId, month: period },
            {
                userId,
                month: period,
                insight,
                summary,
                callCount,
                isEndOfMonth,
                generatedAt: now,
                nextCallAllowedAt,
            },
            { upsert: true, new: true }
        );

    } catch (err) {
        console.error('[getFinancialInsight] Gemini error:', err.message);

        // Gemini failed — generate rule-based from real data
        // Still cache it so we don't retry Gemini on every request
        insight = generateRuleBasedInsight(summary, topCategory);

        const nextCallAllowedAt = new Date(now.getTime() + FIVE_DAYS_MS);

        await InsightCache.findOneAndUpdate(
            { userId, month: period },
            {
                userId,
                month: period,
                insight,
                summary,
                callCount: cached?.callCount || 1,
                isEndOfMonth: false,
                generatedAt: now,
                nextCallAllowedAt,
            },
            { upsert: true, new: true }
        );
    }

    return {
        period,
        summary,            // always fresh
        insight,
        fromCache: false,
        cacheReason: reason,
        callCount,
        nextRefresh: isEndOfMonth ? null : new Date(now.getTime() + FIVE_DAYS_MS),
    };
};

// GET /api/dashboard/recent-transactions
// Returns last 5 transactions for the user
export const getRecentTransactions = async (userId) => {
  const transactions = await Transaction.find({ userId })
    .sort({ date: -1 })
    .limit(5);

  return transactions;
};

// GET /api/dashboard/convert?amount=10000&from=LKR&to=USD
// Uses fawazahmed0 exchange API (free, no key needed, supports LKR)
export const convertCurrency = async (amount, from = "LKR", to = "USD") => {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromLower}.json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Currency conversion failed: ${response.statusText}`);
  }

  const data = await response.json();
  const rate = data[fromLower][toLower];

  if (!rate) {
    throw new Error(`Currency '${to}' is not supported`);
  }

  return {
    amount: parseFloat(amount),
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    convertedAmount: parseFloat((amount * rate).toFixed(2)),
    rate: parseFloat(rate.toFixed(6)),
    date: data.date,
  };
};

export const getMonthlySavings = async (userId, month) => {
  const [year, mon] = month.split('-');
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const result = await Transaction.aggregate([
    {
      $match: { userId, date: { $gte: start, $lt: end } }
    },
    {
      $group: { _id: '$type', total: { $sum: '$amount' } }
    }
  ]);

  const income = result.find(r => r._id === 'income')?.total || 0;
  const expense = result.find(r => r._id === 'expense')?.total || 0;
  const save = income - expense;
  
  return save;
}