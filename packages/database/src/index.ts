import { createClient } from '@supabase/supabase-js'

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'driver' | 'user'
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  license_plate: string
  make: string
  model: string
  year: number
  capacity: number
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service'
  current_location: {
    lat: number
    lng: number
  }
  assigned_driver_id?: string
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  user_id: string
  license_number: string
  license_expiry: string
  phone_number: string
  status: 'available' | 'on_trip' | 'off_duty'
  current_location: {
    lat: number
    lng: number
  }
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  vehicle_id: string
  driver_id: string
  start_location: {
    lat: number
    lng: number
    address: string
  }
  end_location: {
    lat: number
    lng: number
    address: string
  }
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  start_time: string
  end_time?: string
  created_at: string
  updated_at: string
}

export interface LocationUpdate {
  id: string
  vehicle_id: string
  driver_id: string
  location: {
    lat: number
    lng: number
  }
  timestamp: string
  speed?: number
  heading?: number
}

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database functions
export const db = {
  // User management
  users: {
    async getAll() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as User[]
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as User
    },
    
    async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single()
      if (error) throw error
      return data as User
    },
    
    async update(id: string, updates: Partial<User>) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as User
    },
    
    async delete(id: string) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
  
  // Vehicle management
  vehicles: {
    async getAll() {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Vehicle[]
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Vehicle
    },
    
    async getAvailable() {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Vehicle[]
    },
    
    async create(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single()
      if (error) throw error
      return data as Vehicle
    },
    
    async update(id: string, updates: Partial<Vehicle>) {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Vehicle
    },
    
    async assignDriver(vehicleId: string, driverId: string) {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          assigned_driver_id: driverId,
          status: 'in_use'
        })
        .eq('id', vehicleId)
        .select()
        .single()
      if (error) throw error
      return data as Vehicle
    },
    
    async updateLocation(id: string, location: { lat: number; lng: number }) {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ current_location: location })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Vehicle
    }
  },
  
  // Driver management
  drivers: {
    async getAll() {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Driver[]
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Driver
    },
    
    async getAvailable() {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Driver[]
    },
    
    async create(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driver)
        .select()
        .single()
      if (error) throw error
      return data as Driver
    },
    
    async update(id: string, updates: Partial<Driver>) {
      const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Driver
    },
    
    async updateLocation(id: string, location: { lat: number; lng: number }) {
      const { data, error } = await supabase
        .from('drivers')
        .update({ current_location: location })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Driver
    }
  },
  
  // Trip management
  trips: {
    async getAll() {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Trip[]
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Trip
    },
    
    async getActive() {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Trip[]
    },
    
    async create(trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single()
      if (error) throw error
      return data as Trip
    },
    
    async update(id: string, updates: Partial<Trip>) {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Trip
    }
  },
  
  // Location tracking
  locations: {
    async addUpdate(update: Omit<LocationUpdate, 'id'>) {
      const { data, error } = await supabase
        .from('location_updates')
        .insert(update)
        .select()
        .single()
      if (error) throw error
      return data as LocationUpdate
    },
    
    async getVehicleHistory(vehicleId: string, hours: number = 24) {
      const { data, error } = await supabase
        .from('location_updates')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true })
      if (error) throw error
      return data as LocationUpdate[]
    }
  }
}
