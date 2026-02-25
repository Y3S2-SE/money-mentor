import Transaction from "../models/transaction.model.js";

// Create a new transaction
export const createTransaction = async (userId, data) => {
  const transaction = new Transaction({
    userId,
    ...data,
  });

  return await transaction.save();
};

// Get all transactions for a user with filters and pagination
export const getTransactions = async (userId, filters = {}) => {
  const { type, date, month, year, category, page = 1, limit = 10 } = filters;

  const query = { userId };

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  // Exact date filter (YYYY-MM-DD) - highest priority
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }
  // Month filter (YYYY-MM)
  else if (month) {
    const [year, mon] = month.split("-");
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    query.date = { $gte: start, $lt: end };
  }
  // Year filter (YYYY)
  else if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(parseInt(year) + 1, 0, 1);
    query.date = { $gte: start, $lt: end };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Transaction.countDocuments(query);

  const transactions = await Transaction.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return {
    transactions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// Get a single transaction by ID
export const getTransactionById = async (transactionId, userId) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

// Update a transaction
export const updateTransaction = async (transactionId, userId, data) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, userId },
    { ...data },
    { new: true, runValidators: true }
  );

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

// Delete a transaction
export const deleteTransaction = async (transactionId, userId) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: transactionId,
    userId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};