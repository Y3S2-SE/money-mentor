import express from 'express';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js'
import { awardXP, dailyLogin, getAdminStats, getAllBadges, getLeaderboard, getMyProfile, getXPHistory } from '../controllers/gamification.controller.js';
import { awardXPValidation, badgesQueryValidation, leaderboardQueryValidation, xpHistoryQueryValidation } from '../validations/game.validation.js';


const router = express.Router();

router.use(protect);

// User routes
router.get('/profile', getMyProfile);
router.post('/daily-login', dailyLogin);
router.post('/award-xp', awardXPValidation, validate, awardXP);
router.get('/leaderboard', leaderboardQueryValidation, validate, getLeaderboard);
router.get('/badges', badgesQueryValidation, validate, getAllBadges);
router.get('/xp-history', xpHistoryQueryValidation, validate, getXPHistory);

// Admin routes
router.post('/admin/stats', authorize('admin'), getAdminStats);

export default router;