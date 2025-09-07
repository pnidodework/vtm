'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Route, Plus, Edit, Trash2, MapPin, Clock, Car, User } from 'lucide-react'
import { db, type Trip, type Vehicle, type Driver } from '@repo/database'

interface TripManagementProps {
  trips: Trip[]
  vehicles: Vehicle[]
  drivers: Driver[]
  onTripsChange: (trips: Trip[]) => void
}

export default function TripManagement({ trips, vehicles, drivers, onTripsChange }: TripManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    start_location: { lat: 0, lng: 0, address: '' },
    end_location: { lat: 0, lng: 0, address: '' },
    start_time: '',
    status: 'scheduled' as const
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTrip) {
        const updated = await db.trips.update(editingTrip.id, formData)
        onTripsChange(trips.map(t => t.id === updated.id ? updated : t))
        setEditingTrip(null)
      } else {
        const newTrip = await db.trips.create(formData)
        onTripsChange([...trips, newTrip])
      }
      setShowForm(false)
      setFormData({
        vehicle_id: '',
        driver_id: '',
        start_location: { lat: 0, lng: 0, address: '' },
        end_location: { lat: 0, lng: 0, address: '' },
        start_time: '',
        status: 'scheduled'
      })
    } catch (error) {
      console.error('Error saving trip:', error)
    }
  }

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip)
    setFormData({
      vehicle_id: trip.vehicle_id,
      driver_id: trip.driver_id,
      start_location: trip.start_location,
      end_location: trip.end_location,
      start_time: trip.start_time,
      status: trip.status
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      try {
        await db.trips.delete(id)
        onTripsChange(trips.filter(t => t.id !== id))
      } catch (error) {
        console.error('Error deleting trip:', error)
      }
    }
  }

  const updateTripStatus = async (tripId: string, status: Trip['status']) => {
    try {
      const updated = await db.trips.update(tripId, { status })
      onTripsChange(trips.map(t => t.id === updated.id ? updated : t))
    } catch (error) {
      console.error('Error updating trip status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.license_plate} (${vehicle.make} ${vehicle.model})` : 'Unknown'
  }

  const getDriverInfo = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId)
    return driver ? driver.user_id : 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trip Management</h2>
          <p className="text-gray-600">Manage vehicle trips and routes</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Trip
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTrip ? 'Edit Trip' : 'Create New Trip'}</CardTitle>
            <CardDescription>
              {editingTrip ? 'Update trip information' : 'Enter trip details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle_id">Vehicle</Label>
                  <select
                    id="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md"
                    required
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles
                      .filter(v => v.status === 'available')
                      .map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <Label htmlFor="driver_id">Driver</Label>
                  <select
                    id="driver_id"
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md"
                    required
                  >
                    <option value="">Select driver...</option>
                    {drivers
                      .filter(d => d.status === 'available')
                      .map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.user_id}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="start_address">Start Address</Label>
                  <Input
                    id="start_address"
                    placeholder="Enter start address"
                    value={formData.start_location.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      start_location: { ...formData.start_location, address: e.target.value }
                    })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="end_address">End Address</Label>
                  <Input
                    id="end_address"
                    placeholder="Enter end address"
                    value={formData.end_location.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      end_location: { ...formData.end_location, address: e.target.value }
                    })}
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingTrip ? 'Update' : 'Create'} Trip
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTrip(null)
                    setFormData({
                      vehicle_id: '',
                      driver_id: '',
                      start_location: { lat: 0, lng: 0, address: '' },
                      end_location: { lat: 0, lng: 0, address: '' },
                      start_time: '',
                      status: 'scheduled'
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Trips List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <Card key={trip.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <Route className="w-5 h-5 mr-2 text-purple-600" />
                    Trip #{trip.id.slice(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    {new Date(trip.start_time).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(trip)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(trip.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Vehicle:</span>
                <span className="font-medium flex items-center">
                  <Car className="w-3 h-3 mr-1" />
                  {getVehicleInfo(trip.vehicle_id)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Driver:</span>
                <span className="font-medium flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {getDriverInfo(trip.driver_id)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                  {trip.status.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start text-sm">
                  <MapPin className="w-3 h-3 mr-1 mt-0.5 text-green-600" />
                  <div>
                    <div className="font-medium">From:</div>
                    <div className="text-xs text-gray-600">{trip.start_location.address}</div>
                  </div>
                </div>
                <div className="flex items-start text-sm">
                  <MapPin className="w-3 h-3 mr-1 mt-0.5 text-red-600" />
                  <div>
                    <div className="font-medium">To:</div>
                    <div className="text-xs text-gray-600">{trip.end_location.address}</div>
                  </div>
                </div>
              </div>
              {trip.status === 'scheduled' && (
                <div className="pt-2 space-y-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => updateTripStatus(trip.id, 'in_progress')}
                  >
                    Start Trip
                  </Button>
                </div>
              )}
              {trip.status === 'in_progress' && (
                <div className="pt-2 space-y-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => updateTripStatus(trip.id, 'completed')}
                  >
                    Complete Trip
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
