'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { MapPin, Car, User, Route, Navigation } from 'lucide-react'
import { type Vehicle, type Driver, type Trip } from '@repo/database'

interface LiveTrackingProps {
  vehicles: Vehicle[]
  drivers: Driver[]
  trips: Trip[]
}

export default function LiveTracking({ vehicles, drivers, trips }: LiveTrackingProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedDriver, setSelectedDriver] = null
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }) // Default to NYC
  const [zoom, setZoom] = useState(10)

  // Mock location updates for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate location updates
      console.log('Updating locations...')
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const activeTrips = trips.filter(trip => trip.status === 'in_progress')
  const vehiclesInUse = vehicles.filter(vehicle => vehicle.status === 'in_use')

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'in_use': return 'bg-blue-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'out_of_service': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'on_trip': return 'bg-blue-500'
      case 'off_duty': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Tracking</h2>
          <p className="text-gray-600">Monitor vehicles and drivers in real-time</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Navigation className="w-4 h-4 mr-2" />
            Center Map
          </Button>
          <Button variant="outline" size="sm">
            <Route className="w-4 h-4 mr-2" />
            Show Routes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Live Map View
              </CardTitle>
              <CardDescription>
                Real-time location of vehicles and drivers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-full">
              {/* Placeholder for map - in real implementation, use Leaflet or Google Maps */}
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Map Integration</h3>
                  <p className="text-gray-500 text-sm">
                    This would integrate with Leaflet or Google Maps API<br />
                    to show real-time vehicle and driver locations
                  </p>
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <div className="text-sm text-gray-600 mb-2">Current Map Center:</div>
                    <div className="font-mono text-xs">
                      Lat: {mapCenter.lat.toFixed(4)}, Lng: {mapCenter.lng.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Zoom: {zoom}x</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Status Panel */}
        <div className="space-y-4">
          {/* Active Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Route className="w-5 h-5 mr-2 text-purple-600" />
                Active Trips ({activeTrips.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTrips.length === 0 ? (
                <p className="text-gray-500 text-sm">No active trips</p>
              ) : (
                activeTrips.map((trip) => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicle_id)
                  const driver = drivers.find(d => d.id === trip.driver_id)
                  
                  return (
                    <div key={trip.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm">Trip #{trip.id.slice(0, 8)}</div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          In Progress
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Vehicle: {vehicle?.license_plate || 'Unknown'}</div>
                        <div>Driver: {driver?.user_id || 'Unknown'}</div>
                        <div>From: {trip.start_location.address}</div>
                        <div>To: {trip.end_location.address}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Vehicles Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Car className="w-5 h-5 mr-2 text-blue-600" />
                Vehicles Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getVehicleStatusColor('available')}`}></div>
                  <span>Available</span>
                  <span className="ml-auto font-medium">
                    {vehicles.filter(v => v.status === 'available').length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getVehicleStatusColor('in_use')}`}></div>
                  <span>In Use</span>
                  <span className="ml-auto font-medium">
                    {vehicles.filter(v => v.status === 'in_use').length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getVehicleStatusColor('maintenance')}`}></div>
                  <span>Maintenance</span>
                  <span className="ml-auto font-medium">
                    {vehicles.filter(v => v.status === 'maintenance').length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getVehicleStatusColor('out_of_service')}`}></div>
                  <span>Out of Service</span>
                  <span className="ml-auto font-medium">
                    {vehicles.filter(v => v.status === 'out_of_service').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drivers Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Drivers Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getDriverStatusColor('available')}`}></div>
                  <span>Available</span>
                  <span className="ml-auto font-medium">
                    {drivers.filter(d => d.status === 'available').length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getDriverStatusColor('on_trip')}`}></div>
                  <span>On Trip</span>
                  <span className="ml-auto font-medium">
                    {drivers.filter(d => d.status === 'on_trip').length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getDriverStatusColor('off_duty')}`}></div>
                  <span>Off Duty</span>
                  <span className="ml-auto font-medium">
                    {drivers.filter(d => d.status === 'off_duty').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Car className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Route className="w-4 h-4 mr-2" />
                Create Trip
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vehicle Details Panel */}
      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-5 h-5 mr-2 text-blue-600" />
              Vehicle Details: {selectedVehicle.license_plate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-600">Make/Model</div>
                <div>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Status</div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getVehicleStatusColor(selectedVehicle.status)}`}>
                  {selectedVehicle.status.replace('_', ' ')}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Capacity</div>
                <div>{selectedVehicle.capacity} passengers</div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Location</div>
                <div className="font-mono text-xs">
                  {selectedVehicle.current_location.lat.toFixed(4)}, {selectedVehicle.current_location.lng.toFixed(4)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
