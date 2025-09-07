const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: {
    email: string;
    full_name: string;
    role: string;
    password: string;
  }) {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getProfile() {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/auth/profile');
  }

  async updateProfile(userData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // User management endpoints
  async getUsers(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      pagination?: any;
    }>(`/users${query ? `?${query}` : ''}`);
  }

  async getUserById(id: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Vehicle management endpoints
  async getVehicles(params?: {
    page?: number;
    limit?: number;
    status?: string;
    make?: string;
    model?: string;
    year?: number;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      pagination?: any;
    }>(`/vehicles${query ? `?${query}` : ''}`);
  }

  async getVehicleById(id: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/vehicles/${id}`);
  }

  async createVehicle(vehicleData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  async updateVehicle(id: string, vehicleData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  }

  async deleteVehicle(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  async assignDriverToVehicle(vehicleId: string, driverId: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/vehicles/${vehicleId}/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ driver_id: driverId }),
    });
  }

  async updateVehicleLocation(vehicleId: string, location: { lat: number; lng: number }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/vehicles/${vehicleId}/location`, {
      method: 'PUT',
      body: JSON.stringify(location),
    });
  }

  // Driver management endpoints
  async getDrivers(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      pagination?: any;
    }>(`/drivers${query ? `?${query}` : ''}`);
  }

  async getDriverById(id: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/drivers/${id}`);
  }

  async createDriver(driverData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  }

  async updateDriver(id: string, driverData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });
  }

  async deleteDriver(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/drivers/${id}`, {
      method: 'DELETE',
    });
  }

  async updateDriverLocation(driverId: string, location: { lat: number; lng: number }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/drivers/${driverId}/location`, {
      method: 'PUT',
      body: JSON.stringify(location),
    });
  }

  // Trip management endpoints
  async getTrips(params?: {
    page?: number;
    limit?: number;
    status?: string;
    vehicle_id?: string;
    driver_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      pagination?: any;
    }>(`/trips${query ? `?${query}` : ''}`);
  }

  async getTripById(id: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/trips/${id}`);
  }

  async createTrip(tripData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  async updateTrip(id: string, tripData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  }

  async deleteTrip(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/trips/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTripStatus(id: string, status: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/trips/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Location tracking endpoints
  async addLocationUpdate(locationData: {
    vehicle_id: string;
    driver_id: string;
    location: { lat: number; lng: number };
    speed?: number;
    heading?: number;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/locations/update', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getVehicleLocationHistory(vehicleId: string, params?: {
    hours?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
    }>(`/locations/vehicle/${vehicleId}/history${query ? `?${query}` : ''}`);
  }

  async getLiveLocations() {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        vehicles: any[];
        drivers: any[];
        activeTrips: any[];
      };
    }>('/locations/live');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
