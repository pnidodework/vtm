# Vehicle Transport Management System - Backend API

A robust Node.js backend API built with Express.js and TypeScript for managing vehicle transport operations.

## Features

- 🚀 **RESTful API** - Complete CRUD operations for all entities
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 🗄️ **PostgreSQL Database** - Robust data persistence with connection pooling
- 📍 **Real-time Updates** - Socket.IO for live location tracking
- 🛡️ **Security** - Helmet, CORS, rate limiting, input validation
- 📊 **Monitoring** - Health checks, logging, error handling
- 🔄 **Auto-reload** - Nodemon for development

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, bcryptjs
- **Development**: Nodemon, ts-node

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create vehicle (Manager/Admin)
- `PUT /api/vehicles/:id` - Update vehicle (Manager/Admin)
- `DELETE /api/vehicles/:id` - Delete vehicle (Manager/Admin)
- `POST /api/vehicles/:id/assign-driver` - Assign driver to vehicle
- `PUT /api/vehicles/:id/location` - Update vehicle location

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get driver by ID
- `POST /api/drivers` - Create driver (Manager/Admin)
- `PUT /api/drivers/:id` - Update driver (Manager/Admin)
- `DELETE /api/drivers/:id` - Delete driver (Manager/Admin)
- `PUT /api/drivers/:id/location` - Update driver location

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get trip by ID
- `POST /api/trips` - Create trip (Manager/Admin)
- `PUT /api/trips/:id` - Update trip (Manager/Admin)
- `DELETE /api/trips/:id` - Delete trip (Manager/Admin)
- `PATCH /api/trips/:id/status` - Update trip status

### Location Tracking
- `POST /api/locations/update` - Add location update
- `GET /api/locations/vehicle/:vehicleId/history` - Get vehicle location history
- `GET /api/locations/live` - Get live locations of all vehicles/drivers

## Setup Instructions

### 1. Environment Configuration

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

Update `.env` with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=db.qbeavkzpxotysnboibyp.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_actual_password
DATABASE_URL=postgresql://postgres:your_actual_password@db.qbeavkzpxotysnboibyp.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Make sure your PostgreSQL database is set up with the schema from `../../supabase/schema.sql`.

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:50001`

### 5. Production Build

```bash
npm run build
npm start
```

## API Documentation

### Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... } // Only for paginated endpoints
}
```

### Error Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Real-time Features

The API includes Socket.IO for real-time updates:

### Events Emitted

- `vehicle-updated` - When vehicle information changes
- `location-update` - When vehicle/driver location updates
- `trip-created` - When a new trip is created
- `trip-updated` - When trip information changes
- `trip-status-updated` - When trip status changes
- `driver-location-update` - When driver location updates

### Socket.IO Client Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join vehicle tracking room
socket.emit('join-vehicle-tracking', vehicleId);

// Listen for location updates
socket.on('location-update', (data) => {
  console.log('Location update:', data);
});
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin, Manager, Driver, User roles
- **Input Validation** - Joi schema validation for all inputs
- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Configurable cross-origin requests
- **Helmet** - Security headers
- **Password Hashing** - bcryptjs for secure password storage

## Database Schema

The backend uses the following main tables:

- `users` - System users with roles
- `vehicles` - Fleet vehicles
- `drivers` - Driver profiles
- `trips` - Trip management
- `location_updates` - Location tracking history

## Health Check

The API includes a health check endpoint:

```
GET /health
```

Returns server status, uptime, and environment information.

**Health Check URL:** `http://localhost:50001/health`

## Development

### Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── routes/          # API routes
├── types/           # TypeScript type definitions
└── index.ts         # Application entry point
```

### Adding New Features

1. Define types in `src/types/index.ts`
2. Create controller in `src/controllers/`
3. Add routes in `src/routes/`
4. Update middleware if needed
5. Add validation schemas

### Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Deployment

### Environment Variables

Ensure all required environment variables are set in production:

- Database connection details
- JWT secret (use a strong, random secret)
- CORS origin (your frontend URL)
- Node environment

### Production Considerations

- Use a process manager like PM2
- Set up reverse proxy (nginx)
- Enable SSL/TLS
- Configure proper logging
- Set up monitoring and alerts
- Use connection pooling for database
- Implement proper error tracking

## Support

For issues and questions:
- Check the API documentation
- Review error logs
- Verify environment configuration
- Ensure database connectivity
