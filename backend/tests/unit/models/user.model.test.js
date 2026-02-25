import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../../models/user.model.js';

describe('User Model - Unit Tests', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    describe('toAuthJSON method', () => {
        it('should return correct fields', () => {
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
            expect(authJSON).toHaveProperty('isActive', true);
            expect(authJSON).toHaveProperty('createdAt');
            expect(authJSON).toHaveProperty('lastLogin');
        });

        it('should not include password', () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword'
            });

            const authJSON = user.toAuthJSON();
            expect(authJSON).not.toHaveProperty('password');
        });

        it('should include lastLogin when set', () => {
            const lastLogin = new Date();
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                lastLogin
            });

            expect(user.toAuthJSON().lastLogin).toEqual(lastLogin);
        });

        it('should return admin role correctly', () => {
            const user = new User({
                username: 'adminuser',
                email: 'admin@example.com',
                password: 'hashedpassword',
                role: 'admin'
            });

            expect(user.toAuthJSON().role).toBe('admin');
        });

        it('should return id matching _id', () => {
            const user = new User({
                _id: mockUserId,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword'
            });

            expect(user.toAuthJSON().id.toString()).toBe(mockUserId.toString());
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

        it('should return false for empty string', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Test123!', salt);

            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword
            });

            const result = await user.comparePassword('');
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

        it('should default lastLogin to undefined', () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });
            expect(user.lastLogin).toBeUndefined();
        });
    });

    
    describe('field assignments', () => {
        it('should assign username correctly', () => {
            const user = new User({
                username: 'john_doe',
                email: 'john@example.com',
                password: 'Test123!'
            });
            expect(user.username).toBe('john_doe');
        });

        it('should convert email to lowercase', () => {
            const user = new User({
                username: 'testuser',
                email: 'TEST@EXAMPLE.COM',
                password: 'Test123!'
            });
            expect(user.email).toBe('test@example.com');
        });

        it('should allow setting isActive to false', () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!',
                isActive: false
            });
            expect(user.isActive).toBe(false);
        });

        it('should allow setting admin role', () => {
            const user = new User({
                username: 'adminuser',
                email: 'admin@example.com',
                password: 'Test123!',
                role: 'admin'
            });
            expect(user.role).toBe('admin');
        });

        it('should store lastLogin date when set', () => {
            const loginDate = new Date('2025-01-01');
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!',
                lastLogin: loginDate
            });
            expect(user.lastLogin).toEqual(loginDate);
        });
    });
});