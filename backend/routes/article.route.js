import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createArticleRules, updateArticleRules, completeArticleRules } from '../validations/article.validation.js';
import {
    createArticle,
    getAllArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    completeArticle,
    getUserReadPoints
} from '../controllers/article.controller.js';

const router = express.Router();

router.use(protect);

// Admin-only mutations
router.post('/create', authorize('admin'), createArticleRules, validate, createArticle);
router.put('/:id', authorize('admin'), updateArticleRules, validate, updateArticle);
router.delete('/:id', authorize('admin'), deleteArticle);

// User endpoints — order matters: specific routes before :id
router.get('/my-points', getUserReadPoints);
router.get('/', getAllArticles);
router.get('/:id', getArticleById);

// Mark an article as read and earn points
router.post('/complete', completeArticleRules, validate, completeArticle);

export default router;
