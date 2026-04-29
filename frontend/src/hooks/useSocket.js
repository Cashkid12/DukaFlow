import { useEffect } from 'react';
import { io } from 'socket.io-client';

/**
 * useSocket Hook
 * Manages Socket.io connection for real-time dashboard updates
 * 
 * Events:
 * - sale:completed → Update sales, profit, transactions, worker cards
 * - stock:updated → Update low stock card, alerts
 * - worker:login → Update active workers card, online status
 * - alert:new → Update alerts list, notification badge
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (shopId, callbacks = {}) => {
  useEffect(() => {
    if (!shopId) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Join shop room
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      socket.emit('join_shop', shopId);
    });

    // Listen for real-time events
    socket.on('sale:completed', (data) => {
      console.log('📦 Sale completed:', data);
      callbacks.onSaleCompleted?.(data);
    });

    socket.on('stock:updated', (data) => {
      console.log('📊 Stock updated:', data);
      callbacks.onStockUpdated?.(data);
    });

    socket.on('worker:login', (data) => {
      console.log('👤 Worker logged in:', data);
      callbacks.onWorkerLogin?.(data);
    });

    socket.on('alert:new', (data) => {
      console.log('🔔 New alert:', data);
      callbacks.onAlertNew?.(data);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        console.log('🔌 Socket disconnected (cleanup)');
      }
    };
  }, [shopId]);
};

export default useSocket;
