import { Response } from 'express';
import { AuthenticatedRequest, CreateLocationUpdateData, ApiResponse } from '../types';
import { query } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
// Import io from global
const io = (global as any).io;

// Add location update
export const addLocationUpdate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { vehicle_id, driver_id, location, speed, heading }: CreateLocationUpdateData = req.body;

  // Check if vehicle exists
  const vehicleResult = await query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
  if (vehicleResult.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }

  // Check if driver exists
  const driverResult = await query('SELECT id FROM drivers WHERE id = $1', [driver_id]);
  if (driverResult.rows.length === 0) {
    throw createError('Driver not found', 404);
  }

  // Insert location update
  const result = await query(
    `INSERT INTO location_updates (vehicle_id, driver_id, location, speed, heading) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [vehicle_id, driver_id, JSON.stringify(location), speed, heading]
  );

  // Update vehicle current location
  await query(
    'UPDATE vehicles SET current_location = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(location), vehicle_id]
  );

  // Update driver current location
  await query(
    'UPDATE drivers SET current_location = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(location), driver_id]
  );

  // Emit real-time location update
  io.emit('location-update', {
    vehicleId: vehicle_id,
    driverId: driver_id,
    location,
    speed,
    heading,
    timestamp: result.rows[0].timestamp
  });

  const response: ApiResponse = {
    success: true,
    message: 'Location update added successfully',
    data: result.rows[0]
  };

  res.status(201).json(response);
});

// Get vehicle location history
export const getVehicleLocationHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { vehicleId } = req.params;
  const { hours = 24, limit = 100 } = req.query;

  // Check if vehicle exists
  const vehicleResult = await query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
  if (vehicleResult.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }

  // Calculate time threshold
  const timeThreshold = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

  const result = await query(
    `SELECT * FROM location_updates 
     WHERE vehicle_id = $1 AND timestamp >= $2 
     ORDER BY timestamp DESC 
     LIMIT $3`,
    [vehicleId, timeThreshold, Number(limit)]
  );

  const response: ApiResponse = {
    success: true,
    message: 'Vehicle location history retrieved successfully',
    data: result.rows
  };

  res.json(response);
});

// Get live locations of all vehicles and drivers
export const getLiveLocations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Get all vehicles with their current locations
  const vehiclesResult = await query(
    `SELECT v.id, v.license_plate, v.make, v.model, v.status, v.current_location,
            d.id as driver_id, d.user_id as driver_name,
            u.full_name as driver_full_name
     FROM vehicles v 
     LEFT JOIN drivers d ON v.assigned_driver_id = d.id 
     LEFT JOIN users u ON d.user_id = u.id 
     WHERE v.status IN ('available', 'in_use')`
  );

  // Get all drivers with their current locations
  const driversResult = await query(
    `SELECT d.id, d.user_id, d.status, d.current_location,
            u.full_name, u.email
     FROM drivers d 
     JOIN users u ON d.user_id = u.id 
     WHERE d.status IN ('available', 'on_trip')`
  );

  // Get active trips
  const tripsResult = await query(
    `SELECT t.id, t.vehicle_id, t.driver_id, t.status, t.start_location, t.end_location,
            v.license_plate,
            d.user_id as driver_name,
            u.full_name as driver_full_name
     FROM trips t 
     JOIN vehicles v ON t.vehicle_id = v.id 
     JOIN drivers d ON t.driver_id = d.id 
     JOIN users u ON d.user_id = u.id 
     WHERE t.status IN ('scheduled', 'in_progress')`
  );

  const response: ApiResponse = {
    success: true,
    message: 'Live locations retrieved successfully',
    data: {
      vehicles: vehiclesResult.rows,
      drivers: driversResult.rows,
      activeTrips: tripsResult.rows
    }
  };

  res.json(response);
});
