// IT23218512 - hotfix/vuln-7
import { query } from 'express-validator';

// vuln-7: removed awardXPValidation.
// It only checked the XP amount's format, not whether
// the user earned it. Its endpoint is gone, so 'body' is no longer imported.
// export const awardXPValidation = [
// ];

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