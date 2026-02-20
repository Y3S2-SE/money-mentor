import { body, query } from 'express-validator';

export const awardXPValidation = [
    body('source')
        .trim()
        .notEmpty().withMessage('XP source is required')
        .isString().withMessage('Source must be a String')
        .isLength({ max: 50 }).withMessage('Source cannot exceed 50 characters'),

    body('amount')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('Amount must be an integer between 1 and 500'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Description cannot exceed 100 characters'),
];

export const leaderboardQueryValidation = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];

export const badgesQueryValidation = [
    query('category')
        .optional()
        .isIn(['action', 'milestone', 'streak'])
        .withMessage('Category must be action, milestone, or streak')
];

export const xpHistoryQueryValidation = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];