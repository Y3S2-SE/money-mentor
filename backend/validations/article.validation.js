import { body } from 'express-validator';

// Create article validation rules
export const createArticleRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
        .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

    body('summary')
        .trim()
        .notEmpty().withMessage('Summary is required')
        .isLength({ max: 300 }).withMessage('Summary cannot exceed 300 characters'),

    body('content')
        .notEmpty().withMessage('Content is required'),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'])
        .withMessage('Category must be one of: budgeting, investing, saving, debt, taxes, general'),

    body('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Difficulty must be one of: beginner, intermediate, advanced'),

    body('thumbnail')
        .optional(),

    body('pointsPerRead')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Points per read must be between 1 and 100'),
];

// Update article validation rules — all optional for partial updates
export const updateArticleRules = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
        .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

    body('summary')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Summary cannot exceed 300 characters'),

    body('content')
        .optional(),

    body('category')
        .optional()
        .isIn(['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'])
        .withMessage('Category must be one of: budgeting, investing, saving, debt, taxes, general'),

    body('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Difficulty must be one of: beginner, intermediate, advanced'),

    body('thumbnail')
        .optional()
        .isURL().withMessage('Thumbnail must be a valid URL'),

    body('pointsPerRead')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Points per read must be between 1 and 100'),

    body('isPublished')
        .optional()
        .isBoolean().withMessage('isPublished must be true or false'),
];

// Complete article validation rules
export const completeArticleRules = [
    body('articleId')
        .notEmpty().withMessage('articleId is required')
        .isMongoId().withMessage('articleId must be a valid MongoDB ID'),

    body('timeSpentSeconds')
        .notEmpty().withMessage('timeSpentSeconds is required')
        .isInt({ min: 30 }).withMessage('timeSpentSeconds must be at least 30 seconds'),
];
