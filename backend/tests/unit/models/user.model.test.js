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
                password: 'hashedpassword',
                tokenVersion: 7
            });

            const authJSON = user.toAuthJSON();
            expect(authJSON).not.toHaveProperty('password');
            expect(authJSON).not.toHaveProperty('tokenVersion');
        });

        it('does not expose Google identity or provider fields', () => {
            const user = new User({
                username: 'google_user',
                email: 'google@example.com',
                authProvider: 'google',
                googleSub: 'google-sub-123'
            });

            expect(user.toAuthJSON()).not.toHaveProperty('googleSub');
            expect(user.toAuthJSON()).not.toHaveProperty('authProvider');
            expect(user.toAuthJSON()).not.toHaveProperty('tokenVersion');
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
        it('defaults new and legacy users to the local provider', () => {
            const user = new User({
                username: 'localuser',
                email: 'local@example.com',
                password: 'Test123!'
            });
            const legacy = User.hydrate({
                _id: new mongoose.Types.ObjectId(),
                username: 'legacyuser',
                email: 'legacy@example.com',
                password: 'stored-hash'
            });

            expect(user.authProvider).toBe('local');
            expect(legacy.authProvider).toBe('local');
            expect(legacy.toObject()).toHaveProperty('authProvider', 'local');
        });

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

        it('should default tokenVersion to 0', () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!'
            });
            expect(user.tokenVersion).toBe(0);
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
        it('requires a password for local accounts', () => {
            const user = new User({
                username: 'localuser',
                email: 'local@example.com'
            });

            expect(user.validateSync().errors.password).toBeDefined();
        });

        it('allows a Google account without a password and compares safely', async () => {
            const user = new User({
                username: 'google_user',
                email: 'google@example.com',
                authProvider: 'google',
                googleSub: 'google-sub-123'
            });

            await expect(user.validate()).resolves.toBeUndefined();
            await expect(user.comparePassword('anything')).resolves.toBe(false);
        });

        it('declares a partial unique index and hides googleSub in ordinary queries', () => {
            const index = User.schema.indexes().find(([fields]) => fields.googleSub === 1);

            expect(index?.[1]).toMatchObject({
                unique: true,
                partialFilterExpression: { googleSub: { $type: 'string' } }
            });
            expect(User.schema.path('googleSub').options.select).toBe(false);
        });

        it('should reject a negative tokenVersion', () => {
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!',
                tokenVersion: -1
            });

            expect(user.validateSync().errors.tokenVersion.kind).toBe('min');
        });

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
