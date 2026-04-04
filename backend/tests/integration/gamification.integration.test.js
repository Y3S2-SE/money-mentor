import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import BadgeDefinition from '../../models/badge.model.js';
import GamificationProfile from '../../models/gamification.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';

describe('Gamification Integration Tests', () => {
    let adminToken;
    let userToken;
    let userId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const userRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'gamer', email: 'gamer@test.com', password: 'Test123!' });
        userToken = userRes.body.data.token;
        userId = userRes.body.data.user.id;

        const adminRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'admin', email: 'admin@test.com', password: 'Admin123!' });

        await User.findByIdAndUpdate(adminRes.body.data.user.id, { role: 'admin' });

        const adminLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'Admin123!' });
        adminToken = adminLoginRes.body.data.token;

        await request(app)
            .post('/api/play/admin/seed-badges')
            .set('Authorization', `Bearer ${adminToken}`);
    });

    // ── getMyProfile ────────────────────────────────────────────────────────

    describe('GET /api/play/profile', () => {
        it('should auto-create and return a profile for new user', async () => {
            const res = await request(app)
                .get('/api/play/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.level).toBe(1);
            expect(res.body.data.levelTitle).toBe('Money Newbie');
        });

        it('should return 401 without a token', async () => {
            await request(app)
                .get('/api/play/profile')
                .expect(401);
        });

        it('should return existing profile if already created', async () => {
            // First call creates it
            await request(app)
                .get('/api/play/profile')
                .set('Authorization', `Bearer ${userToken}`);

            // Second call returns existing
            const res = await request(app)
                .get('/api/play/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
        });

        it('should run badge sync when sync=true query param is passed', async () => {
            const res = await request(app)
                .get('/api/play/profile?sync=true')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            // newlyUnlocked should be present in response
            expect(res.body).toHaveProperty('newlyUnlocked');
            expect(Array.isArray(res.body.newlyUnlocked)).toBe(true);
        });

        it('should return newlyUnlocked badges array when syncing with eligible badges', async () => {
            // Give user enough XP to qualify for milestone badges
            await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'custom', amount: 200 });

            const res = await request(app)
                .get('/api/play/profile?sync=true')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.newlyUnlocked)).toBe(true);
        });
    });

    // ── dailyLogin ──────────────────────────────────────────────────────────

    describe('POST /api/play/daily-login', () => {
        it('should award XP and start streak on first login', async () => {
            const res = await request(app)
                .post('/api/play/daily-login')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.currentStreak).toBe(1);
        });

        it('should not double-award XP on same day', async () => {
            await request(app)
                .post('/api/play/daily-login')
                .set('Authorization', `Bearer ${userToken}`);

            const res = await request(app)
                .post('/api/play/daily-login')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.alreadyCheckedIn).toBe(true);
            expect(res.body.data.xpAwarded).toBe(0);
        });

        it('should return 401 without token', async () => {
            await request(app)
                .post('/api/play/daily-login')
                .expect(401);
        });
    });

    // ── awardXP ─────────────────────────────────────────────────────────────

    describe('POST /api/play/award-xp', () => {
        it('should award XP for a valid source', async () => {
            const res = await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'complete_goal', description: 'Completed savings goal' })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.totalXP).toBeGreaterThan(0);
        });

        it('should trigger level up when XP threshold crossed', async () => {
            const res = await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'custom', amount: 100 })
                .expect(200);

            expect(res.body.data.leveledUp).toBe(true);
            expect(res.body.data.level).toBe(2);
            // This covers the leveledUp message branch (line 150-153)
            expect(res.body.message).toContain('Level up');
        });

        it('should return success message when no level up', async () => {
            const res = await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'complete_goal' })
                .expect(200);

            // Covers the else branch of leveledUp message
            expect(res.body.message).toBe('XP awarded successfully');
        });

        it('should fail validation with invalid amount', async () => {
            await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'test', amount: 9999 })
                .expect(400);
        });

        it('should fail validation with missing source', async () => {
            await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 50 })
                .expect(400);
        });

        it('should return newly earned badges', async () => {
            const res = await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'custom', amount: 100 })
                .expect(200);

            expect(res.body.data.newlyEarnedBadges.length).toBeGreaterThan(0);
            expect(
                res.body.data.newlyEarnedBadges.some(b => b.key === 'milestone_100xp')
            ).toBe(true);
        });

        it('should include levelProgress in response', async () => {
            const res = await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'complete_goal' })
                .expect(200);

            expect(res.body.data).toHaveProperty('levelProgress');
            expect(res.body.data.levelProgress).toHaveProperty('percentage');
        });

        it('should return 401 without token', async () => {
            await request(app)
                .post('/api/play/award-xp')
                .send({ source: 'complete_goal' })
                .expect(401);
        });
    });

    // ── getLeaderboard ──────────────────────────────────────────────────────

    describe('GET /api/play/leaderboard', () => {
        it('should return leaderboard with myRank', async () => {
            const res = await request(app)
                .get('/api/play/leaderboard')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.leaderboard)).toBe(true);
            expect(res.body.data).toHaveProperty('myRank');
            expect(res.body.data).toHaveProperty('totalParticipants');
        });

        it('should respect limit query param', async () => {
            const res = await request(app)
                .get('/api/play/leaderboard?limit=5')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.leaderboard.length).toBeLessThanOrEqual(5);
        });

        it('should show only current user when they have no groups', async () => {
            // New user with no groups — covers the no-group branch (line 226)
            const res = await request(app)
                .get('/api/play/leaderboard')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            // friendCount should be 1 (just themselves)
            expect(res.body.data.friendCount).toBeGreaterThanOrEqual(1);
        });

        it('should include friendCount in response', async () => {
            const res = await request(app)
                .get('/api/play/leaderboard')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data).toHaveProperty('friendCount');
        });

        it('should show group members on leaderboard when user is in a group', async () => {
            // Create a group
            const groupRes = await request(app)
                .post('/api/groups/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Test Group', maxMembers: 5 });

            const res = await request(app)
                .get('/api/play/leaderboard')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.leaderboard.length).toBeGreaterThanOrEqual(1);
        });

        it('should return 401 without token', async () => {
            await request(app)
                .get('/api/play/leaderboard')
                .expect(401);
        });
    });

    // ── getAllBadges ────────────────────────────────────────────────────────

    describe('GET /api/play/badges', () => {
        it('should return all badges with earned status', async () => {
            const res = await request(app)
                .get('/api/play/badges')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data[0]).toHaveProperty('earned');
            expect(res.body.data[0]).toHaveProperty('key');
        });

        it('should filter by category=streak', async () => {
            const res = await request(app)
                .get('/api/play/badges?category=streak')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.every(b => b.category === 'streak')).toBe(true);
        });

        it('should filter by category=milestone', async () => {
            const res = await request(app)
                .get('/api/play/badges?category=milestone')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.every(b => b.category === 'milestone')).toBe(true);
        });

        it('should filter by category=action', async () => {
            const res = await request(app)
                .get('/api/play/badges?category=action')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.every(b => b.category === 'action')).toBe(true);
        });

        it('should show earned=true for badges user has earned', async () => {
            // Give user 100 XP to earn milestone_100xp badge
            await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'custom', amount: 100 });

            const res = await request(app)
                .get('/api/play/badges')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // milestone_100xp should be earned
            const badge = res.body.data.find(b => b.key === 'milestone_100xp');
            expect(badge).toBeDefined();
            expect(badge.earned).toBe(true);
            expect(badge.earnedAt).not.toBeNull();
        });

        it('should show earned=false for badges user has not earned', async () => {
            const res = await request(app)
                .get('/api/play/badges')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // streak_30_days should not be earned by a new user
            const badge = res.body.data.find(b => b.key === 'streak_30_days');
            expect(badge).toBeDefined();
            expect(badge.earned).toBe(false);
            expect(badge.earnedAt).toBeNull();
        });

        it('should return badges even when user has no profile yet', async () => {
            // Delete the profile directly to simulate no profile
            await GamificationProfile.deleteOne({ user: userId });

            const res = await request(app)
                .get('/api/play/badges')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // Should still return badges, all unearned
            expect(res.body.success).toBe(true);
            expect(res.body.data.every(b => b.earned === false)).toBe(true);
        });

        it('should return 401 without token', async () => {
            await request(app)
                .get('/api/play/badges')
                .expect(401);
        });
    });

    // ── getXPHistory ────────────────────────────────────────────────────────

    describe('GET /api/play/xp-history', () => {
        it('should return empty history for new user with no profile', async () => {
            // Delete profile to simulate no profile state (covers line 312-317)
            await GamificationProfile.deleteOne({ user: userId });

            const res = await request(app)
                .get('/api/play/xp-history')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.xpHistory).toHaveLength(0);
            expect(res.body.data.totalXP).toBe(0);
            expect(res.body.data.level).toBe(1);
            expect(res.body.data.levelTitle).toBe('Money Newbie');
        });

        it('should return xp history after earning XP', async () => {
            await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'complete_goal', description: 'Test goal' });

            const res = await request(app)
                .get('/api/play/xp-history')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.xpHistory.length).toBeGreaterThan(0);
            expect(res.body.data.totalXP).toBeGreaterThan(0);
        });

        it('should respect limit query param', async () => {
            // Award XP multiple times
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/play/award-xp')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ source: 'complete_goal' });
            }

            const res = await request(app)
                .get('/api/play/xp-history?limit=3')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.xpHistory.length).toBeLessThanOrEqual(3);
        });

        it('should return 401 without token', async () => {
            await request(app)
                .get('/api/play/xp-history')
                .expect(401);
        });
    });

    // ── seedBadges ──────────────────────────────────────────────────────────

    describe('POST /api/play/admin/seed-badges', () => {
        it('should seed badges successfully as admin', async () => {
            // Clear badges first
            await BadgeDefinition.deleteMany({});

            const res = await request(app)
                .post('/api/play/admin/seed-badges')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.seeded).toBeGreaterThan(0);
        });

        it('should update existing badges when re-seeding', async () => {
            // Seeds already exist from beforeEach
            const res = await request(app)
                .post('/api/play/admin/seed-badges')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            // updated count should be > 0 since badges already exist
            expect(res.body.data.updated).toBeGreaterThan(0);
        });

        it('should return 403 for regular user', async () => {
            await request(app)
                .post('/api/play/admin/seed-badges')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should return 401 without token', async () => {
            await request(app)
                .post('/api/play/admin/seed-badges')
                .expect(401);
        });
    });

    // ── getAdminStats ────────────────────────────────────────────────────────

    describe('GET /api/play/admin/stats', () => {
        it('should return stats for admin', async () => {
            const res = await request(app)
                .get('/api/play/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('totalActiveProfiles');
            expect(res.body.data).toHaveProperty('averageXP');
            expect(res.body.data).toHaveProperty('totalXPAwarded');
            expect(res.body.data).toHaveProperty('totalActiveBadges');
        });

        it('should return topUser when profiles exist', async () => {
            // Award XP to create a profile with data
            await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'complete_goal' });

            const res = await request(app)
                .get('/api/play/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.data.topUser).not.toBeNull();
            expect(res.body.data.topUser).toHaveProperty('username');
            expect(res.body.data.topUser).toHaveProperty('totalXP');
            expect(res.body.data.topUser).toHaveProperty('level');
        });

        it('should return correct totalActiveBadges count', async () => {
            const res = await request(app)
                .get('/api/play/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.data.totalActiveBadges).toBeGreaterThan(0);
        });

        it('should return 403 for regular user', async () => {
            await request(app)
                .get('/api/play/admin/stats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should return 401 without token', async () => {
            await request(app)
                .get('/api/play/admin/stats')
                .expect(401);
        });
    });
});