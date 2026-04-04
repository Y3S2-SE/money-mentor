import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    linkPreview: {
      url: String,
      title: String,
      description: String,
      image: String,
      siteName: String,
    },
    // ── Badge share ────────────────────────────────────────────────────────
    badgeShare: {
      badgeId:     { type: mongoose.Schema.Types.ObjectId, ref: "BadgeDefinition" },
      key:         String,   // e.g. "streak_7_days"  — used to load Lottie on client
      name:        String,
      description: String,
      category:    String,
      xpReward:    Number,
    },
    type: {
      type: String,
      enum: ["text", "system", "badge"],
      default: "text",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;