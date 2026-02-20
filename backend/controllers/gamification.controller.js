import GamificationProfile from "../models/gamification.model.js";
import BadgeDefinition from "../models/badge.model.js";
import { awardActionBadge, processXPEvent, XP_REWARDS } from "../utils/gamificationEngine.js";

/**
 * @desc    Get current user's full gamification profile
 * @route   GET /api/gamification/profile
 * @access  Private
 */
export const getMyProfile = async (req, res) => {
    try {
        let profile = await GamificationProfile
            .findOne({ user: req.user._id })
            .populate('earnedBadges.badge', 'key name description category xpReward');

        if (!profile) {
            profile = await GamificationProfile.create({ user: req.user._id });
        }

        res.status(200).json({
            success: true,
            data:profile.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gamification profile',
            error: error.message
        });
    }
};

/**
 * @desc    Record daily login — awards XP, updates streak, evaluates badges
 * @route   POST /api/gamification/daily-login
 * @access  Private
 */
export const dailyLogin = async (req, res) => {
    try {
        const result = await processXPEvent(
            req.user._id,
            'daily_login',
            null,
            'Daily login reward'
        );

        const { profile, streakResult, xpResult, newlyEarnedBadges } = result;

        if (streakResult.streak) {
            if (profile.currentStreak === 7) {
                await processXPEvent(req.user._id, 'streak_7_days', null, '7-day streak bonus!');
                await awardActionBadge(req.user._id, 'streak_7_days');
            } else if (profile.currentStreak === 30) {
                await processXPEvent(req.user._id, 'streak_30_days', null, '30-day streak bonus!');
                await awardActionBadge(req.user._id, 'streak_30_days');
            }

            if (profile.xpHistory.length === 1) {
                await awardActionBadge(req.user._id, 'first_login');
            }
        }

        const updated = await GamificationProfile.findOne({ user: req.user._id });

        res.status(200).json({
            success: true,
            message: streakResult.streakUpdated ? `Day ${updated.currentStreak} streak! Keep it up!` : 'Already checked in today',
            data: {
                alreadyCheckedIn: !streakResult.streakUpdated,
                xpAwarded: streakResult.streakUpdated ? XP_REWARDS.daily_login : 0,
                totalXP: updated.totalXP,
                level: updated.level,
                levelTitle: updated.levelTitle,
                leveledUp: xpResult?.leveledUp ?? false,
                currentStreak:      updated.currentStreak,
                longestStreak:      updated.longestStreak,
                newlyEarnedBadges:  newlyEarnedBadges.map(b => ({
                    key:         b.key,
                    name:        b.name,
                    description: b.description,
                    category:    b.category
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to process daily login',
            error: error.message
        });
    }
};

/**
 * @desc    Award XP for a specific action
 * @route   POST /api/gamification/award-xp
 * @access  Private
 */
export const awardXP = async (req, res) => {
    try {
        const { source, amount, description } = req.body;

        const result = await processXPEvent(
            req.user._id,
            source,
            amount ?? null,
            description ?? ''
        );

        res.status(200).json({
            success: true,
            message: result.xpResult?.leveledUp
                ? `Level up! You are now level ${result.profile.level}`
                : 'XP awarded successfully',
            data: {
                xpAwarded: amount ?? XP_REWARDS[source] ?? 0,
                totalXP: result.profile.totalXP,
                level: result.profile.level,
                levelTitle: result.profile.levelTitle,
                leveledUp: result.xpResult?.leveledUp ?? false,
                levelProgress: result.profile.levelProgress,
                newlyEarnedBadges: result.newlyEarnedBadges.map(b => ({
                    key: b.key,
                    name: b.name,
                    description: b.description,
                    category: b.category
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to award XP',
            error: error.message
        });
    }
};

/**
 * @desc    Get leaderboard sorted by XP (global or friends)
 * @route   GET /api/gamification/leaderboard
 * @access  Private
 */
export const getLeaderboard = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const leaderboard = await GamificationProfile
            .find()
            .sort({ totalXp: -1 })
            .limit(limit)
            .populate('user', 'username')
            .select('user totalXP level levelTitle currentStreak earnedBadges');

        const myProfile = await GamificationProfile.findOne({ user: req.user._id });
        const myRank = myProfile ? await GamificationProfile.countDocuments({ totalXp: { $gt: myProfile.totalXP } }) + 1 : null;

        const totalParticipants = await GamificationProfile.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                leaderboard: leaderboard.map((entry, index) => ({
                    rank: index + 1,
                    username: entry.user?.username ?? 'Unknown',
                    totalXP: entry.totalXP,
                    level: entry.level,
                    levelTitle: entry.levelTitle,
                    currentStreak: entry.currentStreak,
                    badgeCount: entry.earnedBadges.length,
                    isCurrentUser: entry.user?._id.toString() === req.user._id.toString()
                })),
                myRank,
                totalParticipants
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard',
            error: error.message
        });
    }
};


/**
 * @desc    Get all badge definitions + earned status for current user
 * @route   GET /api/gamification/badges
 * @access  Private
 */
export const getAllBadges = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { isActive: true };
        if (category) filter.category = category;

        const [badges, profile] = await Promise.all([
            BadgeDefinition.find(filter).sort({ category: 1, xpReward: 1 }),
            GamificationProfile.findOne({ user: req.user._id })
        ]);

        const earnedMap = new Map(
            (profile?.earnedBadges ?? []).map(b => [
                b.badge.toString(),
                b.earnedAt
            ])
        );

        res.status(200).json({
            success: true,
            data: badges.map(b => ({
                _id: b._id,
                key: b.key,
                name: b.name,
                description: b.description,
                category: b.category,
                xpReward: b.xpReward,
                condition: b.condition,
                earned: earnedMap.has(b._id.toString()),
                earnedAt: earnedMap.get(b._id.toString()) ?? null
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch badges',
            error: error.message
        });
    }
};


/**
 * @desc    Get XP history for current user
 * @route   GET /api/gamification/xp-history
 * @access  Private
 */
export const getXPHistory = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const profile = await GamificationProfile
            .findOne({ user: req.user._id })
            .select('xpHistory totalXP level levelTitle');

        if (!profile) {
            return res.status(200).json({
                success: true,
                data: { xpHistory: [], totalXP: 0, level: 1, levelTitle: 'Money Newbie' }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                xpHistory: [...profile.xpHistory].reverse().slice(0, limit),
                totalXP: profile.totalXP,
                level: profile.level,
                levelTitle: profile.levelTitle
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch XP history',
            error: error.message
        });
    }
};


/**
 * @desc    Get platform-wide gamification stats
 * @route   GET /api/gamification/admin/stats
 * @access  Private/Admin
 */
export const getAdminStats = async (req, res) => {
    try {
        const [totalProfiles, xpAggregate, topUser, totalBadges] = await Promise.all([
            GamificationProfile.countDocuments(),
            GamificationProfile.aggregate([
                { $group: { _id: null, avgXP: { $avg: '$totalXP' }, totalXP: { $sum: '$totalXP' } } }
            ]),
            GamificationProfile.findOne()
                .sort({ totalXP: -1 })
                .populate('user', 'username'),
            BadgeDefinition.countDocuments({ isActive: true })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalActiveProfiles: totalProfiles,
                averageXP: Math.round(xpAggregate[0]?.avgXP ?? 0),
                totalXPAwarded: xpAggregate[0]?.totalXP ?? 0,
                topUser: topUser
                    ? {
                        username: topUser.user?.username,
                        totalXP:  topUser.totalXP,
                        level:    topUser.level
                    }
                    : null,
                totalActiveBadges: totalBadges
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin stats',
            error: error.message
        });
    }
};