import express from 'express';
import { authenticateToken, requireAdmin, requireManagerOrAdmin, asyncHandler } from '../middleware/auth';
import { validateRequest, userValidation } from '../middleware/validation';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/userController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', requireAdmin, asyncHandler(getAllUsers));
router.post('/', requireAdmin, validateRequest(userValidation.create), asyncHandler(createUser));
router.delete('/:id', requireAdmin, asyncHandler(deleteUser));

// Manager and Admin routes
router.get('/:id', requireManagerOrAdmin, asyncHandler(getUserById));
router.put('/:id', requireManagerOrAdmin, validateRequest(userValidation.update), asyncHandler(updateUser));

export default router;
