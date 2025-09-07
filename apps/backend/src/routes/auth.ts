import express from 'express';
import { authenticateToken, asyncHandler } from '../middleware/auth';
import { validateRequest, userValidation } from '../middleware/validation';
import { login, register, getProfile, updateProfile } from '../controllers/authController';

const router = express.Router();

// Public routes
router.post('/login', validateRequest(userValidation.login), asyncHandler(login));
router.post('/register', validateRequest(userValidation.create), asyncHandler(register));

// Protected routes
router.use(authenticateToken);
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', validateRequest(userValidation.update), asyncHandler(updateProfile));

export default router;
