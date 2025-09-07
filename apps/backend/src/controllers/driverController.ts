import { Response } from 'express';
import { AuthenticatedRequest, CreateDriverData, UpdateDriverData, ApiResponse, DriverFilters } from '../types';
import { query } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
// Import io from global
const io = (global as any).io;

// Get all drivers with optional filtering and pagination
export const getAllDrivers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    status,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query as DriverFilters;

  const offset = (Number(page) - 1) * Number(limit);
  let whereConditions: string[] = [];
  let values: any[] = [];
  let paramCount = 1;

  // Build WHERE conditions
  if (status) {
    whereConditions.push(`d.status = $${paramCount++}`);
    values.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await query(`SELECT COUNT(*) FROM drivers d ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].count);

  // Get drivers with pagination
  values.push(Number(limit), offset);
  const result = await query(
    `SELECT d.*, u.email, u.full_name 
     FROM drivers d 
     JOIN users u ON d.user_id = u.id 
     ${whereClause} 
     ORDER BY d.${sortBy} ${sortOrder.toUpperCase()} 
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    values
  );

  const response: ApiResponse = {
    success: true,
    message: 'Drivers retrieved successfully',
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

// Get driver by ID
export const getDriverById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT d.*, u.email, u.full_name 
     FROM drivers d 
     JOIN users u ON d.user_id = u.id 
     WHERE d.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError('Driver not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Driver retrieved successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Create new driver
export const createDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    user_id, 
    license_number, 
    license_expiry, 
    phone_number, 
    status = 'available',
    current_location = { lat: 0, lng: 0 }
  }: CreateDriverData = req.body;

  // Check if user exists and has driver role
  const userResult = await query('SELECT id, role FROM users WHERE id = $1', [user_id]);
  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }
  if (userResult.rows[0].role !== 'driver') {
    throw createError('User must have driver role', 400);
  }

  // Check if driver already exists for this user
  const existingDriver = await query('SELECT id FROM drivers WHERE user_id = $1', [user_id]);
  if (existingDriver.rows.length > 0) {
    throw createError('Driver profile already exists for this user', 409);
  }

  // Check if license number already exists
  const licenseCheck = await query('SELECT id FROM drivers WHERE license_number = $1', [license_number]);
  if (licenseCheck.rows.length > 0) {
    throw createError('Driver with this license number already exists', 409);
  }

  const result = await query(
    `INSERT INTO drivers (user_id, license_number, license_expiry, phone_number, status, current_location) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [user_id, license_number, license_expiry, phone_number, status, JSON.stringify(current_location)]
  );

  const response: ApiResponse = {
    success: true,
    message: 'Driver created successfully',
    data: result.rows[0]
  };

  res.status(201).json(response);
});

// Update driver
export const updateDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateDriverData = req.body;

  // Check if driver exists
  const existingDriver = await query('SELECT id FROM drivers WHERE id = $1', [id]);
  if (existingDriver.rows.length === 0) {
    throw createError('Driver not found', 404);
  }

  // Check if license number is being updated and if it's already taken
  if (updateData.license_number) {
    const licenseCheck = await query('SELECT id FROM drivers WHERE license_number = $1 AND id != $2', [updateData.license_number, id]);
    if (licenseCheck.rows.length > 0) {
      throw createError('Driver with this license number already exists', 409);
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
    `UPDATE drivers SET ${updateFields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  const response: ApiResponse = {
    success: true,
    message: 'Driver updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Delete driver
export const deleteDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if driver exists
  const existingDriver = await query('SELECT id FROM drivers WHERE id = $1', [id]);
  if (existingDriver.rows.length === 0) {
    throw createError('Driver not found', 404);
  }

  // Check if driver is currently assigned to any vehicles
  const assignedVehicles = await query('SELECT id FROM vehicles WHERE assigned_driver_id = $1', [id]);
  if (assignedVehicles.rows.length > 0) {
    throw createError('Cannot delete driver who is assigned to vehicles', 400);
  }

  // Check if driver has any active trips
  const activeTrips = await query('SELECT id FROM trips WHERE driver_id = $1 AND status IN ($2, $3)', [id, 'scheduled', 'in_progress']);
  if (activeTrips.rows.length > 0) {
    throw createError('Cannot delete driver with active trips', 400);
  }

  await query('DELETE FROM drivers WHERE id = $1', [id]);

  const response: ApiResponse = {
    success: true,
    message: 'Driver deleted successfully'
  };

  res.json(response);
});

// Update driver location
export const updateDriverLocation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { lat, lng } = req.body;

  // Check if driver exists
  const existingDriver = await query('SELECT id FROM drivers WHERE id = $1', [id]);
  if (existingDriver.rows.length === 0) {
    throw createError('Driver not found', 404);
  }

  const result = await query(
    'UPDATE drivers SET current_location = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [JSON.stringify({ lat, lng }), id]
  );

  // Emit real-time location update
  io.emit('driver-location-update', {
    driverId: id,
    location: { lat, lng },
    timestamp: new Date()
  });

  const response: ApiResponse = {
    success: true,
    message: 'Driver location updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});
