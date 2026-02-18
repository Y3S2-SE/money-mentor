import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

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
                message: 'Not authorized, no token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!req.user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is deactivated"
            });
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token Expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        })
    }
};

// Role based access control
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                messgae: `Role '${req.user.role}' is not authorized to acces this resource`
            });
        }
        next();
    };
};