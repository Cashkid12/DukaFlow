import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Hook to subscribe to real-time dashboard updates via Socket.io
 * @param {string} shopId - The shop ID to subscribe to
 * @param {Function} onUpdate - Callback function when update received
 */
export const useDashboardSocket = (shopId, onUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!shopId || !onUpdate) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Join shop-specific room
    socket.on('connect', () => {
      console.log('🔌 Connected to Socket.io');
      socket.emit('join:shop', shopId);
    });

    // Listen for dashboard updates
    socket.on('dashboard:update', (data) => {
      console.log('📊 Dashboard update received:', data.type);
      onUpdate(data);
    });

    // Listen for full dashboard refresh
    socket.on('dashboard:refresh', () => {
      console.log('🔄 Full dashboard refresh triggered');
      onUpdate({ type: 'refresh' });
    });

    // Handle errors
    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.emit('leave:shop', shopId);
        socket.disconnect();
      }
    };
  }, [shopId, onUpdate]);

  return socketRef;
};

export default useDashboardSocket;
