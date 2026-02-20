import User from "../models/user.model.js";
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

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
            username, email, password, role: role || 'user'
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: user.toAuthJSON(), token }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
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
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivatd. Please contact administrator.'
            });
        }

        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token 
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user: user.toAuthJSON(), token }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};


// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        // Generate new token for automatic re-login
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            data: { user: user.toAuthJSON(), token }
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: 'Failed to change password',
            error: error.message
        });
    }
};


// @desc    Logout user
// @route   PUT /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logout successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};