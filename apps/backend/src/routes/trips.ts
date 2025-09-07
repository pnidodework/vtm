import express from 'express';
import { authenticateToken, requireManagerOrAdmin, asyncHandler } from '../middleware/auth';
import { validateRequest, tripValidation } from '../middleware/validation';
import { 
  getAllTrips, 
  getTripById, 
  createTrip, 
  updateTrip, 
  deleteTrip,
  updateTripStatus
} from '../controllers/tripController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users can view)
router.get('/', asyncHandler(getAllTrips));
router.get('/:id', asyncHandler(getTripById));

// Manager and Admin only routes
router.post('/', requireManagerOrAdmin, validateRequest(tripValidation.create), asyncHandler(createTrip));
router.put('/:id', requireManagerOrAdmin, validateRequest(tripValidation.update), asyncHandler(updateTrip));
router.delete('/:id', requireManagerOrAdmin, asyncHandler(deleteTrip));
router.patch('/:id/status', requireManagerOrAdmin, asyncHandler(updateTripStatus));

export default router;
