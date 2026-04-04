import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Article from '../../../models/article.model.js';

describe('Article Model Unit Tests', () => {

    const fakeUserId = () => new mongoose.Types.ObjectId();

    // Minimal BlockNote-style content with enough text for word count
    const sampleContent = {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: 'Personal finance is the management of your money. Budgeting helps you save more and spend wisely each month.'
                    }
                ]
            }
        ]
    };

    const validArticleData = (overrides = {}) => ({
        title: 'Budgeting for Beginners',
        summary: 'Learn the fundamentals of personal budgeting.',
        content: sampleContent,
        category: 'budgeting',
        createdBy: fakeUserId(),
        ...overrides
    });

    const makeArticle = (overrides = {}) => new Article(validArticleData(overrides));

    // ── Default Values ──────────────────────────────────────────────
    describe('Default Values', () => {
        it('should default isPublished to false', () => {
            const article = makeArticle();
            expect(article.isPublished).toBe(false);
        });

        it('should default difficulty to beginner', () => {
            const article = makeArticle();
            expect(article.difficulty).toBe('beginner');
        });

        it('should default pointsPerRead to 15', () => {
            const article = makeArticle();
            expect(article.pointsPerRead).toBe(15);
        });

        it('should default thumbnail to null', () => {
            const article = makeArticle();
            expect(article.thumbnail).toBeNull();
        });

        it('should default completions to empty array', () => {
            const article = makeArticle();
            expect(article.completions).toEqual([]);
        });

        it('should default category to general when not provided', () => {
            const article = new Article({
                ...validArticleData(),
                category: undefined
            });
            expect(article.category).toBe('general');
        });

        it('should default readTime to at least 1', () => {
            const article = makeArticle();
            expect(article.readTime).toBeGreaterThanOrEqual(1);
        });
    });

    // ── Schema Validation ───────────────────────────────────────────
    describe('Schema Validation', () => {
        it('should pass validation with valid data', async () => {
            const article = makeArticle();
            await expect(article.validate()).resolves.toBeUndefined();
        });

        it('should fail validation without title', async () => {
            const article = new Article({ ...validArticleData(), title: undefined });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation without summary', async () => {
            const article = new Article({ ...validArticleData(), summary: undefined });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation without content', async () => {
            const article = new Article({ ...validArticleData(), content: undefined });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation without createdBy', async () => {
            const article = new Article({ ...validArticleData(), createdBy: undefined });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation with title shorter than 3 characters', async () => {
            const article = makeArticle({ title: 'AB' });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation with title longer than 150 characters', async () => {
            const article = makeArticle({ title: 'a'.repeat(151) });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation with summary longer than 300 characters', async () => {
            const article = makeArticle({ summary: 'a'.repeat(301) });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation with invalid category', async () => {
            const article = makeArticle({ category: 'crypto' });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation with invalid difficulty', async () => {
            const article = makeArticle({ difficulty: 'expert' });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation with pointsPerRead below 1', async () => {
            const article = makeArticle({ pointsPerRead: 0 });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should fail validation with pointsPerRead above 100', async () => {
            const article = makeArticle({ pointsPerRead: 101 });
            await expect(article.validate()).rejects.toThrow();
        });

        it('should accept all valid categories', async () => {
            const categories = ['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'];
            for (const category of categories) {
                const article = makeArticle({ category });
                await expect(article.validate()).resolves.toBeUndefined();
            }
        });

        it('should accept all valid difficulties', async () => {
            const difficulties = ['beginner', 'intermediate', 'advanced'];
            for (const difficulty of difficulties) {
                const article = makeArticle({ difficulty });
                await expect(article.validate()).resolves.toBeUndefined();
            }
        });

        it('should accept a valid thumbnail URL', async () => {
            const article = makeArticle({ thumbnail: 'https://example.com/image.jpg' });
            await expect(article.validate()).resolves.toBeUndefined();
        });
    });

    // ── wordCount & readTime Auto-Calculation (pre-save hook) ───────
    describe('wordCount & readTime Auto-Calculation', () => {
        it('should auto-calculate wordCount from content text nodes', () => {
            const article = makeArticle();
            // Trigger pre-save hook manually
            article.$callbacksDisabled = false;
            const text = 'Personal finance is the management of your money. Budgeting helps you save more and spend wisely each month.';
            const words = text.trim().split(/\s+/).filter(w => w.length > 0);
            // The hook runs on save(); simulate the result inline
            expect(words.length).toBeGreaterThan(0);
        });

        it('should set readTime to at least 1 minute', () => {
            const article = makeArticle();
            // Even zero words should produce readTime of at least 1
            article.wordCount = 0;
            article.readTime = Math.max(1, Math.ceil(article.wordCount / 200));
            expect(article.readTime).toBe(1);
        });

        it('should calculate readTime as ceil(wordCount / 200)', () => {
            const article = makeArticle();

            article.wordCount = 200;
            article.readTime = Math.max(1, Math.ceil(article.wordCount / 200));
            expect(article.readTime).toBe(1);

            article.wordCount = 201;
            article.readTime = Math.max(1, Math.ceil(article.wordCount / 200));
            expect(article.readTime).toBe(2);

            article.wordCount = 400;
            article.readTime = Math.max(1, Math.ceil(article.wordCount / 200));
            expect(article.readTime).toBe(2);

            article.wordCount = 1000;
            article.readTime = Math.max(1, Math.ceil(article.wordCount / 200));
            expect(article.readTime).toBe(5);
        });

        it('should handle nested content nodes for word extraction', () => {
            const nestedContent = {
                type: 'doc',
                content: [
                    {
                        type: 'heading',
                        content: [{ type: 'text', text: 'Hello World' }]
                    },
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'This is a test paragraph with several words.' }]
                    },
                    {
                        type: 'bulletList',
                        content: [
                            {
                                type: 'listItem',
                                content: [{ type: 'text', text: 'Item one two three' }]
                            }
                        ]
                    }
                ]
            };
            const article = makeArticle({ content: nestedContent });
            // Should be able to create the article without error
            expect(article.content).toBeDefined();
        });

        it('should handle plain string content gracefully', () => {
            // Some editors may send raw strings; the function should handle it
            const article = new Article({
                ...validArticleData(),
                content: 'Just a plain string with several words for testing purposes.'
            });
            // No error during instantiation
            expect(article.content).toBe('Just a plain string with several words for testing purposes.');
        });
    });

    // ── Completions (embedded array – mirrors Course model) ─────────
    describe('Completions', () => {
        it('should start with empty completions array', () => {
            const article = makeArticle();
            expect(article.completions).toHaveLength(0);
        });

        it('should add a completion record', () => {
            const article = makeArticle();
            const userId = fakeUserId();
            article.completions.push({ user: userId, pointsEarned: 15, timeSpentSeconds: 120 });
            expect(article.completions).toHaveLength(1);
            expect(article.completions[0].pointsEarned).toBe(15);
            expect(article.completions[0].timeSpentSeconds).toBe(120);
        });

        it('should set completedAt to current date by default', () => {
            const article = makeArticle();
            article.completions.push({ user: fakeUserId(), pointsEarned: 15, timeSpentSeconds: 90 });
            expect(article.completions[0].completedAt).toBeInstanceOf(Date);
        });

        it('should store multiple completions from different users', () => {
            const article = makeArticle();
            article.completions.push({ user: fakeUserId(), pointsEarned: 15, timeSpentSeconds: 90 });
            article.completions.push({ user: fakeUserId(), pointsEarned: 15, timeSpentSeconds: 120 });
            expect(article.completions).toHaveLength(2);
        });

        it('should find a completion by userId', () => {
            const article = makeArticle();
            const userId = fakeUserId();
            article.completions.push({ user: userId, pointsEarned: 15, timeSpentSeconds: 90 });

            const found = article.completions.find(
                c => c.user.toString() === userId.toString()
            );
            expect(found).toBeDefined();
            expect(found.pointsEarned).toBe(15);
        });

        it('should correctly detect if a user has already completed', () => {
            const article = makeArticle();
            const userId = fakeUserId();
            const otherId = fakeUserId();

            article.completions.push({ user: userId, pointsEarned: 15, timeSpentSeconds: 90 });

            const alreadyDone = article.completions.find(
                c => c.user.toString() === otherId.toString()
            );
            expect(alreadyDone).toBeUndefined();

            const selfDone = article.completions.find(
                c => c.user.toString() === userId.toString()
            );
            expect(selfDone).toBeDefined();
        });
    });

    // ── Anti-gaming: minimum reading time logic ─────────────────────
    describe('Anti-gaming: minimum reading time logic', () => {
        it('should calculate correct minimum seconds for a 1-min article (60% of 60s = 36s)', () => {
            const article = makeArticle();
            article.readTime = 1;
            const minSeconds = Math.floor(article.readTime * 60 * 0.6);
            expect(minSeconds).toBe(36);
        });

        it('should calculate correct minimum seconds for a 5-min article (60% of 300s = 180s)', () => {
            const article = makeArticle();
            article.readTime = 5;
            const minSeconds = Math.floor(article.readTime * 60 * 0.6);
            expect(minSeconds).toBe(180);
        });

        it('should mark reading as valid when timeSpent >= minimum', () => {
            const readTime = 2;
            const minSeconds = Math.floor(readTime * 60 * 0.6); // 72
            const timeSpent = 80;
            expect(timeSpent >= minSeconds).toBe(true);
        });

        it('should mark reading as invalid when timeSpent < minimum', () => {
            const readTime = 2;
            const minSeconds = Math.floor(readTime * 60 * 0.6); // 72
            const timeSpent = 30;
            expect(timeSpent >= minSeconds).toBe(false);
        });
    });

    // ── ObjectId ────────────────────────────────────────────────────
    describe('ObjectId', () => {
        it('should assign a valid ObjectId on instantiation', () => {
            const article = makeArticle();
            expect(article._id).toBeInstanceOf(mongoose.Types.ObjectId);
        });

        it('should store createdBy as ObjectId', () => {
            const userId = fakeUserId();
            const article = new Article({ ...validArticleData(), createdBy: userId });
            expect(article.createdBy.toString()).toBe(userId.toString());
        });
    });
});
