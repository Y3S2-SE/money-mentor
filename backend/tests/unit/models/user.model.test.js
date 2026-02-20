import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import User from '../../../models/user.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup/testSetup.js';

describe('User Model Unit Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      };

      const user = await User.create(userData);

      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Password should be hashed
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
    });

    it('should fail without required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail without username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail without email', async () => {
      const userData = {
        username: 'testuser',
        password: 'Test123!'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail without password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Test123!'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'Test123!'
      };

      await User.create(userData);
      
      await expect(
        User.create({ ...userData, email: 'test2@example.com' })
      ).rejects.toThrow();
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'Test123!'
      };

      await User.create(userData);
      
      await expect(
        User.create({ ...userData, username: 'testuser2' })
      ).rejects.toThrow();
    });

    it('should fail with username shorter than 3 characters', async () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'Test123!'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with username longer than 30 characters', async () => {
      const userData = {
        username: 'a'.repeat(31),
        email: 'test@example.com',
        password: 'Test123!'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should trim whitespace from username', async () => {
      const userData = {
        username: '  testuser  ',
        email: 'test@example.com',
        password: 'Test123!'
      };

      const user = await User.create(userData);
      expect(user.username).toBe('testuser');
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password: 'Test123!'
      };

      const user = await User.create(userData);
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const password = 'Test123!';
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password
      });

      const savedUser = await User.findById(user._id).select('+password');
      expect(savedUser.password).not.toBe(password);
      expect(savedUser.password.length).toBeGreaterThan(20);
      //expect(savedUser.password.startsWith('$2a$')).toBe(true); // bcrypt hash format
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      const savedUser = await User.findById(user._id).select('+password');
      const hashedPassword = savedUser.password;
      
      savedUser.username = 'updateduser';
      await savedUser.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).toBe(hashedPassword);
    });

    it('should rehash password if password is modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      const savedUser = await User.findById(user._id).select('+password');
      const originalHash = savedUser.password;
      
      savedUser.password = 'NewTest123!';
      await savedUser.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).not.toBe(originalHash);
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare valid password', async () => {
      const password = 'Test123!';
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password
      });

      const savedUser = await User.findById(user._id).select('+password');
      const isMatch = await savedUser.comparePassword(password);

      expect(isMatch).toBe(true);
    });

    it('should reject invalid password', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      const savedUser = await User.findById(user._id).select('+password');
      const isMatch = await savedUser.comparePassword('WrongPassword');

      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive for password comparison', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      const savedUser = await User.findById(user._id).select('+password');
      const isMatch = await savedUser.comparePassword('test123!');

      expect(isMatch).toBe(false);
    });
  });

  describe('toAuthJSON Method', () => {
    it('should return user data without password', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      const authJSON = user.toAuthJSON();

      expect(authJSON).toHaveProperty('id');
      expect(authJSON).toHaveProperty('username', 'testuser');
      expect(authJSON).toHaveProperty('email', 'test@example.com');
      expect(authJSON).toHaveProperty('role', 'user');
      expect(authJSON).toHaveProperty('isActive', true);
      expect(authJSON).toHaveProperty('createdAt');
      expect(authJSON).not.toHaveProperty('password');
    });

    it('should include lastLogin if set', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!',
        lastLogin: new Date()
      });

      const authJSON = user.toAuthJSON();
      expect(authJSON).toHaveProperty('lastLogin');
    });
  });

  describe('User Role', () => {
    it('should default to user role', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      expect(user.role).toBe('user');
    });

    it('should allow admin role', async () => {
      const user = await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'Test123!',
        role: 'admin'
      });

      expect(user.role).toBe('admin');
    });

    it('should reject invalid role', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!',
        role: 'superuser'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Status', () => {
    it('should default isActive to true', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      expect(user.isActive).toBe(true);
    });

    it('should allow setting isActive to false', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!',
        isActive: false
      });

      expect(user.isActive).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt timestamp', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically add updatedAt timestamp', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      expect(user.updatedAt).toBeDefined();
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      user.username = 'updateduser';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});