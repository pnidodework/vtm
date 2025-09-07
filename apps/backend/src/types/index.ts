import { Request } from 'express';
import { Server as SocketIOServer } from 'socket.io';

// Extend Express Request interface
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  io?: SocketIOServer;
}

// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'driver' | 'user';
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'driver' | 'user';
  password: string;
}

export interface UpdateUserData {
  email?: string;
  full_name?: string;
  role?: 'admin' | 'manager' | 'driver' | 'user';
  password?: string;
}

// Vehicle types
export interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  current_location: {
    lat: number;
    lng: number;
  };
  assigned_driver_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVehicleData {
  license_plate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  current_location?: {
    lat: number;
    lng: number;
  };
}

export interface UpdateVehicleData {
  license_plate?: string;
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  current_location?: {
    lat: number;
    lng: number;
  };
  assigned_driver_id?: string;
}

// Driver types
export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: Date;
  phone_number: string;
  status: 'available' | 'on_trip' | 'off_duty';
  current_location: {
    lat: number;
    lng: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface CreateDriverData {
  user_id: string;
  license_number: string;
  license_expiry: string;
  phone_number: string;
  status?: 'available' | 'on_trip' | 'off_duty';
  current_location?: {
    lat: number;
    lng: number;
  };
}

export interface UpdateDriverData {
  license_number?: string;
  license_expiry?: string;
  phone_number?: string;
  status?: 'available' | 'on_trip' | 'off_duty';
  current_location?: {
    lat: number;
    lng: number;
  };
}

// Trip types
export interface Trip {
  id: string;
  vehicle_id: string;
  driver_id: string;
  start_location: {
    lat: number;
    lng: number;
    address: string;
  };
  end_location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_time: Date;
  end_time?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTripData {
  vehicle_id: string;
  driver_id: string;
  start_location: {
    lat: number;
    lng: number;
    address: string;
  };
  end_location: {
    lat: number;
    lng: number;
    address: string;
  };
  start_time: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface UpdateTripData {
  vehicle_id?: string;
  driver_id?: string;
  start_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  end_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_time?: string;
  end_time?: string;
}

// Location update types
export interface LocationUpdate {
  id: string;
  vehicle_id: string;
  driver_id: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export interface CreateLocationUpdateData {
  vehicle_id: string;
  driver_id: string;
  location: {
    lat: number;
    lng: number;
  };
  speed?: number;
  heading?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter types
export interface VehicleFilters extends PaginationParams {
  status?: string;
  make?: string;
  model?: string;
  year?: number;
}

export interface DriverFilters extends PaginationParams {
  status?: string;
  license_expiry?: string;
}

export interface TripFilters extends PaginationParams {
  status?: string;
  vehicle_id?: string;
  driver_id?: string;
  start_date?: string;
  end_date?: string;
}
