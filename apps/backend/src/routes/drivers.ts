import express from 'express';
import { authenticateToken, requireManagerOrAdmin, asyncHandler } from '../middleware/auth';
import { validateRequest, driverValidation } from '../middleware/validation';
import { 
  getAllDrivers, 
  getDriverById, 
  createDriver, 
  updateDriver, 
  deleteDriver,
  updateDriverLocation
} from '../controllers/driverController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users can view)
router.get('/', asyncHandler(getAllDrivers));
router.get('/:id', asyncHandler(getDriverById));

// Manager and Admin only routes
router.post('/', requireManagerOrAdmin, validateRequest(driverValidation.create), asyncHandler(createDriver));
router.put('/:id', requireManagerOrAdmin, validateRequest(driverValidation.update), asyncHandler(updateDriver));
router.delete('/:id', requireManagerOrAdmin, asyncHandler(deleteDriver));
router.put('/:id/location', requireManagerOrAdmin, asyncHandler(updateDriverLocation));

export default router;
