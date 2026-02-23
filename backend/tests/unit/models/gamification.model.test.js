import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB } from '../../setup/testSetup.js';
import GamificationProfile from '../../../models/gamification.model.js';

describe('GamificationProfile Model - Unit Tests', () => {
    beforeAll(async () => await setupTestDB());
    afterAll(async () => await teardownTestDB());

    const mockUserId = new mongoose.Types.ObjectId();

    describe('Static helpers', () => {
        it('getLevelFromXP returns level 1 for 0 XP', () => {
            expect(GamificationProfile.getLevelFromXP(0)).toBe(1);
        });

        it('getLevelFromXP returns level 2 for 100 XP', () => {
            expect(GamificationProfile.getLevelFromXP(100)).toBe(2);
        });

        it('getLevelFromXP returns level 11 for 1000 XP', () => {
            expect(GamificationProfile.getLevelFromXP(1000)).toBe(11);
        });

        it('getTitleForLevel returns Money Newbie for level 1', () => {
            expect(GamificationProfile.getTitleForLevel(1)).toBe('Money Newbie');
        });

        it('getTitleForLevel returns Smart Saver for level 6', () => {
            expect(GamificationProfile.getTitleForLevel(6)).toBe('Smart Saver');
        });

        it('getTitleForLevel returns Budget Master for level 11', () => {
            expect(GamificationProfile.getTitleForLevel(11)).toBe('Budget Master');
        });

        it('getTitleForLevel returns Pro Saver for level 16', () => {
            expect(GamificationProfile.getTitleForLevel(16)).toBe('Pro Saver');
        });

        it('getTitleForLevel returns Ultimate Saver for level 21+', () => {
            expect(GamificationProfile.getTitleForLevel(21)).toBe('Ultimate Saver');
        });
    });

    describe('awardXP instance method', () => {
        it('increases totalXP and updates level', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const result = profile.awardXP(100, 'test', 'Test XP');

            expect(profile.totalXP).toBe(100);
            expect(profile.level).toBe(2);
            expect(result.leveledUp).toBe(true);
        });

        it('appends to xpHistory', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(5, 'daily_login', 'Daily login');

            expect(profile.xpHistory).toHaveLength(1);
            expect(profile.xpHistory[0].source).toBe('daily_login');
            expect(profile.xpHistory[0].amount).toBe(5);
        });

        it('caps xpHistory at 100 entries', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            for (let i = 0; i < 105; i++) {
                profile.awardXP(1, 'test');
            }

            expect(profile.xpHistory).toHaveLength(100);
        });
    });

    describe('updateStreak instance method', () => {
        it('sets streak to 1 on first activity', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const result = profile.updateStreak();

            expect(result.streakUpdated).toBe(true);
            expect(profile.currentStreak).toBe(1);
            expect(profile.longestStreak).toBe(1);
        });

        it('does not update streak if already active today', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.updateStreak();
            const result = profile.updateStreak();

            expect(result.streakUpdated).toBe(false);
            expect(profile.currentStreak).toBe(1);
        });

        it('resets streak to 1 if more than 1 day missed', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.currentStreak = 5;
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            profile.lastActivityDate = threeDaysAgo;

            const result = profile.updateStreak();

            expect(result.streakUpdated).toBe(true);
            expect(profile.currentStreak).toBe(1);
        });
    });

    describe('awardBadge instance method', () => {
        it('awards a badge and returns true', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId = new mongoose.Types.ObjectId();
            const result = profile.awardBadge(badgeId);

            expect(result).toBe(true);
            expect(profile.earnedBadges).toHaveLength(1);
        });

        it('returns false if badge already earned (idempotent)', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            const badgeId = new mongoose.Types.ObjectId();
            profile.awardBadge(badgeId);
            const result = profile.awardBadge(badgeId);

            expect(result).toBe(false);
            expect(profile.earnedBadges).toHaveLength(1);
        });
    });

    describe('levelProgress virtual', () => {
        it('returns correct percentage', () => {
            const profile = new GamificationProfile({ user: mockUserId });
            profile.awardXP(50, 'test');

            expect(profile.levelProgress.percentage).toBe(50);
        });
    });
});