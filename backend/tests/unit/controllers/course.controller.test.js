import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

jest.unstable_mockModule('../../../models/course.model.js', () => ({
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  }
}));

jest.unstable_mockModule('../../../utils/gamificationEngine.js', () => ({
  processXPEvent: jest.fn().mockResolvedValue({
    xpResult: { leveledUp: false, newLevel: 1 },
    newlyEarnedBadges: [],
  }),
}));

const Course = (await import('../../../models/course.model.js')).default;
const courseController = await import('../../../controllers/course.controller.js');

const mockUserId = new mongoose.Types.ObjectId();
const mockCourseId = new mongoose.Types.ObjectId();

const buildMocks = ({ body = {}, params = {}, query = {}, user = { _id: mockUserId, role: 'user' } } = {}) => ({
  req: { body, params, query, user },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  },
  next: jest.fn(),
});

const mockCourse = (overrides = {}) => ({
  _id: mockCourseId,
  title: 'Test Course',
  description: 'A test course',
  category: 'budgeting',
  isPublished: true,
  passingScore: 70,
  totalPoints: 30,
  createdBy: mockUserId,
  completions: [],
  questions: [
    { question: 'Q1?', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 },
    { question: 'Q2?', options: ['C', 'D'], correctAnswerIndex: 1, points: 20 },
  ],
  toObject: jest.fn().mockReturnThis(),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


// ── createCourse ───────────────────────────────────────────────────
describe('Course Controller - createCourse', () => {
  it('should return 201 on successful creation', async () => {
    const course = mockCourse();
    Course.create.mockResolvedValue(course);

    const { req, res } = buildMocks({
      body: { title: 'Test', description: 'Desc', category: 'budgeting', questions: [] },
      user: { _id: mockUserId, role: 'admin' }
    });

    await courseController.createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Course created successfully',
    }));
  });

  it('should return 500 on error', async () => {
    Course.create.mockRejectedValue(new Error('DB error'));

    const { req, res } = buildMocks({ body: {}, user: { _id: mockUserId, role: 'admin' } });

    await courseController.createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── getAllCourses ──────────────────────────────────────────────────
describe('Course Controller - getAllCourses', () => {
  it('should return 200 with list of courses', async () => {
    const course = mockCourse();
    course.toObject = () => ({ ...course, completions: [] });

    Course.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([course]),
    });
    Course.countDocuments.mockResolvedValue(1);

    const { req, res } = buildMocks({ query: {} });

    await courseController.getAllCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should filter isPublished for non-admin users', async () => {
    Course.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
    Course.countDocuments.mockResolvedValue(0);

    const { req, res } = buildMocks({ query: {}, user: { _id: mockUserId, role: 'user' } });

    await courseController.getAllCourses(req, res);

    expect(Course.find).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: true })
    );
  });

  it('should return 500 on error', async () => {
    Course.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const { req, res } = buildMocks({ query: {} });

    await courseController.getAllCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});


// ── getCourseById ──────────────────────────────────────────────────
describe('Course Controller - getCourseById', () => {
  it('should return 200 for admin with full course data', async () => {
    const course = mockCourse();
    Course.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(course) });

    const { req, res } = buildMocks({
      params: { id: mockCourseId.toString() },
      user: { _id: mockUserId, role: 'admin' }
    });

    await courseController.getCourseById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 200 with sanitized questions for non-admin', async () => {
    const course = mockCourse();
    course.toObject = () => ({
      ...course,
      questions: course.questions.map(q => ({ ...q })),
    });
    Course.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(course) });

    const { req, res } = buildMocks({
      params: { id: mockCourseId.toString() },
      user: { _id: mockUserId, role: 'user' }
    });

    await courseController.getCourseById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    // correctAnswerIndex should be stripped out
    jsonArg.data.questions.forEach(q => {
      expect(q).not.toHaveProperty('correctAnswerIndex');
    });
  });

  it('should return 404 when course not found', async () => {
    Course.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    const { req, res } = buildMocks({ params: { id: 'badid' } });

    await courseController.getCourseById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 404 when non-admin accesses unpublished course', async () => {
    const course = mockCourse({ isPublished: false });
    Course.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(course) });

    const { req, res } = buildMocks({
      params: { id: mockCourseId.toString() },
      user: { _id: mockUserId, role: 'user' }
    });

    await courseController.getCourseById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});


// ── deleteCourse ───────────────────────────────────────────────────
describe('Course Controller - deleteCourse', () => {
  it('should return 200 on successful deletion', async () => {
    Course.findByIdAndDelete.mockResolvedValue(mockCourse());

    const { req, res } = buildMocks({ params: { id: mockCourseId.toString() } });

    await courseController.deleteCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Course deleted successfully'
    }));
  });

  it('should return 404 when course not found', async () => {
    Course.findByIdAndDelete.mockResolvedValue(null);

    const { req, res } = buildMocks({ params: { id: 'nonexistentid' } });

    await courseController.deleteCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});


// ── submitCourse ───────────────────────────────────────────────────
describe('Course Controller - submitCourse', () => {
  it('should return 200 with pass result when score meets passingScore', async () => {
    const course = mockCourse();
    course.completions.find = jest.fn().mockReturnValue(null);
    course.completions.push = jest.fn();
    Course.findById.mockResolvedValue(course);

    const { req, res } = buildMocks({
      params: { id: mockCourseId.toString() },
      body: { answers: [0, 1] }, // both correct
      user: { _id: mockUserId, role: 'user' }
    });

    await courseController.submitCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.passed).toBe(true);
  });

  it('should return 200 with fail result when score is below passingScore', async () => {
    const course = mockCourse();
    course.completions.find = jest.fn().mockReturnValue(null);
    Course.findById.mockResolvedValue(course);

    const { req, res } = buildMocks({
      params: { id: mockCourseId.toString() },
      body: { answers: [1, 0] }, // both wrong
      user: { _id: mockUserId, role: 'user' }
    });

    await courseController.submitCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.passed).toBe(false);
  });

  it('should return 400 if already completed', async () => {
    const course = mockCourse();
    course.completions.find = jest.fn().mockReturnValue({ score: 80 });
    Course.findById.mockResolvedValue(course);

    const { req, res } = buildMocks({
      params: { id: mockCourseId.toString() },
      body: { answers: [0, 1] }
    });

    await courseController.submitCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'You have already completed this course'
    }));
  });

  it('should return 400 if wrong number of answers provided', async () => {
    const course = mockCourse();
    course.completions.find = jest.fn().mockReturnValue(null);
    Course.findById.mockResolvedValue(course);

    const { req, res } = buildMocks({
      params: { id: mockCourseId.toString() },
      body: { answers: [0] } // only 1 answer for 2 questions
    });

    await courseController.submitCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 when course not found', async () => {
    Course.findById.mockResolvedValue(null);

    const { req, res } = buildMocks({
      params: { id: 'badid' },
      body: { answers: [0] }
    });

    await courseController.submitCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});


// ── getUserPoints ──────────────────────────────────────────────────
describe('Course Controller - getUserPoints', () => {
  it('should return 200 with total points', async () => {
    const course = mockCourse();
    course.completions = [{
      user: { toString: () => mockUserId.toString() },
      pointsEarned: 30
    }];
    Course.find.mockResolvedValue([course]);

    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await courseController.getUserPoints(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.totalPoints).toBe(30);
  });

  it('should return 0 when user has no completions', async () => {
    Course.find.mockResolvedValue([]);

    const { req, res } = buildMocks({ user: { _id: mockUserId } });

    await courseController.getUserPoints(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.totalPoints).toBe(0);
  });
});