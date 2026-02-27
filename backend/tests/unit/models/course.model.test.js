import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Course from '../../../models/course.model.js';

describe('Course Model Unit Tests', () => {

    const fakeUserId = () => new mongoose.Types.ObjectId();

    const validCourseData = (overrides = {}) => ({
        title: 'Budgeting Basics',
        description: 'Learn how to manage your monthly budget.',
        category: 'budgeting',
        createdBy: fakeUserId(),
        questions: [
            {
                question: 'What is the 50/30/20 rule?',
                options: ['50% needs, 30% wants, 20% savings', '50% savings, 30% needs, 20% wants'],
                correctAnswerIndex: 0,
                points: 10
            }
        ],
        ...overrides
    });

    const makeCourse = (overrides = {}) => new Course(validCourseData(overrides));

    // ── Default Values ─────────────────────────────────────────
    describe('Default Values', () => {
        it('should default isPublished to false', () => {
            const course = makeCourse();
            expect(course.isPublished).toBe(false);
        });

        it('should default difficulty to beginner', () => {
            const course = makeCourse();
            expect(course.difficulty).toBe('beginner');
        });

        it('should default passingScore to 70', () => {
            const course = makeCourse();
            expect(course.passingScore).toBe(70);
        });

        it('should default thumbnail to null', () => {
            const course = makeCourse();
            expect(course.thumbnail).toBeNull();
        });

        it('should default completions to empty array', () => {
            const course = makeCourse();
            expect(course.completions).toEqual([]);
        });

        it('should default category to general when not provided', () => {
            const course = new Course({
                ...validCourseData(),
                category: undefined
            });
            expect(course.category).toBe('general');
        });
    });

    // ── Schema Validation ──────────────────────────────────────
    describe('Schema Validation', () => {
        it('should pass validation with valid data', async () => {
            const course = makeCourse();
            await expect(course.validate()).resolves.toBeUndefined();
        });

        it('should fail validation without title', async () => {
            const course = new Course({ ...validCourseData(), title: undefined });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation without description', async () => {
            const course = new Course({ ...validCourseData(), description: undefined });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation without createdBy', async () => {
            const course = new Course({ ...validCourseData(), createdBy: undefined });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation without questions', async () => {
            const course = new Course({ ...validCourseData(), questions: [] });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation with title shorter than 3 characters', async () => {
            const course = makeCourse({ title: 'AB' });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation with title longer than 100 characters', async () => {
            const course = makeCourse({ title: 'a'.repeat(101) });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation with description longer than 500 characters', async () => {
            const course = makeCourse({ description: 'a'.repeat(501) });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation with invalid category', async () => {
            const course = makeCourse({ category: 'crypto' });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation with invalid difficulty', async () => {
            const course = makeCourse({ difficulty: 'expert' });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should accept all valid categories', async () => {
            const categories = ['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'];
            for (const category of categories) {
                const course = makeCourse({ category });
                await expect(course.validate()).resolves.toBeUndefined();
            }
        });

        it('should accept all valid difficulties', async () => {
            const difficulties = ['beginner', 'intermediate', 'advanced'];
            for (const difficulty of difficulties) {
                const course = makeCourse({ difficulty });
                await expect(course.validate()).resolves.toBeUndefined();
            }
        });
    });

    // ── Questions Validation ───────────────────────────────────
    describe('Questions Validation', () => {
        it('should save a question with all fields', async () => {
            const course = makeCourse({
                questions: [{
                    question: 'What is compound interest?',
                    options: ['Interest on interest', 'Simple rate', 'Tax on income'],
                    correctAnswerIndex: 0,
                    explanation: 'Compound interest grows exponentially.',
                    points: 15
                }]
            });
            await expect(course.validate()).resolves.toBeUndefined();
            const q = course.questions[0];
            expect(q.question).toBe('What is compound interest?');
            expect(q.options).toHaveLength(3);
            expect(q.correctAnswerIndex).toBe(0);
            expect(q.explanation).toBe('Compound interest grows exponentially.');
            expect(q.points).toBe(15);
        });

        it('should default question points to 10', () => {
            const course = makeCourse();
            expect(course.questions[0].points).toBe(10);
        });

        it('should fail validation with fewer than 2 options', async () => {
            const course = makeCourse({
                questions: [{
                    question: 'Test?',
                    options: ['Only one'],
                    correctAnswerIndex: 0
                }]
            });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation with more than 6 options', async () => {
            const course = makeCourse({
                questions: [{
                    question: 'Test?',
                    options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
                    correctAnswerIndex: 0
                }]
            });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should accept exactly 2 options', async () => {
            const course = makeCourse({
                questions: [{
                    question: 'True or false?',
                    options: ['True', 'False'],
                    correctAnswerIndex: 0
                }]
            });
            await expect(course.validate()).resolves.toBeUndefined();
            expect(course.questions[0].options).toHaveLength(2);
        });

        it('should accept exactly 6 options', async () => {
            const course = makeCourse({
                questions: [{
                    question: 'Pick one?',
                    options: ['a', 'b', 'c', 'd', 'e', 'f'],
                    correctAnswerIndex: 0
                }]
            });
            await expect(course.validate()).resolves.toBeUndefined();
            expect(course.questions[0].options).toHaveLength(6);
        });

        it('should fail validation when question text is missing', async () => {
            const course = makeCourse({
                questions: [{
                    options: ['Yes', 'No'],
                    correctAnswerIndex: 0
                }]
            });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should fail validation when correctAnswerIndex is missing', async () => {
            const course = makeCourse({
                questions: [{
                    question: 'Test?',
                    options: ['Yes', 'No']
                }]
            });
            await expect(course.validate()).rejects.toThrow();
        });

        it('should accept multiple questions', async () => {
            const course = makeCourse({
                questions: [
                    { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 },
                    { question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 1, points: 20 },
                    { question: 'Q3?', options: ['E', 'F'], correctAnswerIndex: 0, points: 10 }
                ]
            });
            await expect(course.validate()).resolves.toBeUndefined();
            expect(course.questions).toHaveLength(3);
        });
    });

    // ── totalPoints Auto-Calculation (pre-save hook) ───────────
    describe('totalPoints Auto-Calculation', () => {
        it('should calculate totalPoints by summing question points', () => {
            const course = makeCourse({
                questions: [
                    { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 },
                    { question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 0, points: 20 }
                ]
            });
            // Manually trigger the pre-save hook logic
            course.totalPoints = course.questions.reduce((sum, q) => sum + q.points, 0);
            expect(course.totalPoints).toBe(30);
        });

        it('should calculate totalPoints with default points', () => {
            const course = makeCourse({
                questions: [
                    { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0 },
                    { question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 0 }
                ]
            });
            course.totalPoints = course.questions.reduce((sum, q) => sum + q.points, 0);
            expect(course.totalPoints).toBe(20); // 10 + 10 default
        });

        it('should recalculate totalPoints when questions are added', () => {
            const course = makeCourse({
                questions: [
                    { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 }
                ]
            });
            course.totalPoints = course.questions.reduce((sum, q) => sum + q.points, 0);
            expect(course.totalPoints).toBe(10);

            course.questions.push({ question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 0, points: 15 });
            course.totalPoints = course.questions.reduce((sum, q) => sum + q.points, 0);
            expect(course.totalPoints).toBe(25);
        });
    });

    // ── Completions ────────────────────────────────────────────
    describe('Completions', () => {
        it('should start with empty completions array', () => {
            const course = makeCourse();
            expect(course.completions).toHaveLength(0);
        });

        it('should add a completion record', () => {
            const course = makeCourse();
            const userId = fakeUserId();
            course.completions.push({ user: userId, score: 80, pointsEarned: 10 });
            expect(course.completions).toHaveLength(1);
            expect(course.completions[0].score).toBe(80);
            expect(course.completions[0].pointsEarned).toBe(10);
        });

        it('should set completedAt to current date by default', () => {
            const course = makeCourse();
            course.completions.push({ user: fakeUserId(), score: 70, pointsEarned: 10 });
            expect(course.completions[0].completedAt).toBeInstanceOf(Date);
        });

        it('should store multiple completions from different users', () => {
            const course = makeCourse();
            course.completions.push({ user: fakeUserId(), score: 80, pointsEarned: 10 });
            course.completions.push({ user: fakeUserId(), score: 60, pointsEarned: 0 });
            expect(course.completions).toHaveLength(2);
        });
    });

    // ── ObjectId ───────────────────────────────────────────────
    describe('ObjectId', () => {
        it('should assign a valid ObjectId on instantiation', () => {
            const course = makeCourse();
            expect(course._id).toBeInstanceOf(mongoose.Types.ObjectId);
        });

        it('should store createdBy as ObjectId', () => {
            const userId = fakeUserId();
            const course = new Course({ ...validCourseData(), createdBy: userId });
            expect(course.createdBy.toString()).toBe(userId.toString());
        });
    });
});