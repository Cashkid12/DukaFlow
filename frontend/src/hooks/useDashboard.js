import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom hook to fetch dashboard data
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Object} { data, loading, error, refetch }
 */
export const useDashboard = (date = null) => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const queryParams = date ? `?date=${date}` : '';
      const response = await fetch(`${API_BASE_URL}/dashboard${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, date]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};

export default useDashboard;
