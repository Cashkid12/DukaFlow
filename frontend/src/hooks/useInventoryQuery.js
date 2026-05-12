import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Empty inventory structure — returned when backend is unavailable
 * or shop has no products yet. NEVER shows an error to the user.
 */
const EMPTY_INVENTORY = {
  hasData: false,
  products: [],
  total: 0,
  categories: ['Trousers', 'Shirts', 'Dresses', 'Jackets', 'Shoes', 'Accessories'],
  filters: {
    sizes: [],
    colors: [],
    brands: [],
  },
};

/**
 * React Query hook for inventory products.
 * - Fetches GET /api/products with Clerk Bearer token
 * - On network error: throws so component can show error UI with retry
 * - On HTTP error (4xx/5xx): returns EMPTY_INVENTORY gracefully
 * - 30s stale time, refetches on window focus
 */
export const useInventoryQuery = (filters = {}) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['inventory', filters],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        return EMPTY_INVENTORY;
      }

      // Build query params
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.stockStatus && filters.stockStatus !== 'all') params.append('stockStatus', filters.stockStatus);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      params.append('page', filters.page || '1');
      params.append('limit', '20');

      const queryString = params.toString();
      const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;

      let response;
      try {
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (networkErr) {
        console.error('Inventory network error:', networkErr.message);
        throw new Error('Unable to load inventory data');
      }

      if (!response.ok) {
        console.warn('Inventory API returned', response.status);
        return EMPTY_INVENTORY;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        return EMPTY_INVENTORY;
      }

      return {
        hasData: result.data.total > 0,
        products: result.data.products || [],
        total: result.data.total || 0,
        page: result.data.page || 1,
        totalPages: result.data.totalPages || 1,
        hasMore: result.data.hasMore ?? false,
        categories: result.data.categories?.length
          ? result.data.categories
          : EMPTY_INVENTORY.categories,
        filters: result.data.filters || EMPTY_INVENTORY.filters,
      };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  return {
    ...query,
    data: query.data || EMPTY_INVENTORY,
    invalidate,
  };
};

export default useInventoryQuery;
