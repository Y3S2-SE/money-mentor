import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../../models/user.model.js';

describe('User Model - Unit Tests', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    describe('toAuthJSON method', () => {
        it('should return user data without password', () => {
            const user = new User({
                _id: mockUserId,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                role: 'user',
                isActive: true
            });

            const authJSON = user.toAuthJSON();

            expect(authJSON).toHaveProperty('id');
            expect(authJSON).toHaveProperty('username', 'testuser');
            expect(authJSON).toHaveProperty('email', 'test@example.com');
            expect(authJSON).toHaveProperty('role', 'user');
            expect(authJSON).not.toHaveProperty('password');
        });

        it('should include lastLogin if set', () => {
            const lastLogin = new Date();
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                lastLogin
            });

            const authJSON = user.toAuthJSON();
            expect(authJSON.lastLogin).toEqual(lastLogin);
        });

        it('should return correct role', () => {
            const user = new User({
                username: 'adminuser',
                email: 'admin@example.com',
                password: 'hashedpassword',
                role: 'admin'
            });

            expect(user.toAuthJSON().role).toBe('admin');
        });
    });

    describe('comparePassword method', () => {
        it('should return true for correct password', async () => {
            const plainPassword = 'Test123!';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(plainPassword, salt);

            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword
            });

            const result = await user.comparePassword(plainPassword);
            expect(result).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Test123!', salt);

            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword
            });

            const result = await user.comparePassword('WrongPassword!');
            expect(result).toBe(false);
        });

        it('should be case sensitive', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Test123!', salt);

            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword
            });

            const result = await user.comparePassword('test123!');
            expect(result).toBe(false);
        });
    });

    describe('default values', () => {
        it('should default role to user', () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });
            expect(user.role).toBe('user');
        });

        it('should default isActive to true', () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });
            expect(user.isActive).toBe(true);
        });
    });
});