// IT23218512 - hotfix/vuln-6

import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'performance';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 0 : 300,
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
    max: isTest ? 0 : 150,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again in 15 minutes.'
    }
});

// vuln-6: stricter per-IP limit just for login (registration keeps authLimiter).
// Works with the per-account lockout in utils/loginLockout.js. 
// This stops one IP guessing across many accounts, the lockout stops many IPs guessing one account.
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 0 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: {
        success: false,
        message: 'Too many login attempts from this network, please try again in 15 minutes.'
    }
});