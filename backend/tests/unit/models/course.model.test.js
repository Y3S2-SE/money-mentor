import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Course from '../../../models/course.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup/testSetup.js';

describe('Course Model Unit Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  const fakeUserId = () => new mongoose.Types.ObjectId();

  // Reusable valid course data
  const validCourse = (overrides = {}) => ({
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

  // ── Course Creation ────────────────────────────────────────────
  describe('Course Creation', () => {
    it('should create a valid course', async () => {
      const course = await Course.create(validCourse());

      expect(course.title).toBe('Budgeting Basics');
      expect(course.description).toBe('Learn how to manage your monthly budget.');
      expect(course.category).toBe('budgeting');
      expect(course.isPublished).toBe(false);
      expect(course.difficulty).toBe('beginner');
      expect(course.passingScore).toBe(70);
    });

    it('should fail without title', async () => {
      await expect(Course.create(validCourse({ title: undefined }))).rejects.toThrow();
    });

    it('should fail without description', async () => {
      await expect(Course.create(validCourse({ description: undefined }))).rejects.toThrow();
    });

    it('should fail without createdBy', async () => {
      await expect(Course.create(validCourse({ createdBy: undefined }))).rejects.toThrow();
    });

    it('should fail without questions', async () => {
      await expect(Course.create(validCourse({ questions: [] }))).rejects.toThrow();
    });

    it('should fail with title shorter than 3 characters', async () => {
      await expect(Course.create(validCourse({ title: 'AB' }))).rejects.toThrow();
    });

    it('should fail with title longer than 100 characters', async () => {
      await expect(Course.create(validCourse({ title: 'a'.repeat(101) }))).rejects.toThrow();
    });

    it('should fail with description longer than 500 characters', async () => {
      await expect(Course.create(validCourse({ description: 'a'.repeat(501) }))).rejects.toThrow();
    });

    it('should fail with invalid category', async () => {
      await expect(Course.create(validCourse({ category: 'crypto' }))).rejects.toThrow();
    });

    it('should fail with invalid difficulty', async () => {
      await expect(Course.create(validCourse({ difficulty: 'expert' }))).rejects.toThrow();
    });

    it('should default isPublished to false', async () => {
      const course = await Course.create(validCourse());
      expect(course.isPublished).toBe(false);
    });

    it('should default difficulty to beginner', async () => {
      const course = await Course.create(validCourse());
      expect(course.difficulty).toBe('beginner');
    });

    it('should default passingScore to 70', async () => {
      const course = await Course.create(validCourse());
      expect(course.passingScore).toBe(70);
    });

    it('should default category to general when not provided', async () => {
      const course = await Course.create(validCourse({ category: undefined }));
      expect(course.category).toBe('general');
    });

    it('should default thumbnail to null', async () => {
      const course = await Course.create(validCourse());
      expect(course.thumbnail).toBeNull();
    });

    it('should accept all valid categories', async () => {
      const categories = ['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'];
      for (const category of categories) {
        const course = await Course.create(validCourse({ category }));
        expect(course.category).toBe(category);
        await Course.deleteMany({});
      }
    });

    it('should accept all valid difficulties', async () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'];
      for (const difficulty of difficulties) {
        const course = await Course.create(validCourse({ difficulty }));
        expect(course.difficulty).toBe(difficulty);
        await Course.deleteMany({});
      }
    });
  });

  // ── Questions ──────────────────────────────────────────────────
  describe('Questions', () => {
    it('should save a question with all fields', async () => {
      const course = await Course.create(validCourse({
        questions: [{
          question: 'What is compound interest?',
          options: ['Interest on interest', 'Simple rate', 'Tax on income'],
          correctAnswerIndex: 0,
          explanation: 'Compound interest grows exponentially.',
          points: 15
        }]
      }));

      const q = course.questions[0];
      expect(q.question).toBe('What is compound interest?');
      expect(q.options).toHaveLength(3);
      expect(q.correctAnswerIndex).toBe(0);
      expect(q.explanation).toBe('Compound interest grows exponentially.');
      expect(q.points).toBe(15);
    });

    it('should default question points to 10', async () => {
      const course = await Course.create(validCourse());
      expect(course.questions[0].points).toBe(10);
    });

    it('should fail with fewer than 2 options', async () => {
      await expect(Course.create(validCourse({
        questions: [{
          question: 'Test?',
          options: ['Only one'],
          correctAnswerIndex: 0
        }]
      }))).rejects.toThrow();
    });

    it('should fail with more than 6 options', async () => {
      await expect(Course.create(validCourse({
        questions: [{
          question: 'Test?',
          options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
          correctAnswerIndex: 0
        }]
      }))).rejects.toThrow();
    });

    it('should accept exactly 2 options', async () => {
      const course = await Course.create(validCourse({
        questions: [{
          question: 'True or false?',
          options: ['True', 'False'],
          correctAnswerIndex: 0
        }]
      }));
      expect(course.questions[0].options).toHaveLength(2);
    });

    it('should accept exactly 6 options', async () => {
      const course = await Course.create(validCourse({
        questions: [{
          question: 'Pick one?',
          options: ['a', 'b', 'c', 'd', 'e', 'f'],
          correctAnswerIndex: 0
        }]
      }));
      expect(course.questions[0].options).toHaveLength(6);
    });

    it('should fail when question text is missing', async () => {
      await expect(Course.create(validCourse({
        questions: [{
          options: ['Yes', 'No'],
          correctAnswerIndex: 0
        }]
      }))).rejects.toThrow();
    });

    it('should fail when correctAnswerIndex is missing', async () => {
      await expect(Course.create(validCourse({
        questions: [{
          question: 'Test?',
          options: ['Yes', 'No']
        }]
      }))).rejects.toThrow();
    });

    it('should save multiple questions', async () => {
      const course = await Course.create(validCourse({
        questions: [
          { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 },
          { question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 1, points: 20 },
          { question: 'Q3?', options: ['E', 'F'], correctAnswerIndex: 0, points: 10 }
        ]
      }));
      expect(course.questions).toHaveLength(3);
    });
  });

  // ── totalPoints Auto-Calculation ───────────────────────────────
  describe('totalPoints Auto-Calculation', () => {
    it('should auto-calculate totalPoints from questions on create', async () => {
      const course = await Course.create(validCourse({
        questions: [
          { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 },
          { question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 0, points: 20 }
        ]
      }));
      expect(course.totalPoints).toBe(30);
    });

    it('should recalculate totalPoints when questions are updated', async () => {
      const course = await Course.create(validCourse({
        questions: [
          { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 }
        ]
      }));

      expect(course.totalPoints).toBe(10);

      course.questions.push({ question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 0, points: 15 });
      await course.save();

      expect(course.totalPoints).toBe(25);
    });

    it('should calculate totalPoints correctly with default points', async () => {
      const course = await Course.create(validCourse({
        questions: [
          { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0 }, // default 10
          { question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 0 }  // default 10
        ]
      }));
      expect(course.totalPoints).toBe(20);
    });
  });

  // ── Completions ────────────────────────────────────────────────
  describe('Completions', () => {
    it('should default to empty completions array', async () => {
      const course = await Course.create(validCourse());
      expect(course.completions).toEqual([]);
    });

    it('should add a completion record', async () => {
      const course = await Course.create(validCourse());
      const userId = fakeUserId();

      course.completions.push({ user: userId, score: 80, pointsEarned: 10 });
      await course.save();

      const updated = await Course.findById(course._id);
      expect(updated.completions).toHaveLength(1);
      expect(updated.completions[0].score).toBe(80);
      expect(updated.completions[0].pointsEarned).toBe(10);
    });

    it('should add completedAt timestamp automatically', async () => {
      const course = await Course.create(validCourse());
      course.completions.push({ user: fakeUserId(), score: 70, pointsEarned: 10 });
      await course.save();

      const updated = await Course.findById(course._id);
      expect(updated.completions[0].completedAt).toBeDefined();
      expect(updated.completions[0].completedAt).toBeInstanceOf(Date);
    });

    it('should store multiple completions from different users', async () => {
      const course = await Course.create(validCourse());
      course.completions.push({ user: fakeUserId(), score: 80, pointsEarned: 10 });
      course.completions.push({ user: fakeUserId(), score: 60, pointsEarned: 0 });
      await course.save();

      const updated = await Course.findById(course._id);
      expect(updated.completions).toHaveLength(2);
    });
  });

  // ── Timestamps ─────────────────────────────────────────────────
  describe('Timestamps', () => {
    it('should add createdAt timestamp', async () => {
      const course = await Course.create(validCourse());
      expect(course.createdAt).toBeDefined();
      expect(course.createdAt).toBeInstanceOf(Date);
    });

    it('should add updatedAt timestamp', async () => {
      const course = await Course.create(validCourse());
      expect(course.updatedAt).toBeDefined();
      expect(course.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const course = await Course.create(validCourse());
      const originalUpdatedAt = course.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      course.title = 'Updated Title';
      await course.save();

      expect(course.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});