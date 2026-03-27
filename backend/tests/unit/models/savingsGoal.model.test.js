import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import SavingsGoal from '../../../models/savingsGoal.model.js';

describe('SavingsGoal Model - Unit Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId();

  // Default values
  describe('default values', () => {
    it('should have timestamps (createdAt and updatedAt)', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '2024-01',
      });
      expect(goal.schema.paths.createdAt).toBeDefined();
      expect(goal.schema.paths.updatedAt).toBeDefined();
    });
  });

  // Required fields
  describe('required fields validation', () => {
    it('should require userId', () => {
      const goal = new SavingsGoal({
        monthlyGoal: 5000,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error.errors.userId).toBeDefined();
    });

    it('should require monthlyGoal', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error.errors.monthlyGoal).toBeDefined();
    });

    it('should require month', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
      });
      const error = goal.validateSync();
      expect(error.errors.month).toBeDefined();
    });
  });

  // monthlyGoal field validation
  describe('monthlyGoal field validation', () => {
    it('should accept a valid positive monthlyGoal', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept the minimum valid amount of 0.01', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 0.01,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject a monthlyGoal of 0', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 0,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error.errors.monthlyGoal).toBeDefined();
    });

    it('should reject a negative monthlyGoal', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: -500,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error.errors.monthlyGoal).toBeDefined();
    });

    it('should accept a large monthlyGoal', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 1000000,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error).toBeUndefined();
    });
  });

  // month field validation
  describe('month field validation', () => {
    it('should accept a valid month in YYYY-MM format', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept December (2024-12) as a valid month', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '2024-12',
      });
      const error = goal.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject month without leading zero (2024-1)', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '2024-1',
      });
      const error = goal.validateSync();
      expect(error.errors.month).toBeDefined();
    });

    it('should reject month in MM-YYYY format', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '01-2024',
      });
      const error = goal.validateSync();
      expect(error.errors.month).toBeDefined();
    });

    it('should reject a plain year string', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '2024',
      });
      const error = goal.validateSync();
      expect(error.errors.month).toBeDefined();
    });

    it('should reject a free-text month string', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: 'January 2024',
      });
      const error = goal.validateSync();
      expect(error.errors.month).toBeDefined();
    });
  });

  // Valid goal creation
  describe('valid savings goal creation', () => {
    it('should create a valid savings goal with all fields', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 10000,
        month: '2024-06',
      });
      const error = goal.validateSync();
      expect(error).toBeUndefined();
    });

    it('should store userId as an ObjectId reference', () => {
      const goal = new SavingsGoal({
        userId: mockUserId,
        monthlyGoal: 5000,
        month: '2024-01',
      });
      expect(goal.userId).toEqual(mockUserId);
    });

    it('should reject an invalid ObjectId for userId', () => {
      const goal = new SavingsGoal({
        userId: 'not-a-valid-id',
        monthlyGoal: 5000,
        month: '2024-01',
      });
      const error = goal.validateSync();
      expect(error.errors.userId).toBeDefined();
    });
  });

  // Indexes
  describe('indexes', () => {
    it('should have a compound unique index on userId and month', () => {
      const indexes = SavingsGoal.schema.indexes();
      const hasCompoundIndex = indexes.some(
        ([fields]) => fields.userId !== undefined && fields.month !== undefined
      );
      expect(hasCompoundIndex).toBe(true);
    });

    it('should have the compound index set as unique', () => {
      const indexes = SavingsGoal.schema.indexes();
      const compoundIndex = indexes.find(
        ([fields]) => fields.userId !== undefined && fields.month !== undefined
      );
      expect(compoundIndex[1].unique).toBe(true);
    });
  });
});