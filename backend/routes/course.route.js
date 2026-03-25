import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createCourseRules, updateCourseRules, submitCourseRules } from '../validations/course.validation.js';
import {
    createCourse,
    updateCourse,
    deleteCourse,
    getAllCourses,
    getCourseById,
    submitCourse
} from '../controllers/course.controller.js';

const router = express.Router();

router.use(protect);

router.post('/create', authorize('admin'), createCourseRules, validate, createCourse);
router.put('/:id', authorize('admin'), updateCourseRules, validate, updateCourse);
router.delete('/:id', authorize('admin'), deleteCourse);

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/:id/submit', submitCourseRules, validate, submitCourse);

export default router;