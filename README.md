# Vehicle Transport Management System

A comprehensive vehicle transport management application built with Next.js, TypeScript, Tailwind CSS, and Supabase. This system provides real-time tracking, driver management, vehicle management, and trip planning capabilities.

## Features

- 🚗 **Vehicle Management**: Add, edit, and manage fleet vehicles
- 👨‍💼 **Driver Management**: Manage drivers and assign them to vehicles
- 👥 **User Management**: Role-based access control (Admin, Manager, Driver, User)
- 🗺️ **Live Tracking**: Real-time location tracking of vehicles and drivers
- 🚀 **Trip Management**: Plan and manage vehicle trips
- 📱 **Responsive Design**: Modern, mobile-friendly interface
- 🔐 **Authentication**: Secure user authentication and authorization
- 📊 **Real-time Updates**: Live status updates and notifications

## Tech Stack

### Frontend
- **Framework**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React hooks, Zustand
- **Maps**: Leaflet (ready for integration)
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT with role-based access control
- **Real-time**: Socket.IO for live updates
- **Security**: Helmet, CORS, rate limiting, input validation

### Architecture
- **Monorepo**: Turbo for build orchestration
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (frontend), Railway/Heroku (backend)

## Project Structure

```
vehicle-transport-system/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   └── components/    # React components
│   │   ├── package.json
│   │   └── tailwind.config.js
│   └── backend/                # Node.js backend API
│       ├── src/
│       │   ├── config/        # Database and app config
│       │   ├── controllers/   # Request handlers
│       │   ├── middleware/    # Custom middleware
│       │   ├── routes/        # API routes
│       │   ├── types/         # TypeScript types
│       │   └── index.ts       # App entry point
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── database/              # Database types and functions
│   └── utils/                 # Shared utilities
├── supabase/                  # Database schema and migrations
├── package.json               # Root package.json
└── turbo.json                 # Turbo configuration
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- PostgreSQL database (or use Supabase)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd vehicle-transport-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy the database schema from `supabase/schema.sql` and run it in your Supabase SQL editor

### 4. Configure environment variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cd apps/web
cp env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qbeavkzpxotysnboibyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZWF2a3pweG90eXNuYm9pYnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzI1NTQsImV4cCI6MjA3MjQwODU1NH0.9azaNrbyLC_yn7sR2rgCnsH7z2ouXP3IOovJicy-pbo
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key  # Optional
```

### 5. Set up the backend

```bash
cd apps/backend
cp env.example .env
```

Edit `apps/backend/.env` with your database credentials:

```env
DB_HOST=db.qbeavkzpxotysnboibyp.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_actual_password
DATABASE_URL=postgresql://postgres:your_actual_password@db.qbeavkzpxotysnboibyp.supabase.co:5432/postgres
JWT_SECRET=your_jwt_secret_key_here
```

### 6. Start the development servers

From the root directory:

```bash
# Start both frontend and backend
npm run dev
```

Or start them separately:

```bash
# Frontend (http://localhost:3000)
cd apps/web && npm run dev

# Backend (http://localhost:50001)
cd apps/backend && npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000) and the backend API at [http://localhost:50001](http://localhost:50001)

## Database Setup

The system uses the following main tables:

- **users**: System users with role-based access
- **vehicles**: Fleet vehicles with status and location
- **drivers**: Driver information and current status
- **trips**: Trip planning and management
- **location_updates**: Real-time location tracking history

Run the schema file in your Supabase SQL editor to create all tables and sample data.

## Usage

### Dashboard Overview

The main dashboard provides:
- Real-time statistics (vehicles, drivers, users, active trips)
- Quick access to all management functions
- Live status updates

### Vehicle Management

- Add new vehicles with detailed information
- Assign drivers to vehicles
- Track vehicle status and location
- Monitor maintenance schedules

### Driver Management

- Register new drivers
- Manage driver licenses and contact information
- Track driver availability and current location
- Assign drivers to vehicles

### Trip Management

- Create new trips with start/end locations
- Assign vehicles and drivers to trips
- Track trip status (scheduled, in progress, completed)
- Monitor active trips in real-time

### Live Tracking

- Real-time map view of all vehicles and drivers
- Live status updates
- Trip progress monitoring
- Location history tracking

## Development

### Adding New Components

Components are built using shadcn/ui and can be added to the `packages/ui` directory:

```bash
cd packages/ui
npm run generate:component
```

### Database Changes

When modifying the database schema:

1. Update the schema file in `supabase/schema.sql`
2. Update the TypeScript types in `packages/database/src/index.ts`
3. Update the database functions as needed

### Styling

The application uses Tailwind CSS with custom CSS variables for theming. All components follow the shadcn/ui design system.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted servers

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the code examples

## Roadmap

- [ ] Real-time notifications
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] Integration with external GPS devices
- [ ] Fuel management and cost tracking
- [ ] Maintenance scheduling system
- [ ] API endpoints for third-party integrations
