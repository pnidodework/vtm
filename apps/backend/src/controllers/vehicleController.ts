import { Response } from 'express';
import { AuthenticatedRequest, CreateVehicleData, UpdateVehicleData, ApiResponse, VehicleFilters } from '../types';
import { query } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
// Import io from global
const io = (global as any).io;

// Get all vehicles with optional filtering and pagination
export const getAllVehicles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    make, 
    model, 
    year,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query as VehicleFilters;

  const offset = (Number(page) - 1) * Number(limit);
  let whereConditions: string[] = [];
  let values: any[] = [];
  let paramCount = 1;

  // Build WHERE conditions
  if (status) {
    whereConditions.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (make) {
    whereConditions.push(`make ILIKE $${paramCount++}`);
    values.push(`%${make}%`);
  }
  if (model) {
    whereConditions.push(`model ILIKE $${paramCount++}`);
    values.push(`%${model}%`);
  }
  if (year) {
    whereConditions.push(`year = $${paramCount++}`);
    values.push(Number(year));
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await query(`SELECT COUNT(*) FROM vehicles ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].count);

  // Get vehicles with pagination
  values.push(Number(limit), offset);
  const result = await query(
    `SELECT v.*, d.user_id as driver_name 
     FROM vehicles v 
     LEFT JOIN drivers d ON v.assigned_driver_id = d.id 
     ${whereClause} 
     ORDER BY ${sortBy} ${sortOrder.toUpperCase()} 
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    values
  );

  const response: ApiResponse = {
    success: true,
    message: 'Vehicles retrieved successfully',
    data: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// Get vehicle by ID
export const getVehicleById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT v.*, d.user_id as driver_name 
     FROM vehicles v 
     LEFT JOIN drivers d ON v.assigned_driver_id = d.id 
     WHERE v.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Vehicle retrieved successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Create new vehicle
export const createVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    license_plate, 
    make, 
    model, 
    year, 
    capacity, 
    status = 'available',
    current_location = { lat: 0, lng: 0 }
  }: CreateVehicleData = req.body;

  // Check if license plate already exists
  const existingVehicle = await query('SELECT id FROM vehicles WHERE license_plate = $1', [license_plate]);
  if (existingVehicle.rows.length > 0) {
    throw createError('Vehicle with this license plate already exists', 409);
  }

  const result = await query(
    `INSERT INTO vehicles (license_plate, make, model, year, capacity, status, current_location) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [license_plate, make, model, year, capacity, status, JSON.stringify(current_location)]
  );

  const response: ApiResponse = {
    success: true,
    message: 'Vehicle created successfully',
    data: result.rows[0]
  };

  res.status(201).json(response);
});

// Update vehicle
export const updateVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateVehicleData = req.body;

  // Check if vehicle exists
  const existingVehicle = await query('SELECT id FROM vehicles WHERE id = $1', [id]);
  if (existingVehicle.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }

  // Check if license plate is being updated and if it's already taken
  if (updateData.license_plate) {
    const licenseCheck = await query('SELECT id FROM vehicles WHERE license_plate = $1 AND id != $2', [updateData.license_plate, id]);
    if (licenseCheck.rows.length > 0) {
      throw createError('Vehicle with this license plate already exists', 409);
    }
  }

  let updateFields: string[] = [];
  let values: any[] = [];
  let paramCount = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'current_location') {
        updateFields.push(`current_location = $${paramCount++}`);
        values.push(JSON.stringify(value));
      } else {
        updateFields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }
  });

  if (updateFields.length === 0) {
    throw createError('No fields to update', 400);
  }

  updateFields.push('updated_at = NOW()');
  values.push(id);

  const result = await query(
    `UPDATE vehicles SET ${updateFields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  const response: ApiResponse = {
    success: true,
    message: 'Vehicle updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Delete vehicle
export const deleteVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if vehicle exists
  const existingVehicle = await query('SELECT id FROM vehicles WHERE id = $1', [id]);
  if (existingVehicle.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }

  // Check if vehicle is currently assigned to any trips
  const activeTrips = await query('SELECT id FROM trips WHERE vehicle_id = $1 AND status IN ($2, $3)', [id, 'scheduled', 'in_progress']);
  if (activeTrips.rows.length > 0) {
    throw createError('Cannot delete vehicle with active trips', 400);
  }

  await query('DELETE FROM vehicles WHERE id = $1', [id]);

  const response: ApiResponse = {
    success: true,
    message: 'Vehicle deleted successfully'
  };

  res.json(response);
});

// Assign driver to vehicle
export const assignDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { driver_id } = req.body;

  // Check if vehicle exists
  const vehicleResult = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
  if (vehicleResult.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }

  // Check if driver exists
  const driverResult = await query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
  if (driverResult.rows.length === 0) {
    throw createError('Driver not found', 404);
  }

  const vehicle = vehicleResult.rows[0];
  const driver = driverResult.rows[0];

  // Check if driver is available
  if (driver.status !== 'available') {
    throw createError('Driver is not available', 400);
  }

  // Check if vehicle is available
  if (vehicle.status !== 'available') {
    throw createError('Vehicle is not available', 400);
  }

  // Update vehicle with assigned driver
  const result = await query(
    'UPDATE vehicles SET assigned_driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [driver_id, 'in_use', id]
  );

  // Update driver status
  await query(
    'UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2',
    ['on_trip', driver_id]
  );

  // Emit real-time update
  io.emit('vehicle-updated', {
    vehicle: result.rows[0],
    driver: driver
  });

  const response: ApiResponse = {
    success: true,
    message: 'Driver assigned to vehicle successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Update vehicle location
export const updateLocation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { lat, lng } = req.body;

  // Check if vehicle exists
  const existingVehicle = await query('SELECT id FROM vehicles WHERE id = $1', [id]);
  if (existingVehicle.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }

  const result = await query(
    'UPDATE vehicles SET current_location = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [JSON.stringify({ lat, lng }), id]
  );

  // Emit real-time location update
  io.emit('location-update', {
    vehicleId: id,
    location: { lat, lng },
    timestamp: new Date()
  });

  const response: ApiResponse = {
    success: true,
    message: 'Vehicle location updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});
