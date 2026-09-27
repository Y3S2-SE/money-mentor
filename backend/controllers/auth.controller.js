import User from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { processDailyLogin } from "../utils/gamificationEngine.js";
import { logger } from "../utils/logger.js";
import { GoogleAuthError, verifyGoogleCode } from '../services/googleAuth.service.js';

// Generate JWT token
const generateToken = (userId, tokenVersion) => {
    return jwt.sign({ id: userId, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '15m'
    });
};

const googleEmailConflict = () => new GoogleAuthError(
    'GOOGLE_ACCOUNT_LINK_REQUIRED',
    409,
    'An account with this email already exists. Please use its existing sign-in method.'
);

const googleCreationUnavailable = () => new GoogleAuthError(
    'GOOGLE_AUTH_UNAVAILABLE',
    503,
    'Google sign-in is temporarily unavailable'
);

const findOrCreateGoogleUser = async (sub, email) => {
    let user = await User.findOne({ googleSub: sub }).select('+tokenVersion');
    if (user) return user;

    if (await User.exists({ email })) {
        // A concurrent request may have created this same Google account.
        user = await User.findOne({ googleSub: sub }).select('+tokenVersion');
        if (user) return user;
        throw googleEmailConflict();
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            return await User.create({
                username: `google_${randomBytes(8).toString('hex')}`,
                email,
                authProvider: 'google',
                googleSub: sub,
                role: 'user'
            });
        } catch (error) {
            if (error?.code !== 11000) throw error;

            // The unique googleSub index resolves simultaneous first sign-ins.
            user = await User.findOne({ googleSub: sub }).select('+tokenVersion');
            if (user) return user;

            if (await User.exists({ email })) throw googleEmailConflict();

            if (error.keyPattern?.username || error.keyValue?.username) {
                continue;
            }

            throw googleCreationUnavailable();
        }
    }

    throw googleCreationUnavailable();
};

// @desc    Exchange a Google popup authorization code for a MoneyMentor session
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
    try {
        const { sub, email } = await verifyGoogleCode(
            req.body.code,
            req.googleRedirectUri
        );

        const user = await findOrCreateGoogleUser(sub, email);

        // Update only lastLogin; retain the existing role and tokenVersion.
        const activeUser = await User.findOneAndUpdate(
            { _id: user._id, isActive: true },
            { $set: { lastLogin: new Date() } },
            { new: true }
        ).select('+tokenVersion');

        if (!activeUser) {
            return res.status(403).json({
                success: false,
                code: 'GOOGLE_ACCOUNT_UNAVAILABLE',
                message: 'Google sign-in is unavailable for this account'
            });
        }

        const token = generateToken(
            activeUser._id,
            activeUser.tokenVersion ?? 0
        );
        const dailyLogin = await processDailyLogin(activeUser._id, { silent: true });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: activeUser.toAuthJSON(), token, dailyLogin }
        });
    } catch (error) {
        if (error instanceof GoogleAuthError) {
            return res.status(error.status).json({
                success: false,
                code: error.code,
                message: error.message
            });
        }

        // Do not log provider errors, codes, tokens, or raw database error details.
        logger.error('Google login failed unexpectedly');
        return res.status(500).json({
            success: false,
            code: 'GOOGLE_AUTH_FAILED',
            message: 'Google sign-in could not be completed'
        });
    }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: userExists.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Create user
        const user = await User.create({
            username, 
            email, 
            password, 
            role: 'user'
        });

        // Newly created and legacy-compatible users use version 0 by default
        const effectiveTokenVersion = user.tokenVersion ?? 0;
        const token = generateToken(user._id, effectiveTokenVersion);

        const dailyLogin = await processDailyLogin(user._id, { silent: true });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: user.toAuthJSON(), token, dailyLogin }
        });
    } catch (error) {
        logger.error('Registration failed', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email include the password
        const user = await User.findOne({ email }).select('+password +tokenVersion');

        if (!user) {
            logger.warn('security.auth.login_failed', {
                email: String(email).trim().toLowerCase(),
                reason: 'no_such_user',
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.password) {
            logger.warn('security.auth.login_failed', {
                userId: user._id.toString(),
                reason: 'invalid_password',
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            logger.warn('security.auth.login_failed', {
                userId: user._id.toString(),
                reason: 'account_deactivated',
                ip: req.ip
            });
            return res.status(403).json({
                success: false,
                message: 'Account is deactivatd. Please contact administrator.'
            });
        }

        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            logger.warn('security.auth.login_failed', {
                userId: user._id.toString(),
                reason: 'invalid_password',
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Existing documents without tokenVersion are treated as version 0
        const effectiveTokenVersion = user.tokenVersion ?? 0;
        const token = generateToken(user._id, effectiveTokenVersion);

        // process daily login reward - silent mode so gamification errors never block auth
        const dailyLogin = await processDailyLogin(user._id, { silent: true });

        logger.info('security.auth.login_success', {
            userId: user._id.toString(),
            ip: req.ip
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: user.toAuthJSON(), token, dailyLogin }
        });
    } catch (error) {
        logger.error('Login failed', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({ success: true, data: user.toAuthJSON() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;

        // Check if username/email taken by another user
        if (email || username) {
            const exisitingUser = await User.findOne({
                _id: { $ne: req.user._id},
                $or: [
                    ...(email ? [{ email }] : []),
                    ...(username ? [{ username }] : [])
                ]  
            });

            if (exisitingUser) {
                return res.status(400).json({
                    success: false,
                    message: exisitingUser.email === email ? 'Email already in use' : 'Username already taken'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                ...(username && { username }),
                ...(email && { email })
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        logger.error('Failed to update profile', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};


// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 1. Select both fields required for password verification and revocation
        const user = await User.findById(req.user._id).select('+password +tokenVersion');

        if (!user) {
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Session is no longer valid'
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                code: 'PASSWORD_CHANGE_UNAVAILABLE',
                message: 'Password change is unavailable for this account'
            });
        }
        
        // 2. Verify the current password
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const effectiveTokenVersion = user.tokenVersion ?? 0;

        // 3. Assign the new password so the exisiting pre-save hook hashes it
        user.password = newPassword;

        // 4. Increment the revocation version
        user.tokenVersion = effectiveTokenVersion + 1;

        // Prevent this save from overwriting a concurrent logout/version change.
        // The version-0 condition also matches legacy documents with no field.
        user.$where = effectiveTokenVersion === 0
            ? {
                $or: [
                    { tokenVersion: 0 },
                    { tokenVersion: { $exists: false } }
                ]
            }
            : { tokenVersion: effectiveTokenVersion };

        // 5. Persist the hashed password and incremented version together
        try {
            await user.save();
        } finally {
            delete user.$where;
        }

        // 6. Issue one replacement token containing the persisted new version
        const token = generateToken(user._id, user.tokenVersion);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            data: { user: user.toAuthJSON(), token }
        });
    } catch (error) {
        logger.error('Failed to change password', error);

        if (error.name === 'DocumentNotFoundError') {
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Session changed while updating the password. Please sign in again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};


// @desc    Logout user
// @route   PUT /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
    try {
        const result = await User.updateOne(
            {
                _id: req.user._id,
                isActive: true
            },
            {
                $inc: { tokenVersion: 1 }
            }
        );

        if (result.matchedCount !== 1) {
            return res.status(401).json({
                success: false,
                code: 'AUTH_SESSION_INVALID',
                message: 'Session is no longer valid'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Logout successfully'
        });
    } catch (error) {
        logger.error('Logout failed', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};
