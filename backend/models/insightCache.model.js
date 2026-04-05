import mongoose, { mongo } from "mongoose";

const insightCacheSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    month: {
        type: String,
    },
    insight: {
        type: String,
        required: true,
    },
    summary: {
        type: mongoose.Schema.Types.Mixed,
    },
    callCount: {
        type: Number,
        default: 1,
    },
    isEndOfMonth: {
        type: Boolean,
        default: false,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    nextCallAllowedAt: {
        type: Date,
    }
}, { timestamps: false });

insightCacheSchema.index({ userId: 1, month: 1 }, { unique: true });

const InsightCache = mongoose.model('InsightCache', insightCacheSchema);
export default InsightCache;