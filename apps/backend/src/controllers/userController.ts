import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest, CreateUserData, UpdateUserData, ApiResponse } from '../types';
import { query } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';

// Get all users
export const getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const sortOrderStr = Array.isArray(sortOrder) ? String(sortOrder[0]) : String(sortOrder);
  const offset = (Number(page) - 1) * Number(limit);

  // Get total count
  const countResult = await query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count);

  // Get users with pagination
  const result = await query(
    `SELECT id, email, full_name, role, created_at, updated_at 
     FROM users 
     ORDER BY ${sortBy} ${sortOrderStr.toUpperCase()} 
     LIMIT $1 OFFSET $2`,
    [Number(limit), offset]
  );

  const response: ApiResponse = {
    success: true,
    message: 'Users retrieved successfully',
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

// Get user by ID
export const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'User retrieved successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Create new user
export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, full_name, role, password }: CreateUserData = req.body;

  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await query(
    `INSERT INTO users (email, full_name, role, password_hash) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, email, full_name, role, created_at, updated_at`,
    [email, full_name, role, password_hash]
  );

  const response: ApiResponse = {
    success: true,
    message: 'User created successfully',
    data: result.rows[0]
  };

  res.status(201).json(response);
});

// Update user
export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateUserData = req.body;

  // Check if user exists
  const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
  if (existingUser.rows.length === 0) {
    throw createError('User not found', 404);
  }

  // Check if email is being updated and if it's already taken
  if (updateData.email) {
    const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [updateData.email, id]);
    if (emailCheck.rows.length > 0) {
      throw createError('Email is already taken', 409);
    }
  }

  let updateFields: string[] = [];
  let values: any[] = [];
  let paramCount = 1;

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined && key !== 'password') {
      updateFields.push(`${key} = $${paramCount++}`);
      values.push(value);
    }
  });

  // Handle password update separately
  if (updateData.password) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(updateData.password, saltRounds);
    updateFields.push(`password_hash = $${paramCount++}`);
    values.push(password_hash);
  }

  if (updateFields.length === 0) {
    throw createError('No fields to update', 400);
  }

  updateFields.push('updated_at = NOW()');
  values.push(id);

  const result = await query(
    `UPDATE users SET ${updateFields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, email, full_name, role, created_at, updated_at`,
    values
  );

  const response: ApiResponse = {
    success: true,
    message: 'User updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});

// Delete user
export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
  if (existingUser.rows.length === 0) {
    throw createError('User not found', 404);
  }

  // Check if user is assigned as a driver
  const driverCheck = await query('SELECT id FROM drivers WHERE user_id = $1', [id]);
  if (driverCheck.rows.length > 0) {
    throw createError('Cannot delete user who is assigned as a driver', 400);
  }

  // Check if user has any active trips
  const activeTrips = await query('SELECT id FROM trips WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = $1) AND status IN ($2, $3)', [id, 'scheduled', 'in_progress']);
  if (activeTrips.rows.length > 0) {
    throw createError('Cannot delete user with active trips', 400);
  }

  await query('DELETE FROM users WHERE id = $1', [id]);

  const response: ApiResponse = {
    success: true,
    message: 'User deleted successfully'
  };

  res.json(response);
});
