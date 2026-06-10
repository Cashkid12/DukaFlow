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
 * - worker:invited → Update worker list
 * - worker:role-changed → Update sidebar and permissions
 * - worker:session-terminated → User logged out on that device
 * - worker:removed → User cannot access shop anymore
 * - worker:reactivated → User can access shop again
 * - product:created → New product added, update stats
 * - product:updated → Product modified, recalculate stats
 * - product:deleted → Product removed, recalculate stats
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (shopId, callbacks = {}) => {
  useEffect(() => {
    if (!shopId) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    // Join shop room
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      socket.emit('join:shop', shopId);
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

    socket.on('worker:logout', (data) => {
      console.log('👤 Worker logged out:', data);
      callbacks.onWorkerLogout?.(data);
    });

    socket.on('alert:new', (data) => {
      console.log('🔔 New alert:', data);
      callbacks.onAlertNew?.(data);
    });

    socket.on('worker:invited', (data) => {
      console.log('👤 Worker invited:', data);
      callbacks.onWorkerInvited?.(data);
    });

    socket.on('worker:role-changed', (data) => {
      console.log('🔄 Worker role changed:', data);
      callbacks.onWorkerRoleChanged?.(data);
    });

    socket.on('worker:session-terminated', (data) => {
      console.log('🚪 Session terminated:', data);
      callbacks.onSessionTerminated?.(data);
    });

    socket.on('worker:removed', (data) => {
      console.log('🗑️ Worker removed:', data);
      callbacks.onWorkerRemoved?.(data);
    });

    socket.on('worker:reactivated', (data) => {
      console.log('✅ Worker reactivated:', data);
      callbacks.onWorkerReactivated?.(data);
    });

    // Product lifecycle events — keep dashboard stats in sync
    socket.on('product:created', (data) => {
      console.log('➕ Product created:', data?.productId);
      callbacks.onProductCreated?.(data);
    });

    socket.on('product:updated', (data) => {
      console.log('✏️ Product updated:', data?.productId);
      callbacks.onProductUpdated?.(data);
    });

    socket.on('product:deleted', (data) => {
      console.log('🗑️ Product deleted:', data?.productId);
      callbacks.onProductDeleted?.(data);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket unavailable — using HTTP only:', error.message);
      // Don't crash — app works fine with regular API calls
    });

    socket.on('reconnect_failed', () => {
      console.warn('⚠️ WebSocket reconnection failed — using HTTP only');
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
