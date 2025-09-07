import express from 'express';
import { authenticateToken, requireManagerOrAdmin, asyncHandler } from '../middleware/auth';
import { validateRequest, vehicleValidation } from '../middleware/validation';
import { 
  getAllVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  assignDriver,
  updateLocation
} from '../controllers/vehicleController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users can view)
router.get('/', asyncHandler(getAllVehicles));
router.get('/:id', asyncHandler(getVehicleById));

// Manager and Admin only routes
router.post('/', requireManagerOrAdmin, validateRequest(vehicleValidation.create), asyncHandler(createVehicle));
router.put('/:id', requireManagerOrAdmin, validateRequest(vehicleValidation.update), asyncHandler(updateVehicle));
router.delete('/:id', requireManagerOrAdmin, asyncHandler(deleteVehicle));
router.post('/:id/assign-driver', requireManagerOrAdmin, asyncHandler(assignDriver));
router.put('/:id/location', requireManagerOrAdmin, asyncHandler(updateLocation));

export default router;
