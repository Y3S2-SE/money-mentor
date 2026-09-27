import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';

// Verification of JWT token
export const protect = async (req, res, next) => {
    try {
        let token;

        // Check if exists in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Not authorized, no token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!Number.isInteger(decoded.tokenVersion)) {
            logger.warn('security.auth.token_rejected', {
                reason: 'missing_token_version',
                userId: decoded.id,
                path: req.originalUrl,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Session is no longer valid'
            });
        }

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password +tokenVersion');

        if (!req.user) {
            logger.warn('security.auth.token_rejected', {
                reason: 'user_not_found',
                userId: decoded.id,
                path: req.originalUrl,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'User not found'
            });
        }

        // Existing documents without the physical field have effective version 0
        const effectiveTokenVersion = req.user.tokenVersion ?? 0;

        if (decoded.tokenVersion !== effectiveTokenVersion) {
            logger.warn('security.auth.token_rejected', {
                reason: 'session_invalidated',
                userId: req.user._id.toString(),
                path: req.originalUrl,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Session is no longer valid'
            });
        }

        if (!req.user.isActive) {
            logger.warn('security.auth.token_rejected', {
                reason: 'account_deactivated',
                userId: req.user._id.toString(),
                path: req.originalUrl,
                ip: req.ip
            });
            return res.status(403).json({
                success: false,
                message: "User account is deactivated"
            });
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logger.warn('security.auth.token_rejected', {
                reason: 'invalid_token',
                path: req.originalUrl,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            logger.warn('security.auth.token_rejected', {
                reason: 'token_expired',
                path: req.originalUrl,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Token Expired'
            });
        }
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Invalid token'
            });
        }

        logger.error('Authentication failed', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        })
    }
};

// Role based access control
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            logger.warn('security.authorization.denied', {
                userId: req.user._id?.toString(),
                role: req.user.role,
                requiredRoles: roles,
                path: req.originalUrl,
                ip: req.ip
            });
            return res.status(403).json({
                success: false,
                messgae: `Role '${req.user.role}' is not authorized to acces this resource`
            });
        }
        next();
    };
};