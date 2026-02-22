import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
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

router.post('/create', authorize('admin'), createCourse);
router.put('/:id', authorize('admin'), updateCourse);
router.delete('/:id', authorize('admin'), deleteCourse);

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/:id/submit', submitCourse);

export default router;