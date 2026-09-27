// IT23218512 - hotfix/vuln-6

import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minLength: [3, 'Username must be at least 3 characters'],
            maxLength: [30, 'Username cannot exceed 30 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+$/, 'Please provide a valid email address']
        },
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local'
        },
        googleSub: {
            type: String,
            trim: true,
            select: false
        },
        password: {
            type: String,
            required: [
                function () { return this.authProvider !== 'google'; },
                'Password is required'
            ],
            minLength: [6, 'Password must be at least 6 characters'],
            select: false
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        tokenVersion: {
            type: Number,
            default: 0,
            min: 0,
            select: false
        },
        // vuln-6: per-account login lockout state.
        // Counts wrong passwords and blocks login until lockUntil after too many failures.
        failedLoginAttempts: {
            type: Number,
            default: 0,
            min: 0,
            select: false
        },
        lockUntil: {
            type: Date,
            default: null,
            select: false
        },
        lastLogin: {
            type: Date
        },
    },
    {
        timestamps: true
    }
);

userSchema.index(
    { googleSub: 1 },
    { unique: true, partialFilterExpression: { googleSub: { $type: 'string' } } }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);

    this.password = hashedPassword;
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Return user data without sensitive info
userSchema.methods.toAuthJSON = function () {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

export default User;
