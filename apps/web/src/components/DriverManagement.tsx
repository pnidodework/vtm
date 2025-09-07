'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { User, Plus, Edit, Trash2, Phone, Calendar } from 'lucide-react'
import { db, type Driver, type User as UserType } from '@repo/database'

interface DriverManagementProps {
  drivers: Driver[]
  users: UserType[]
  onDriversChange: (drivers: Driver[]) => void
}

export default function DriverManagement({ drivers, users, onDriversChange }: DriverManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState({
    user_id: '',
    license_number: '',
    license_expiry: '',
    phone_number: '',
    status: 'available' as const
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDriver) {
        const updated = await db.drivers.update(editingDriver.id, formData)
        onDriversChange(drivers.map(d => d.id === updated.id ? updated : d))
        setEditingDriver(null)
      } else {
        const newDriver = await db.drivers.create({
          ...formData,
          current_location: { lat: 0, lng: 0 }
        })
        onDriversChange([...drivers, newDriver])
      }
      setShowForm(false)
      setFormData({
        user_id: '',
        license_number: '',
        license_expiry: '',
        phone_number: '',
        status: 'available'
      })
    } catch (error) {
      console.error('Error saving driver:', error)
    }
  }

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setFormData({
      user_id: driver.user_id,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      phone_number: driver.phone_number,
      status: driver.status
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await db.drivers.delete(id)
        onDriversChange(drivers.filter(d => d.id !== id))
      } catch (error) {
        console.error('Error deleting driver:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'on_trip': return 'bg-blue-100 text-blue-800'
      case 'off_duty': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name : userId
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-gray-600">Manage your drivers and their information</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</CardTitle>
            <CardDescription>
              {editingDriver ? 'Update driver information' : 'Enter driver details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user_id">User</Label>
                  <select
                    id="user_id"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md"
                    required
                  >
                    <option value="">Select user...</option>
                    {users
                      .filter(user => user.role === 'driver')
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="license_expiry">License Expiry</Label>
                  <Input
                    id="license_expiry"
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
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
                    <option value="on_trip">On Trip</option>
                    <option value="off_duty">Off Duty</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingDriver ? 'Update' : 'Create'} Driver
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingDriver(null)
                    setFormData({
                      user_id: '',
                      license_number: '',
                      license_expiry: '',
                      phone_number: '',
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

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    {getUserName(driver.user_id)}
                  </CardTitle>
                  <CardDescription>
                    License: {driver.license_number}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(driver)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(driver.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Phone:</span>
                <span className="font-medium flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  {driver.phone_number}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>License Expiry:</span>
                <span className="font-medium flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(driver.license_expiry).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                  {driver.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Location:</span>
                <span className="font-medium">
                  {driver.current_location.lat.toFixed(4)}, {driver.current_location.lng.toFixed(4)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
