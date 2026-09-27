import { body } from "express-validator";

// Register validation rules
export const registerValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('role')
        .not()
        .exists().withMessage('Role cannot be set during registration'),
    body('authProvider')
        .not().exists().withMessage('Authentication provider cannot be set during registration'),
    body('googleSub')
        .not().exists().withMessage('Google identity cannot be set during registration'),
    body('tokenVersion')
        .not().exists().withMessage('Token version cannot be set during registration')
];

// Google code exchange accepts only the authorization code in the body.
export const googleCodeValidation = [
    body()
        .custom(value =>
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.keys(value).every(key => key === 'code')
        )
        .withMessage('Only code is allowed'),
    body('code')
        .exists().withMessage('Code is required')
        .bail()
        .isString().withMessage('Code must be a string')
        .bail()
        .trim()
        .notEmpty().withMessage('Code is required')
        .isLength({ max: 4096 }).withMessage('Code is too long'),
    body('role')
        .not().exists().withMessage('Role cannot be supplied'),
    body('authProvider')
        .not().exists().withMessage('Authentication provider cannot be supplied'),
    body('googleSub')
        .not().exists().withMessage('Google identity cannot be supplied'),
    body('tokenVersion')
        .not().exists().withMessage('Token version cannot be supplied'),
    body('email')
        .not().exists().withMessage('Email cannot be supplied'),
    body('username')
        .not().exists().withMessage('Username cannot be supplied'),
    body('password')
        .not().exists().withMessage('Password cannot be supplied')
];

// Login validation rules
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

// Update profile validation
export const updateProfileRules = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, underscore only'),
    
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
];

// Change password validation
export const changePasswordRules = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number')
];
