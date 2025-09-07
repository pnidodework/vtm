'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Car, Plus, Edit, Trash2, UserCheck } from 'lucide-react'
import { db, type Vehicle, type Driver } from '@repo/database'

interface VehicleManagementProps {
  vehicles: Vehicle[]
  drivers: Driver[]
  onVehiclesChange: (vehicles: Vehicle[]) => void
}

export default function VehicleManagement({ vehicles, drivers, onVehiclesChange }: VehicleManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 1,
    status: 'available' as const
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingVehicle) {
        const updated = await db.vehicles.update(editingVehicle.id, formData)
        onVehiclesChange(vehicles.map(v => v.id === updated.id ? updated : v))
        setEditingVehicle(null)
      } else {
        const newVehicle = await db.vehicles.create({
          ...formData,
          current_location: { lat: 0, lng: 0 }
        })
        onVehiclesChange([...vehicles, newVehicle])
      }
      setShowForm(false)
      setFormData({
        license_plate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: 1,
        status: 'available'
      })
    } catch (error) {
      console.error('Error saving vehicle:', error)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      license_plate: vehicle.license_plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      capacity: vehicle.capacity,
      status: vehicle.status
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await db.vehicles.delete(id)
        onVehiclesChange(vehicles.filter(v => v.id !== id))
      } catch (error) {
        console.error('Error deleting vehicle:', error)
      }
    }
  }

  const assignDriver = async (vehicleId: string, driverId: string) => {
    try {
      const updated = await db.vehicles.assignDriver(vehicleId, driverId)
      onVehiclesChange(vehicles.map(v => v.id === updated.id ? updated : v))
    } catch (error) {
      console.error('Error assigning driver:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'in_use': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_service': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Management</h2>
          <p className="text-gray-600">Manage your fleet of vehicles</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</CardTitle>
            <CardDescription>
              {editingVehicle ? 'Update vehicle information' : 'Enter vehicle details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
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
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of Service</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingVehicle ? 'Update' : 'Create'} Vehicle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingVehicle(null)
                    setFormData({
                      license_plate: '',
                      make: '',
                      model: '',
                      year: new Date().getFullYear(),
                      capacity: 1,
                      status: 'available'
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

      {/* Vehicles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <Car className="w-5 h-5 mr-2 text-blue-600" />
                    {vehicle.license_plate}
                  </CardTitle>
                  <CardDescription>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Capacity:</span>
                <span className="font-medium">{vehicle.capacity} passengers</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status.replace('_', ' ')}
                </span>
              </div>
              {vehicle.assigned_driver_id && (
                <div className="flex justify-between text-sm">
                  <span>Driver:</span>
                  <span className="font-medium">
                    {drivers.find(d => d.id === vehicle.assigned_driver_id)?.user_id || 'Unknown'}
                  </span>
                </div>
              )}
              {!vehicle.assigned_driver_id && vehicle.status === 'available' && (
                <div className="pt-2">
                  <Label htmlFor={`driver-${vehicle.id}`} className="text-sm">Assign Driver:</Label>
                  <select
                    id={`driver-${vehicle.id}`}
                    onChange={(e) => e.target.value && assignDriver(vehicle.id, e.target.value)}
                    className="w-full mt-1 h-8 px-2 py-1 border border-input rounded text-sm"
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
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
