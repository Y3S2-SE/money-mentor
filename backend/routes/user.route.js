import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { deleteUser, getAllUsers, getUserByID } from '../controllers/user.controller.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserByID);
router.delete('/:id', deleteUser);

export default router;