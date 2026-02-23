import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import BadgeDefinition from '../../models/badge.model.js';
import GamificationProfile from '../../models/gamification.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';

describe('Gamification Integration Tests',  () => {
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

        //Seed badges
        await request(app)
            .post('/api/play/admin/seed-badges')
            .set('Authorization', `Bearer ${adminToken}`);
    });

    describe('GET /api/play/profile', () => {
        it('should auto-create and return a profile for new user', async () => {
            const res = await request(app)
                .get('/api/play/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.totalXP).toBe(0);
            expect(res.body.data.level).toBe(1);
            expect(res.body.data.levelTitle).toBe('Money Newbie');
        });

        it('should return 401 without a token', async () => {
            await request(app)
                .get('/api/play/profile')
                .expect(401);
        });
    });

    describe('POST /api/play/daily-login', () => {
        it('should award XP and start streak on first login', async () => {
            const res = await request(app)
                .post('/api/play/daily-login')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.xpAwarded).toBe(5);
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
    });

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
        });

        it('should fail validation with invalid amount', async () => {
             await request(app)
                .post('/api/play/award-xp')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ source: 'test', amount: 9999 })
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
    });

    describe('GET /api/play/leaderboard', () => {
        it('should return leaderboard with myRank', async () => {
            await request(app)
                .post('/api/play/daily-login')
                .set('Authorization', `Bearer ${userToken}`);

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
    });
    

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

        it('should filter by category', async () => {
            const res = await request(app)
                .get('/api/play/badges?category=streak')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body.data.every(b => b.category === 'streak')).toBe(true);
        });
    });

    describe('GET /api/play/admin/stats', () => {
        it('should return stats for admin', async () => {
            const res = await request(app)
                .get('/api/play/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('totalActiveProfiles');
            expect(res.body.data).toHaveProperty('averageXP');
        });

        it('should return 403 for regular user', async () => {
            await request(app)
                .get('/api/play/admin/stats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });
});