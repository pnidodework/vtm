import { Response } from 'express';
import { AuthenticatedRequest, CreateTripData, UpdateTripData, ApiResponse, TripFilters } from '../types';
import { query } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
// Import io from global
const io = (global as any).io;

// Get all trips with optional filtering and pagination
export const getAllTrips = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    status,
    vehicle_id,
    driver_id,
    start_date,
    end_date,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query as TripFilters;

  const offset = (Number(page) - 1) * Number(limit);
  let whereConditions: string[] = [];
  let values: any[] = [];
  let paramCount = 1;

  // Build WHERE conditions
  if (status) {
    whereConditions.push(`t.status = $${paramCount++}`);
    values.push(status);
  }
  if (vehicle_id) {
    whereConditions.push(`t.vehicle_id = $${paramCount++}`);
    values.push(vehicle_id);
  }
  if (driver_id) {
    whereConditions.push(`t.driver_id = $${paramCount++}`);
    values.push(driver_id);
  }
  if (start_date) {
    whereConditions.push(`t.start_time >= $${paramCount++}`);
    values.push(start_date);
  }
  if (end_date) {
    whereConditions.push(`t.start_time <= $${paramCount++}`);
    values.push(end_date);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await query(`SELECT COUNT(*) FROM trips t ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].count);

  // Get trips with pagination
  values.push(Number(limit), offset);
  const result = await query(
    `SELECT t.*, 
            v.license_plate, v.make, v.model,
            d.user_id as driver_name,
            u.full_name as driver_full_name
     FROM trips t 
     JOIN vehicles v ON t.vehicle_id = v.id 
     JOIN drivers d ON t.driver_id = d.id 
     JOIN users u ON d.user_id = u.id 
     ${whereClause} 
     ORDER BY t.${sortBy} ${sortOrder.toUpperCase()} 
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    values
  );

  const response: ApiResponse = {
    success: true,
    message: 'Trips retrieved successfully',
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

// Get trip by ID
export const getTripById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT t.*, 
            v.license_plate, v.make, v.model,
            d.user_id as driver_name,
            u.full_name as driver_full_name
     FROM trips t 
     JOIN vehicles v ON t.vehicle_id = v.id 
     JOIN drivers d ON t.driver_id = d.id 
     JOIN users u ON d.user_id = u.id 
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Trip retrieved successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Create new trip
export const createTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    vehicle_id, 
    driver_id, 
    start_location, 
    end_location, 
    start_time,
    status = 'scheduled'
  }: CreateTripData = req.body;

  // Check if vehicle exists and is available
  const vehicleResult = await query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id]);
  if (vehicleResult.rows.length === 0) {
    throw createError('Vehicle not found', 404);
  }
  if (vehicleResult.rows[0].status !== 'available') {
    throw createError('Vehicle is not available', 400);
  }

  // Check if driver exists and is available
  const driverResult = await query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
  if (driverResult.rows.length === 0) {
    throw createError('Driver not found', 404);
  }
  if (driverResult.rows[0].status !== 'available') {
    throw createError('Driver is not available', 400);
  }

  // Check if driver is already assigned to this vehicle
  const vehicleDriver = await query('SELECT assigned_driver_id FROM vehicles WHERE id = $1', [vehicle_id]);
  if (vehicleDriver.rows[0].assigned_driver_id && vehicleDriver.rows[0].assigned_driver_id !== driver_id) {
    throw createError('Vehicle is already assigned to another driver', 400);
  }

  const result = await query(
    `INSERT INTO trips (vehicle_id, driver_id, start_location, end_location, start_time, status) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [
      vehicle_id, 
      driver_id, 
      JSON.stringify(start_location), 
      JSON.stringify(end_location), 
      start_time, 
      status
    ]
  );

  // Update vehicle and driver status if trip is starting immediately
  if (status === 'in_progress') {
    await query(
      'UPDATE vehicles SET assigned_driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [driver_id, 'in_use', vehicle_id]
    );
    
    await query(
      'UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2',
      ['on_trip', driver_id]
    );
  }

  // Emit real-time update
  io.emit('trip-created', {
    trip: result.rows[0],
    vehicle: vehicleResult.rows[0],
    driver: driverResult.rows[0]
  });

  const response: ApiResponse = {
    success: true,
    message: 'Trip created successfully',
    data: result.rows[0]
  };

  res.status(201).json(response);
});

// Update trip
export const updateTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateTripData = req.body;

  // Check if trip exists
  const existingTrip = await query('SELECT * FROM trips WHERE id = $1', [id]);
  if (existingTrip.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  const trip = existingTrip.rows[0];

  // If updating vehicle or driver, check availability
  if (updateData.vehicle_id || updateData.driver_id) {
    const vehicleId = updateData.vehicle_id || trip.vehicle_id;
    const driverId = updateData.driver_id || trip.driver_id;

    // Check if new vehicle exists and is available
    if (updateData.vehicle_id) {
      const vehicleResult = await query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
      if (vehicleResult.rows.length === 0) {
        throw createError('Vehicle not found', 404);
      }
      if (vehicleResult.rows[0].status !== 'available' && trip.status !== 'completed') {
        throw createError('Vehicle is not available', 400);
      }
    }

    // Check if new driver exists and is available
    if (updateData.driver_id) {
      const driverResult = await query('SELECT * FROM drivers WHERE id = $1', [driverId]);
      if (driverResult.rows.length === 0) {
        throw createError('Driver not found', 404);
      }
      if (driverResult.rows[0].status !== 'available' && trip.status !== 'completed') {
        throw createError('Driver is not available', 400);
      }
    }
  }

  let updateFields: string[] = [];
  let values: any[] = [];
  let paramCount = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'start_location' || key === 'end_location') {
        updateFields.push(`${key} = $${paramCount++}`);
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
    `UPDATE trips SET ${updateFields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  );

  // Emit real-time update
  io.emit('trip-updated', result.rows[0]);

  const response: ApiResponse = {
    success: true,
    message: 'Trip updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Delete trip
export const deleteTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if trip exists
  const existingTrip = await query('SELECT * FROM trips WHERE id = $1', [id]);
  if (existingTrip.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  const trip = existingTrip.rows[0];

  // Check if trip is in progress
  if (trip.status === 'in_progress') {
    throw createError('Cannot delete trip that is in progress', 400);
  }

  await query('DELETE FROM trips WHERE id = $1', [id]);

  // Emit real-time update
  io.emit('trip-deleted', { tripId: id });

  const response: ApiResponse = {
    success: true,
    message: 'Trip deleted successfully'
  };

  res.json(response);
});

// Update trip status
export const updateTripStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // Check if trip exists
  const existingTrip = await query('SELECT * FROM trips WHERE id = $1', [id]);
  if (existingTrip.rows.length === 0) {
    throw createError('Trip not found', 404);
  }

  const trip = existingTrip.rows[0];

  // Update trip status
  const result = await query(
    'UPDATE trips SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );

  // Update vehicle and driver status based on trip status
  if (status === 'in_progress') {
    // Mark vehicle as in use and assign driver
    await query(
      'UPDATE vehicles SET assigned_driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [trip.driver_id, 'in_use', trip.vehicle_id]
    );
    
    // Mark driver as on trip
    await query(
      'UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2',
      ['on_trip', trip.driver_id]
    );
  } else if (status === 'completed' || status === 'cancelled') {
    // Mark vehicle as available and remove driver assignment
    await query(
      'UPDATE vehicles SET assigned_driver_id = NULL, status = $1, updated_at = NOW() WHERE id = $2',
      ['available', trip.vehicle_id]
    );
    
    // Mark driver as available
    await query(
      'UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2',
      ['available', trip.driver_id]
    );

    // Set end time if completing
    if (status === 'completed') {
      await query(
        'UPDATE trips SET end_time = NOW() WHERE id = $1',
        [id]
      );
    }
  }

  // Emit real-time update
  io.emit('trip-status-updated', {
    tripId: id,
    status,
    trip: result.rows[0]
  });

  const response: ApiResponse = {
    success: true,
    message: 'Trip status updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});
