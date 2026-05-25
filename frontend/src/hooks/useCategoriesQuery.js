import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Default empty categories — used when backend is unavailable.
 */
const EMPTY_CATEGORIES = {
  categories: [],
  businessType: null,
  businessTypes: [],
  totalProducts: 0,
};

/**
 * React Query hook for shop categories.
 * Fetches GET /api/settings/categories with Clerk Bearer token.
 * Stale time: 60s, refetches on window focus.
 */
export const useCategoriesQuery = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['settings', 'categories'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return EMPTY_CATEGORIES;

      const url = `${API_BASE_URL}/settings/categories`;

      let response;
      try {
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (networkErr) {
        console.error('Categories network error:', networkErr.message);
        return EMPTY_CATEGORIES;
      }

      if (!response.ok) {
        console.warn('Categories API returned', response.status);
        return EMPTY_CATEGORIES;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        return EMPTY_CATEGORIES;
      }

      return result.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export default useCategoriesQuery;
