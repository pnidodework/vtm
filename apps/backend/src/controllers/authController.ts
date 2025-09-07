import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, LoginData, CreateUserData, ApiResponse, AuthResponse } from '../types';
import { query } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';

// Register a new user
export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  const user = result.rows[0];

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret', 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  const response: ApiResponse<AuthResponse> = {
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    }
  };

  res.status(201).json(response);
});

// Login user
export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password }: LoginData = req.body;

  // Find user by email
  const result = await query(
    'SELECT id, email, full_name, role, password_hash, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw createError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret', 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  const response: ApiResponse<AuthResponse> = {
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    }
  };

  res.json(response);
});

// Get user profile
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Profile retrieved successfully',
    data: req.user
  };

  res.json(response);
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, full_name, password } = req.body;
  const userId = req.user!.id;

  let updateFields: string[] = [];
  let values: any[] = [];
  let paramCount = 1;

  if (email) {
    // Check if email is already taken by another user
    const existingUser = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (existingUser.rows.length > 0) {
      throw createError('Email is already taken', 409);
    }
    updateFields.push(`email = $${paramCount++}`);
    values.push(email);
  }

  if (full_name) {
    updateFields.push(`full_name = $${paramCount++}`);
    values.push(full_name);
  }

  if (password) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    updateFields.push(`password_hash = $${paramCount++}`);
    values.push(password_hash);
  }

  if (updateFields.length === 0) {
    throw createError('No fields to update', 400);
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${updateFields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, email, full_name, role, created_at, updated_at`,
    values
  );

  const response: ApiResponse = {
    success: true,
    message: 'Profile updated successfully',
    data: result.rows[0]
  };

  res.json(response);
});
