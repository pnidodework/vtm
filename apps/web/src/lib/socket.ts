import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Socket {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Vehicle tracking methods
  joinVehicleTracking(vehicleId: string) {
    if (this.socket) {
      this.socket.emit('join-vehicle-tracking', vehicleId);
    }
  }

  leaveVehicleTracking(vehicleId: string) {
    if (this.socket) {
      this.socket.emit('leave-vehicle-tracking', vehicleId);
    }
  }

  // Event listeners
  onLocationUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('location-update', callback);
    }
  }

  onVehicleUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('vehicle-updated', callback);
    }
  }

  onTripCreated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('trip-created', callback);
    }
  }

  onTripUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('trip-updated', callback);
    }
  }

  onTripStatusUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('trip-status-updated', callback);
    }
  }

  onDriverLocationUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('driver-location-update', callback);
    }
  }

  // Remove event listeners
  offLocationUpdate(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('location-update', callback);
    }
  }

  offVehicleUpdated(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('vehicle-updated', callback);
    }
  }

  offTripCreated(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('trip-created', callback);
    }
  }

  offTripUpdated(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('trip-updated', callback);
    }
  }

  offTripStatusUpdated(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('trip-status-updated', callback);
    }
  }

  offDriverLocationUpdate(callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off('driver-location-update', callback);
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create and export a singleton instance
export const socketManager = new SocketManager();
export default socketManager;
