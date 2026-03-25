import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 0 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 0 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again in 15 minutes.'
    }
});