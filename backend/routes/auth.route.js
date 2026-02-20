import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { changePasswordRules, loginValidation, registerValidation, updateProfileRules } from '../validations/user.validation.js';
import { changePassword, getProfile, login, logout, register, updateProfile } from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes 
router.post('/register', ...registerValidation, validate, register);
router.post('/login', ...loginValidation, validate, login);

// Protected routes
router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfileRules, validate, updateProfile);
router.put('/change-password', changePasswordRules, validate, changePassword);
router.post('/logout', logout);

export default router;