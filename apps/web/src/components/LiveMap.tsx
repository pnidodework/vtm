'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Car, User } from 'lucide-react';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// Import Leaflet for icon creation
let L: any = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

import { type Vehicle, type Driver, type Trip } from '@repo/database';

interface LiveMapProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  selectedVehicle?: Vehicle | null;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

// Custom marker icons
const createCustomIcon = (type: 'vehicle' | 'driver', status: string) => {
  const color = getStatusColor(status);
  return `
    <div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
    ">
      ${type === 'vehicle' ? '🚗' : '👤'}
    </div>
  `;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return '#10B981'; // green
    case 'in_use': return '#3B82F6'; // blue
    case 'on_trip': return '#8B5CF6'; // purple
    case 'maintenance': return '#F59E0B'; // yellow
    case 'off_duty': return '#6B7280'; // gray
    case 'out_of_service': return '#EF4444'; // red
    default: return '#6B7280';
  }
};

export default function LiveMap({ vehicles, drivers, trips, selectedVehicle, onVehicleSelect }: LiveMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]); // Bengaluru, Karnataka default

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate map center based on vehicle locations
  useEffect(() => {
    if (vehicles.length > 0) {
      const avgLat = vehicles.reduce((sum, v) => sum + v.current_location.lat, 0) / vehicles.length;
      const avgLng = vehicles.reduce((sum, v) => sum + v.current_location.lng, 0) / vehicles.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [vehicles]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Loading Map...</h3>
          <p className="text-gray-500 text-sm">Initializing map components</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={18}
          minZoom={3}
        />
        
        {/* Bengaluru City Center Marker */}
        <Marker
          position={mapCenter}
          icon={L ? L.divIcon({
            html: '<div style="background-color: #3B82F6; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🏙️</div>',
            className: 'custom-marker',
            iconSize: [25, 25],
            iconAnchor: [12, 12],
          }) : undefined}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">🏙️ Bengaluru City Center</h3>
              <p className="text-xs text-gray-600">Karnataka, India</p>
              <p className="text-xs text-gray-500 mt-1">12.9716°N, 77.5946°E</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={`vehicle-${vehicle.id}`}
            position={[vehicle.current_location.lat, vehicle.current_location.lng]}
            icon={L ? L.divIcon({
              html: createCustomIcon('vehicle', vehicle.status),
              className: 'custom-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }) : undefined}
            eventHandlers={{
              click: () => onVehicleSelect?.(vehicle),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-1">{vehicle.license_plate}</h3>
                <p className="text-xs text-gray-600 mb-1">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p className="text-xs">
                  Status: <span className={`font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status.replace('_', ' ')}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Capacity: {vehicle.capacity} passengers
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Driver Markers */}
        {drivers.map((driver) => (
          <Marker
            key={`driver-${driver.id}`}
            position={[driver.current_location.lat, driver.current_location.lng]}
            icon={L ? L.divIcon({
              html: createCustomIcon('driver', driver.status),
              className: 'custom-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }) : undefined}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-1">Driver {driver.id.slice(0, 8)}</h3>
                <p className="text-xs">
                  Status: <span className={`font-medium ${getStatusColor(driver.status)}`}>
                    {driver.status.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 flex items-center justify-center text-white text-xs">🏙️</div>
            <span>Bengaluru Center</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>In Use</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span>On Trip</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>Out of Service</span>
          </div>
        </div>
      </div>

      {/* Map Stats */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
        <div className="text-xs text-gray-600">
          <div>Vehicles: {vehicles.length}</div>
          <div>Drivers: {drivers.length}</div>
          <div>Active Trips: {trips.filter(t => t.status === 'in_progress').length}</div>
        </div>
      </div>
    </div>
  );
}
