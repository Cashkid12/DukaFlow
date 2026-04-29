import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Enhanced dashboard hook with React Query
 * Features:
 * - Automatic caching (1 minute stale time)
 * - Background refetching every 60 seconds
 * - Refetch on window focus
 * - Individual component retry
 */
export const useDashboardQuery = (date = null) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['dashboard', date],
    queryFn: async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Not authenticated. Please sign in again.');
        }

        const queryParams = date ? `?date=${date}` : '';
        const response = await fetch(`${API_BASE_URL}/dashboard${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired. Please sign in again.');
          }
          if (response.status === 400) {
            throw new Error(errorData.message || 'Shop not set up. Please complete onboarding.');
          }
          
          throw new Error(errorData.message || 'Failed to fetch dashboard data');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        throw error;
      }
    },
    // Cache strategy
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true,
    retry: 1, // Retry failed requests once
    retryDelay: 1000, // Wait 1 second before retry
  });
};

/**
 * Hook for fetching only chart data (longer cache)
 */
export const useDashboardChart = (date = null) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'chart', date],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const queryParams = date ? `?date=${date}` : '';
      const response = await fetch(`${API_BASE_URL}/dashboard${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch chart data');

      const result = await response.json();
      return result.data.chartData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for chart
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Hook for fetching only alerts (shorter cache)
 */
export const useDashboardAlerts = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch alerts');

      const result = await response.json();
      return result.data.alerts;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export default useDashboardQuery;
