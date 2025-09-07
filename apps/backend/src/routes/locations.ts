import express from 'express';
import { authenticateToken, asyncHandler } from '../middleware/auth';
import { validateRequest, locationUpdateValidation } from '../middleware/validation';
import { 
  addLocationUpdate, 
  getVehicleLocationHistory,
  getLiveLocations
} from '../controllers/locationController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Location tracking routes
router.post('/update', validateRequest(locationUpdateValidation.create), asyncHandler(addLocationUpdate));
router.get('/vehicle/:vehicleId/history', asyncHandler(getVehicleLocationHistory));
router.get('/live', asyncHandler(getLiveLocations));

export default router;
