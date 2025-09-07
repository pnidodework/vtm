'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { 
  Car, 
  User, 
  MapPin, 
  Users, 
  Route, 
  Activity,
  Plus,
  Search,
  LogOut
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import VehicleManagement from '@/components/VehicleManagement'
import DriverManagement from '@/components/DriverManagement'
import UserManagement from '@/components/UserManagement'
import LiveTracking from '@/components/LiveTracking'
import TripManagement from '@/components/TripManagement'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, driversResponse, usersResponse, tripsResponse] = await Promise.all([
          apiClient.getVehicles(),
          apiClient.getDrivers(),
          apiClient.getUsers(),
          apiClient.getTrips()
        ])
        
        setVehicles(vehiclesResponse.data || [])
        setDrivers(driversResponse.data || [])
        setUsers(usersResponse.data || [])
        setTrips(tripsResponse.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter(v => v.status === 'available').length,
    totalDrivers: drivers.length,
    availableDrivers: drivers.filter(d => d.status === 'available').length,
    totalUsers: users.length,
    activeTrips: trips.filter(t => t.status === 'in_progress').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Vehicle Transport Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {user?.full_name} ({user?.role})
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Trip
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.availableVehicles} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDrivers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.availableDrivers} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                System users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTrips}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="vehicles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-4">
            <VehicleManagement 
              vehicles={vehicles} 
              drivers={drivers}
              onVehiclesChange={setVehicles}
            />
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <DriverManagement 
              drivers={drivers}
              users={users}
              onDriversChange={setDrivers}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement 
              users={users}
              onUsersChange={setUsers}
            />
          </TabsContent>

          <TabsContent value="trips" className="space-y-4">
            <TripManagement 
              trips={trips}
              vehicles={vehicles}
              drivers={drivers}
              onTripsChange={setTrips}
            />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <LiveTracking 
              vehicles={vehicles}
              drivers={drivers}
              trips={trips}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </ProtectedRoute>
  )
}
