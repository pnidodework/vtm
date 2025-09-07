-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'driver', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
    current_location JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}',
    assigned_driver_id UUID REFERENCES drivers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'off_duty')),
    current_location JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    start_location JSONB NOT NULL,
    end_location JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location updates table for tracking history
CREATE TABLE location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    location JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    speed DECIMAL(5,2),
    heading DECIMAL(5,2)
);

-- Create indexes for better performance
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_location_updates_vehicle_id ON location_updates(vehicle_id);
CREATE INDEX idx_location_updates_timestamp ON location_updates(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (email, full_name, role) VALUES
('admin@transport.com', 'System Administrator', 'admin'),
('manager@transport.com', 'Fleet Manager', 'manager'),
('driver1@transport.com', 'John Driver', 'driver'),
('driver2@transport.com', 'Jane Driver', 'driver'),
('user@transport.com', 'Regular User', 'user');

-- Insert sample vehicles
INSERT INTO vehicles (license_plate, make, model, year, capacity, current_location) VALUES
('ABC123', 'Toyota', 'Camry', 2020, 5, '{"lat": 40.7128, "lng": -74.0060}'),
('XYZ789', 'Honda', 'Civic', 2021, 5, '{"lat": 40.7589, "lng": -73.9851}'),
('DEF456', 'Ford', 'Transit', 2019, 12, '{"lat": 40.7505, "lng": -73.9934}');

-- Insert sample drivers
INSERT INTO drivers (user_id, license_number, license_expiry, phone_number, current_location) VALUES
((SELECT id FROM users WHERE email = 'driver1@transport.com'), 'DL123456', '2025-12-31', '+1234567890', '{"lat": 40.7128, "lng": -74.0060}'),
((SELECT id FROM users WHERE email = 'driver2@transport.com'), 'DL789012', '2025-06-30', '+1234567891', '{"lat": 40.7589, "lng": -73.9851}');

-- Insert sample trips
INSERT INTO trips (vehicle_id, driver_id, start_location, end_location, start_time, status) VALUES
((SELECT id FROM vehicles WHERE license_plate = 'ABC123'), (SELECT id FROM drivers WHERE license_number = 'DL123456'), 
 '{"lat": 40.7128, "lng": -74.0060, "address": "New York, NY"}', 
 '{"lat": 40.7589, "lng": -73.9851, "address": "Times Square, NY"}', 
 NOW() + INTERVAL '1 hour', 'scheduled');
