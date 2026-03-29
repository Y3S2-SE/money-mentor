import GamificationProfile from "../models/gamification.model.js";
import BadgeDefinition from "../models/badge.model.js";

export const XP_REWARDS = {
    daily_login: 5,
    streak_7_days: 20,
    streak_30_days: 75,
    complete_goal: 30,
    first_login: 25,
    first_saving_goal: 40,
    read_article: 15,
    badge_reward: 0
};

/**
 * @param {ObjectId} userId
 * @param {string}   source      - key from XP_REWARDS or custom string
 * @param {number|null} customAmount - override XP amount (null = use XP_REWARDS[source])
 * @param {string}   description - human-readable log entry
 */
export const processXPEvent = async (userId, source, customAmount = null, description = '') => {
    let profile = await GamificationProfile.findOne({ user: userId });
    if (!profile) {
        profile = new GamificationProfile({ user: userId });
    }

    const amount = customAmount !== null ? customAmount : (XP_REWARDS[source] ?? 0);

    const streakResult = profile.updateStreak();

    let xpResult = null;
    if (amount > 0) {
        xpResult = profile.awardXP(amount, source, description);
    }

    const newlyEarnedBadges = await evaluateBadges(profile);

    await profile.save();

    return { profile, xpResult, streakResult, newlyEarnedBadges };
};

/**
 * Shared daily login reward processor 
 * Used by both auth.controller (auto on login) and gamification.controller (manual route).
 */

export const processDailyLogin = async (userId, { silent = false } = {}) => {
    try {
        let profile = await GamificationProfile.findOne({ user: userId });
        if (!profile) {
            profile = await GamificationProfile.create({ user: userId });
        }
 
        const streakResult = profile.updateStreak();
 
        if (!streakResult.streakUpdated) {
            return {
                alreadyCheckedIn:  true,
                xpAwarded:         0,
                totalXP:           profile.totalXP,
                level:             profile.level,
                levelTitle:        profile.levelTitle,
                leveledUp:         false,
                currentStreak:     profile.currentStreak,
                longestStreak:     profile.longestStreak,
                newlyEarnedBadges: []
            };
        }
 
        await profile.save();
 
        const result = await processXPEvent(userId, 'daily_login', null, 'Daily login reward');
        const { xpResult, newlyEarnedBadges } = result;
 
        // Collect action badges — return value captured so they reach the frontend
        const actionBadges = [];
 
        if (result.profile.xpHistory.length === 1) {
            const badge = await awardActionBadge(userId, 'first_login');
            if (badge) actionBadges.push(badge);
        }
 
        if (profile.currentStreak === 7) {
            await processXPEvent(userId, 'streak_7_days', null, '7-day streak bonus!');
            const badge = await awardActionBadge(userId, 'streak_7_days');
            if (badge) actionBadges.push(badge);
        } else if (profile.currentStreak === 30) {
            await processXPEvent(userId, 'streak_30_days', null, '30-day streak bonus!');
            const badge = await awardActionBadge(userId, 'streak_30_days');
            if (badge) actionBadges.push(badge);
        }
 
        const updated = await GamificationProfile.findOne({ user: userId });
 
        // Combine milestone badges + action badges
        const allEarnedBadges = [...newlyEarnedBadges, ...actionBadges];
 
        return {
            alreadyCheckedIn:  false,
            xpAwarded:         XP_REWARDS.daily_login,
            totalXP:           updated.totalXP,
            level:             updated.level,
            levelTitle:        updated.levelTitle,
            leveledUp:         xpResult?.leveledUp ?? false,
            currentStreak:     updated.currentStreak,
            longestStreak:     updated.longestStreak,
            newlyEarnedBadges: allEarnedBadges.map(b => ({
                key:         b.key,
                name:        b.name,
                description: b.description,
                category:    b.category
            }))
        };
    } catch (err) {
        if (!silent) console.error('[processDailyLogin] Error:', err.message);
        return null;
    }
};


/**
 * Checks all active badge definitions against the profile.
 * Awards any newly qualifying badges and grants their XP rewards.
 * Does NOT save — caller saves.
 */
export const evaluateBadges = async (profile) => {
    const definitions = await BadgeDefinition.find({ isActive: true });
    const newlyEarned = [];
    
    for (const def of definitions) {
        if (profile.hasBadge(def._id)) continue;

        let qualifies = false;

        switch (def.condition.type) {
            case 'xp_total':
                qualifies = profile.totalXP >= def.condition.threshold; 
                break;
            case 'streak_days':
                qualifies = profile.currentStreak >= def.condition.threshold;
                break;
            case 'level':
                qualifies = profile.level >= def.condition.threshold;
                break;
            case 'action':
                break;
        }

        if (qualifies) {
            const awarded = profile.awardBadge(def._id);
            if (awarded) {
                if (def.xpReward > 0) {
                    profile.awardXP(def.xpReward, 'badge_reward', `Badge unlocked: ${def.name}`);
                }
                newlyEarned.push(def);
            }
        }
    }

    return newlyEarned;
};

/**
 * Explicitly award an action-type badge by its actionKey.
 * Call this from other controllers (e.g. savings goal controller) when the action occurs.
 * Returns the badge definition if newly awarded, null if already earned or not found.
 */
export const awardActionBadge = async (userId, actionKey) => {
    const def = await BadgeDefinition.findOne({
        'condition.type': 'action',
        'condition.actionKey': actionKey,
        isActive: true
    });
    if (!def) return null;

    let profile = await GamificationProfile.findOne({ user: userId });
    if (!profile) {
        profile = new GamificationProfile({ user: userId });
    }

    const awarded = profile.awardBadge(def._id);
    if (!awarded) return null;

    if (def.xpReward > 0) {
        profile.awardXP(def.xpReward, 'badge_reward', `Action badge: ${def.name}`);
    }

    await profile.save();
    return def;
};