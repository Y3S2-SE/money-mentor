import { body } from 'express-validator';

// Create course validation rules
export const createCourseRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'])
        .withMessage('Category must be one of: budgeting, investing, saving, debt, taxes, general'),

    body('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Difficulty must be one of: beginner, intermediate, advanced'),

    body('passingScore')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Passing score must be between 1 and 100'),

    body('thumbnail')
        .optional()
        .isURL().withMessage('Thumbnail must be a valid URL'),

    body('questions')
        .isArray({ min: 1 }).withMessage('At least one question is required'),

    body('questions.*.question')
        .trim()
        .notEmpty().withMessage('Question text is required for each question'),

    body('questions.*.options')
        .isArray({ min: 2, max: 6 }).withMessage('Each question must have between 2 and 6 options'),

    body('questions.*.options.*')
        .trim()
        .notEmpty().withMessage('Option text cannot be empty'),

    body('questions.*.correctAnswerIndex')
        .notEmpty().withMessage('Correct answer index is required for each question')
        .isInt({ min: 0 }).withMessage('Correct answer index must be a non-negative number'),

    body('questions.*.points')
        .optional()
        .isInt({ min: 1 }).withMessage('Points must be at least 1'),
];

// Update course validation rules — all fields optional since it's a partial update
export const updateCourseRules = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters')
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

    body('category')
        .optional()
        .isIn(['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'])
        .withMessage('Category must be one of: budgeting, investing, saving, debt, taxes, general'),

    body('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Difficulty must be one of: beginner, intermediate, advanced'),

    body('passingScore')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Passing score must be between 1 and 100'),

    body('thumbnail')
        .optional()
        .isURL().withMessage('Thumbnail must be a valid URL'),

    body('isPublished')
        .optional()
        .isBoolean().withMessage('isPublished must be true or false'),

    body('questions')
        .optional()
        .isArray({ min: 1 }).withMessage('At least one question is required'),

    body('questions.*.question')
        .optional()
        .trim()
        .notEmpty().withMessage('Question text cannot be empty'),

    body('questions.*.options')
        .optional()
        .isArray({ min: 2, max: 6 }).withMessage('Each question must have between 2 and 6 options'),

    body('questions.*.options.*')
        .optional()
        .trim()
        .notEmpty().withMessage('Option text cannot be empty'),

    body('questions.*.correctAnswerIndex')
        .optional()
        .isInt({ min: 0 }).withMessage('Correct answer index must be a non-negative number'),

    body('questions.*.points')
        .optional()
        .isInt({ min: 1 }).withMessage('Points must be at least 1'),
];

// Submit course validation rules
export const submitCourseRules = [
    body('answers')
        .isArray({ min: 1 }).withMessage('Answers must be a non-empty array'),

    body('answers.*')
        .isInt({ min: 0 }).withMessage('Each answer must be a non-negative number'),
];