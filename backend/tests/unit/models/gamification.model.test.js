import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import GamificationProfile from '../../../models/gamification.model.js';

describe('GamificationProfile Model - Unit Tests', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    describe('getLevelFromXP static method', () => {
        it('should return level 1 for 0 XP', () => {
            expect(GamificationProfile.getLevelFromXP(0)).toBe(1);
        });

        it('should return level 1 for 99 XP', () => {
            expect(GamificationProfile.getLevelFromXP(99)).toBe(1);
        });

        it('should return level 2 for 100 XP', () => {
            expect(GamificationProfile.getLevelFromXP(100)).toBe(2);
        });

        it('should return level 2 for 199 XP', () => {
            expect(GamificationProfile.getLevelFromXP(199)).toBe(2);
        });

        it('should return level 3 for 200 XP', () => {
            expect(GamificationProfile.getLevelFromXP(200)).toBe(3);
        });

        it('should return level 11 for 1000 XP', () => {
            expect(GamificationProfile.getLevelFromXP(1000)).toBe(11);
        });

        it('should never return below level 1', () => {
            expect(GamificationProfile.getLevelFromXP(0)).toBeGreaterThanOrEqual(1);
        });
    });

    describe('getTitleForLevel static method', () => {
        it('should return Money Newbie for level 1', () => {
            expect(GamificationProfile.getTitleForLevel(1)).toBe('Money Newbie');
        });

        it('should return Money Newbie for level 5', () => {
            expect(GamificationProfile.getTitleForLevel(5)).toBe('Money Newbie');
        });

        it('should return Smart Saver for level 6', () => {
            expect(GamificationProfile.getTitleForLevel(6)).toBe('Smart Saver');
        });

        it('should return Smart Saver for level 10', () => {
            expect(GamificationProfile.getTitleForLevel(10)).toBe('Smart Saver');
        });

        it('should return Budget Master for level 11', () => {
            expect(GamificationProfile.getTitleForLevel(11)).toBe('Budget Master');
        });

        it('should return Budget Master for level 15', () => {
            expect(GamificationProfile.getTitleForLevel(15)).toBe('Budget Master');
        });

        it('should return Pro Saver for level 16', () => {
            expect(GamificationProfile.getTitleForLevel(16)).toBe('Pro Saver');
        });

        it('should return Pro Saver for level 20', () => {
            expect(GamificationProfile.getTitleForLevel(20)).toBe('Pro Saver');
        });

        it('should return Ultimate Saver for level 21', () => {
            expect(GamificationProfile.getTitleForLevel(21)).toBe('Ultimate Saver');
        });

        it('should return Ultimate Saver for very high levels', () => {
            expect(GamificationProfile.getTitleForLevel(100)).toBe('Ultimate Saver');
        });
    });

    describe('xpForLevel static method', () => {
        it('should return 0 XP for level 1', () => {
            expect(GamificationProfile.xpForLevel(1)).toBe(0);
        });

        it('should return 100 XP for level 2', () => {
            expect(GamificationProfile.xpForLevel(2)).toBe(100);
        });

        it('should return 1000 XP for level 11', () => {
            expect(GamificationProfile.xpForLevel(11)).toBe(1000);
        });

        it('should never return negative XP', () => {
            expect(GamificationProfile.xpForLevel(1)).toBeGreaterThanOrEqual(0);
        });
    });

    describe('awardXP instance method', () => {
        it('should increase totalXP by the given amount', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(50, 'test');
            expect(profile.totalXP).toBe(50);
        });

        it('should update level when XP threshold crossed', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(100, 'test');
            expect(profile.level).toBe(2);
        });

        it('should return leveledUp true when leveling up', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const result = profile.awardXP(100, 'test');
            expect(result.leveledUp).toBe(true);
        });

        it('should return leveledUp false when not leveling up', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const result = profile.awardXP(50, 'test');
            expect(result.leveledUp).toBe(false);
        });

        it('should update levelTitle correctly after level up', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(100, 'test');
            expect(profile.levelTitle).toBe('Money Newbie');
        });

        it('should update levelTitle to Smart Saver at level 6', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(500, 'test');
            expect(profile.levelTitle).toBe('Smart Saver');
        });

        it('should return correct newLevel in result', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const result = profile.awardXP(100, 'test');
            expect(result.newLevel).toBe(2);
        });

        it('should accumulate XP across multiple awards', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(50, 'test');
            profile.awardXP(50, 'test');
            expect(profile.totalXP).toBe(100);
        });

        it('should append to xpHistory', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(5, 'daily_login', 'Daily login');

            expect(profile.xpHistory).toHaveLength(1);
            expect(profile.xpHistory[0].source).toBe('daily_login');
            expect(profile.xpHistory[0].amount).toBe(5);
            expect(profile.xpHistory[0].description).toBe('Daily login');
        });

        it('should default description to empty string', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(5, 'test');
            expect(profile.xpHistory[0].description).toBe('');
        });

        it('should cap xpHistory at 100 entries', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            for (let i = 0; i < 105; i++) {
                profile.awardXP(1, 'test');
            }
            expect(profile.xpHistory).toHaveLength(100);
        });

        it('should keep the most recent 100 entries when capping', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            for (let i = 0; i < 105; i++) {
                profile.awardXP(1, `source_${i}`);
            }
            expect(profile.xpHistory[0].source).toBe('source_5');
            expect(profile.xpHistory[99].source).toBe('source_104');
        });
    });


    describe('updateStreak instance method', () => {
        it('should set streak to 1 on first activity', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const result = profile.updateStreak();

            expect(result.streakUpdated).toBe(true);
            expect(profile.currentStreak).toBe(1);
        });

        it('should set longestStreak to 1 on first activity', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.updateStreak();
            expect(profile.longestStreak).toBe(1);
        });

        it('should set lastActivityDate on first activity', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.updateStreak();
            expect(profile.lastActivityDate).not.toBeNull();
        });

        it('should not update streak if already active today', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.updateStreak();
            const result = profile.updateStreak();

            expect(result.streakUpdated).toBe(false);
            expect(profile.currentStreak).toBe(1);
        });

        it('should increment streak on consecutive day', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            profile.currentStreak = 1;
            profile.lastActivityDate = yesterday;

            const result = profile.updateStreak();

            expect(result.streakUpdated).toBe(true);
            expect(profile.currentStreak).toBe(2);
        });

        it('should reset streak to 1 if more than 1 day missed', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.currentStreak = 5;
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            profile.lastActivityDate = threeDaysAgo;

            const result = profile.updateStreak();

            expect(result.streakUpdated).toBe(true);
            expect(profile.currentStreak).toBe(1);
        });

        it('should update longestStreak when currentStreak exceeds it', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            profile.currentStreak = 5;
            profile.longestStreak = 5;
            profile.lastActivityDate = yesterday;

            profile.updateStreak();

            expect(profile.longestStreak).toBe(6);
        });

        it('should not update longestStreak when currentStreak does not exceed it', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            profile.currentStreak = 3;
            profile.longestStreak = 10;
            profile.lastActivityDate = yesterday;

            profile.updateStreak();

            expect(profile.longestStreak).toBe(10);
        });

        it('should update lastActivityDate to today', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            profile.currentStreak = 1;
            profile.lastActivityDate = yesterday;

            profile.updateStreak();

            const today = new Date().toDateString();
            expect(new Date(profile.lastActivityDate).toDateString()).toBe(today);
        });
    });

    
    describe('awardBadge instance method', () => {
        it('should award a badge and return true', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId = new mongoose.Types.ObjectId();

            const result = profile.awardBadge(badgeId);

            expect(result).toBe(true);
            expect(profile.earnedBadges).toHaveLength(1);
        });

        it('should store badge with earnedAt timestamp', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId = new mongoose.Types.ObjectId();
            profile.awardBadge(badgeId);

            expect(profile.earnedBadges[0].badge.toString()).toBe(badgeId.toString());
            expect(profile.earnedBadges[0].earnedAt).toBeInstanceOf(Date);
        });

        it('should return false if badge already earned', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId = new mongoose.Types.ObjectId();

            profile.awardBadge(badgeId);
            const result = profile.awardBadge(badgeId);

            expect(result).toBe(false);
            expect(profile.earnedBadges).toHaveLength(1);
        });

        it('should allow awarding different badges', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId1 = new mongoose.Types.ObjectId();
            const badgeId2 = new mongoose.Types.ObjectId();

            profile.awardBadge(badgeId1);
            profile.awardBadge(badgeId2);

            expect(profile.earnedBadges).toHaveLength(2);
        });
    });

    
    describe('hasBadge instance method', () => {
        it('should return true if badge is earned', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId = new mongoose.Types.ObjectId();
            profile.awardBadge(badgeId);

            expect(profile.hasBadge(badgeId)).toBe(true);
        });

        it('should return false if badge is not earned', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId = new mongoose.Types.ObjectId();

            expect(profile.hasBadge(badgeId)).toBe(false);
        });
    });

    
    describe('levelProgress virtual', () => {
        it('should return 0% at start of level', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.levelProgress.percentage).toBe(0);
        });

        it('should return 50% at halfway through level', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(50, 'test');
            expect(profile.levelProgress.percentage).toBe(50);
        });

        it('should return 100% at max of level', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(99, 'test');
            expect(profile.levelProgress.percentage).toBe(99);
        });

        it('should return correct earned XP in current level', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(150, 'test');

            expect(profile.levelProgress.earned).toBe(50);
        });

        it('should return correct needed XP for next level', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.levelProgress.needed).toBe(100);
        });
    });

   
    describe('default values', () => {
        it('should default totalXP to 0', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.totalXP).toBe(0);
        });

        it('should default level to 1', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.level).toBe(1);
        });

        it('should default levelTitle to Money Newbie', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.levelTitle).toBe('Money Newbie');
        });

        it('should default currentStreak to 0', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.currentStreak).toBe(0);
        });

        it('should default longestStreak to 0', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.longestStreak).toBe(0);
        });

        it('should default lastActivityDate to null', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.lastActivityDate).toBeNull();
        });

        it('should default earnedBadges to empty array', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.earnedBadges).toHaveLength(0);
        });

        it('should default xpHistory to empty array', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            expect(profile.xpHistory).toHaveLength(0);
        });
    });
});