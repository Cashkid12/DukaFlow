import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Default empty filters — used when backend is unavailable.
 */
const EMPTY_FILTERS = {
  categories: [],
  attributes: {},
  priceRange: { min: 0, max: 0 },
};

/**
 * React Query hook for dynamic inventory filters.
 * Fetches GET /api/products/filters with Clerk Bearer token.
 * Stale time: 60s, refetches on window focus.
 */
export const useFiltersQuery = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['inventory', 'filters'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return EMPTY_FILTERS;

      const url = `${API_BASE_URL}/products/filters`;

      let response;
      try {
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (networkErr) {
        console.error('Filters network error:', networkErr.message);
        return EMPTY_FILTERS;
      }

      if (!response.ok) {
        console.warn('Filters API returned', response.status);
        return EMPTY_FILTERS;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        return EMPTY_FILTERS;
      }

      return result.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export default useFiltersQuery;
