import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getVideoSuggestions } from '../controllers/youtube.controller.js';

const router = express.Router();

router.use(protect);

router.get('/search', getVideoSuggestions);

export default router;