import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { loginValidation, registerValidation } from '../validations/user.validation.js';
import { login, register } from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes 
router.post('/register', ...registerValidation, validate, register);
router.post('/login', ...loginValidation, validate, login);

export default router;