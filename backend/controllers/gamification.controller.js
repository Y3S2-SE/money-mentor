import GamificationProfile from "../models/gamification.model.js";
import BadgeDefinition from "../models/badge.model.js";
import { awardActionBadge, processXPEvent, processDailyLogin, XP_REWARDS, syncBadgesForUser } from "../utils/gamificationEngine.js";
import { BADGE_SEEDS } from "../seeds/seedBadges.js";
import Group from "../models/group.model.js";

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

        let newlyUnlocked = [];

        const shouldSync = req.query.sync === 'true';
        if (shouldSync) {
            try {
                newlyUnlocked = await syncBadgesForUser(req.user._id) || [];
                profile = await GamificationProfile
                    .findOne({ user: req.user._id })
                    .populate('earnedBadges.badge', 'key name description category xpReward');
            } catch (syncErr) {
                console.error('[Badge Sync] failed:', syncErr.message);
            }
        }

        res.status(200).json({
            success: true,
            data:profile.toJSON(),
            newlyUnlocked: newlyUnlocked.map(b => ({
                key: b.key,
                name: b.name,
                description: b.description,
                category: b.category,
                xpReward: b.xpReward ?? 0
            }))
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
 * @desc    Record daily login — delegates to shared processDailyLogin utility.
 * @route   POST /api/play/daily-login
 * @access  Private
 */
export const dailyLogin = async (req, res) => {
    try {
        const result = await processDailyLogin(req.user._id);
 
        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Failed to process daily login'
            });
        }
 
        res.status(200).json({
            success: true,
            message: result.alreadyCheckedIn
                ? 'Already checked in today'
                : `Day ${result.currentStreak} streak! Keep it up!`,
            data: result
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

        const userGroups = await Group.find({
            $or: [{ members: req.user._id }, { admin: req.user._id }]
        }).select('members admin')

        const friendIdSet = new Set();
        friendIdSet.add(req.user._id.toString());

        for (const group of userGroups) {
            for (const memberId of group.members) {
                friendIdSet.add(memberId.toString());
            }
            friendIdSet.add(group.admin.toString());
        }

        const friendIds = Array.from(friendIdSet);

        // if user has no group, return only themselves
        const leaderboard = await GamificationProfile
            .find({ user: { $in: friendIds } })
            .populate({
                path: 'user',
                match: { role: { $ne: 'admin' } },
                select: 'username role'
            })
            .sort({ totalXP: -1 })
            .limit(limit)
            .select('user totalXP level levelTitle currentStreak earnedBadges');

        const myProfile = await GamificationProfile.findOne({ user: req.user._id });

        // Rank within friends
        const myRank = myProfile ? await GamificationProfile.countDocuments({ 
            user: { $in: friendIds },
            totalXP: { $gt: myProfile.totalXP } }) + 1 
            : null;

        const totalParticipants = await GamificationProfile.countDocuments({ user: { $in: friendIds } });
        const filteredLeaderboard = leaderboard.filter(entry => entry.user !== null);

        res.status(200).json({
            success: true,
            data: {
                leaderboard: filteredLeaderboard.map((entry, index) => ({
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
                totalParticipants,
                friendCount: friendIds.length
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

export const seedBadges = async (req, res) => {
    try {
        let seeded = 0;
        let updated= 0;
        let skipped = 0;

        for (const badge of BADGE_SEEDS) {
            const exists = await BadgeDefinition.findOne({ key: badge.key });
            if (!exists) {
                await BadgeDefinition.create(badge);
                seeded++;
            } else {
                await BadgeDefinition.findOneAndUpdate(
                    { key: badge.key },
                    { $set: badge },
                    { runValidators: true }
                );
                updated++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Seeding complete: ${seeded} created, ${updated} updated, ${skipped} already existed`,
            data: { seeded, updated, skipped }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to seed badges',
            error: error.message
        });
    }
}


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