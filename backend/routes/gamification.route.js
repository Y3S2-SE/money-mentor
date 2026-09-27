// IT23218512 - hotfix/vuln-7

import express from 'express';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js'
import { dailyLogin, getAdminStats, getAllBadges, getLeaderboard, getMyProfile, getXPHistory, seedBadges } from '../controllers/gamification.controller.js';
import { badgesQueryValidation, leaderboardQueryValidation, xpHistoryQueryValidation } from '../validations/game.validation.js';


const router = express.Router();

router.use(protect);

// User routes
router.get('/profile', getMyProfile);
router.post('/daily-login', dailyLogin);

// vuln-7: removed POST /award-xp. 
// It let any user award themselves any amount of XP.
// XP is now only given by server-checked actions (daily login, courses, articles, badges).
router.get('/leaderboard', leaderboardQueryValidation, validate, getLeaderboard);
router.get('/badges', badgesQueryValidation, validate, getAllBadges);
router.get('/xp-history', xpHistoryQueryValidation, validate, getXPHistory);

// Admin routes
router.post('/admin/seed-badges', authorize('admin'), seedBadges);
router.get('/admin/stats', authorize('admin'), getAdminStats);

export default router;