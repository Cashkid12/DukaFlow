import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Hook to subscribe to real-time inventory updates via Socket.io
 * Invalidates React Query cache on relevant events so the UI refreshes.
 */
export const useInventorySocket = (shopId) => {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!shopId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('📦 Inventory socket connected:', socket.id);
      socket.emit('join_shop', shopId);
    });

    socket.on('product:created', (data) => {
      console.log('➕ Product created:', data?.productId);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('product:updated', (data) => {
      console.log('✏️ Product updated:', data?.productId);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('product:deleted', (data) => {
      console.log('🗑️ Product deleted:', data?.productId);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('stock:updated', (data) => {
      console.log('📊 Stock updated:', data?.productId);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('sale:completed', (data) => {
      console.log('💰 Sale completed — refreshing inventory');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Inventory socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Inventory socket error:', error.message);
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [shopId, queryClient]);

  return socketRef;
};

export default useInventorySocket;
