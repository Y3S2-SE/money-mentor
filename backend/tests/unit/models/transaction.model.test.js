import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Transaction from '../../../models/transaction.model.js';

describe('Transaction Model - Unit Tests', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    describe('default values', () => {
        it('should default description to empty string', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 500,
                category: 'Food',
                date: new Date(),
            });
            expect(transaction.description).toBe('');
        });

        it('should have timestamps (createdAt and updatedAt)', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'income',
                amount: 1000,
                category: 'Salary',
                date: new Date(),
            });
            expect(transaction.schema.paths.createdAt).toBeDefined();
            expect(transaction.schema.paths.updatedAt).toBeDefined();
        });
    });

    describe('required fields validation', () => {
        it('should require userId', async () => {
            const transaction = new Transaction({
                type: 'expense',
                amount: 500,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error.errors.userId).toBeDefined();
        });

        it('should require type', async () => {
            const transaction = new Transaction({
                userId: mockUserId,
                amount: 500,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error.errors.type).toBeDefined();
        });

        it('should require amount', async () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error.errors.amount).toBeDefined();
        });

        it('should require category', async () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 500,
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error.errors.category).toBeDefined();
        });

        it('should require date', async () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 500,
                category: 'Food',
            });
            const error = transaction.validateSync();
            expect(error.errors.date).toBeDefined();
        });
    });

    describe('type field validation', () => {
        it('should accept income as a valid type', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'income',
                amount: 1000,
                category: 'Salary',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error).toBeUndefined();
        });

        it('should accept expense as a valid type', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 500,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error).toBeUndefined();
        });

        it('should reject invalid type', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'savings',
                amount: 500,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error.errors.type).toBeDefined();
        });
    });

    describe('amount field validation', () => {
        it('should reject amount of 0', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 0,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error.errors.amount).toBeDefined();
        });

        it('should reject negative amount', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: -100,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error.errors.amount).toBeDefined();
        });

        it('should accept positive amount', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 0.01,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error).toBeUndefined();
        });

        it('should accept large amount', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'income',
                amount: 1000000,
                category: 'Salary',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error).toBeUndefined();
        });
    });

    describe('valid transaction creation', () => {
        it('should create a valid income transaction', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'income',
                amount: 50000,
                category: 'Salary',
                description: 'Monthly salary',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error).toBeUndefined();
        });

        it('should create a valid expense transaction', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 1500,
                category: 'Transport',
                description: 'Bus pass',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error).toBeUndefined();
        });

        it('should create a valid transaction without description', () => {
            const transaction = new Transaction({
                userId: mockUserId,
                type: 'expense',
                amount: 500,
                category: 'Food',
                date: new Date(),
            });
            const error = transaction.validateSync();
            expect(error).toBeUndefined();
        });
    });

    describe('indexes', () => {
        it('should have index on userId', () => {
            const indexes = Transaction.schema.indexes();
            const hasUserIdIndex = indexes.some(
                ([fields]) => fields.userId !== undefined
            );
            expect(hasUserIdIndex).toBe(true);
        });

        it('should have index on date', () => {
            const indexes = Transaction.schema.indexes();
            const hasDateIndex = indexes.some(
                ([fields]) => fields.date !== undefined
            );
            expect(hasDateIndex).toBe(true);
        });

        it('should have compound index on userId and date', () => {
            const indexes = Transaction.schema.indexes();
            const hasCompoundIndex = indexes.some(
                ([fields]) => fields.userId !== undefined && fields.date !== undefined
            );
            expect(hasCompoundIndex).toBe(true);
        });
    });
});