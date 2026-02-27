import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    monthlyGoal: {
      type: Number,
      required: [true, "Monthly goal amount is required"],
      min: [0.01, "Goal amount must be greater than 0"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      match: [/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"],
    },
  },
  {
    timestamps: true,
  }
);

// One goal per user per month
savingsGoalSchema.index({ userId: 1, month: 1 }, { unique: true });

const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);

export default SavingsGoal;