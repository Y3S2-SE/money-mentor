import mongoose from "mongoose";

const earnedBadgeSchema = new mongoose.Schema(
    {
        badge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BadgeDefinition',
            required: true
        },
        earnedAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const xpHistorySchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true
        },
        source: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: '',
            trim: true
        },
        earnedAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

// Level configuration - 5 tiers
const LEVEL_TIERS = [
    { min: 1,  max: 5,  title: 'Money Newbie' },
    { min: 6,  max: 10, title: 'Smart Saver' },
    { min: 11, max: 15, title: 'Budget Master' },
    { min: 16, max: 20, title: 'Pro Saver' },
    { min: 21, max: Infinity, title: 'Ultimate Saver' }
];

const XP_PER_LEVEL = 100;

const gamificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        totalXP: {
            type: Number,
            default: 0,
            min: 0
        },
        level: {
            type: Number,
            default: 1,
            min: 1
        },
        levelTitle: {
            type: String,
            default: 'Money Newbie'
        },
        currentStreak: {
            type: Number,
            default: 0
        },
        longestStreak: {
            type: Number,
            default: 0
        },
        lastActivityDate: {
            type: Date,
            default: null
        },
        earnedBadges: {
            type: [earnedBadgeSchema],
            default: []
        },
        xpHistory: {
            type: [xpHistorySchema],
            default: []
        }
    },
    { timestamps: true }
);

//gamificationSchema.index({ user: 1 }, { unique: true });
gamificationSchema.index({ totalXP: -1 });

gamificationSchema.statics.getLevelFromXP = function (xp) {
    return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
};

gamificationSchema.statics.getTitleForLevel = function (level) {
    const tier = LEVEL_TIERS.find(t => level >= t.min && level <= t.max);
    return tier ? tier.title : 'Ultimate Saver';
};

gamificationSchema.statics.xpForLevel = function (level) {
    return Math.max(0, (level - 1) * XP_PER_LEVEL);
};

gamificationSchema.methods.awardXP = function (amount, source, description = '') {
    this.totalXP += amount;

    const newLevel = this.constructor.getLevelFromXP(this.totalXP);
    const leveledUp = newLevel > this.level;
    this.level = newLevel;
    this.levelTitle = this.constructor.getTitleForLevel(newLevel);

    this.xpHistory.push({ amount, source, description, earnedAt: new Date() });
    if (this.xpHistory.length > 100) {
        this.xpHistory = this.xpHistory.slice(-100);
    }

    return { leveledUp, newLevel, levelTitle: this.levelTitle };
};

gamificationSchema.methods.updateStreak = function () {
    const today = new Date();
    const todayStr = today.toDateString();

    if (!this.lastActivityDate) {
        this.currentStreak = 1;
        this.lastActivityDate = today;
        if (this.currentStreak > this.longestStreak) {
            this.longestStreak = this.currentStreak;
        }
        return { streakUpdated: true, currentStreak: this.currentStreak };
    }

    const lastStr = new Date(this.lastActivityDate).toDateString();

    if (lastStr === todayStr) {
        return { streakUpdated: false, currentStreak: this.currentStreak };
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (new Date(this.lastActivityDate).toDateString() === yesterday.toDateString()) {
        this.currentStreak += 1;
    } else {
        this.currentStreak = 1;
    }

    if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
    }

    this.lastActivityDate = today;
    return { streakUpdated: true, currentStreak: this.currentStreak };
};

gamificationSchema.methods.awardBadge = function (badgeId) {
    const alreadyEarned = this.earnedBadges.some(
        b => b.badge.toString() === badgeId.toString()
    );
    if (alreadyEarned) return false;
    this.earnedBadges.push({ badge: badgeId, earnedAt: new Date() });
    return true;
};

gamificationSchema.methods.hasBadge = function (badgeId) {
    return this.earnedBadges.some(
        b => b.badge.toString() === badgeId.toString()
    );
};

gamificationSchema.virtual('levelProgress').get(function () {
    const currentLevelXP = this.constructor.xpForLevel(this.level);
    const nextLevelXP = this.constructor.xpForLevel(this.level + 1);
    const earned = this.totalXP - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;

    return {
        earned,
        needed,
        percentage: Math.min(100, Math.floor((earned / needed) * 100))
    };
});

gamificationSchema.set('toJSON', { virtuals: true });
gamificationSchema.set('toObject', { virtuals: true });

const GamificationProfile = mongoose.model('GamificationProfile', gamificationSchema);

export default GamificationProfile;