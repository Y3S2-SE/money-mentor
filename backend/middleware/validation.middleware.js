import { validationResult } from 'express-validator';

// Middleware to handle validation errors
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'validation failed',
            errors: errors.array().map(err =>({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};