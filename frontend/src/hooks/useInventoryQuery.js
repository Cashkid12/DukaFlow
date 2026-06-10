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
  totalAll: 0,
  categories: [],
  stockStatus: { inStock: 0, lowStock: 0, outOfStock: 0 },
  filters: { sizes: [], colors: [], brands: [] },
};

/**
 * React Query hook for inventory — ONE API call returns everything.
 * - Fetches ALL products (limit=0) — no server-side filtering
 * - Returns categories (with counts), stockStatus, filters alongside products
 * - Client-side filtering/sorting/pagination happens in the component
 * - staleTime: 30s, auto-refetch every 60s
 * - Socket events trigger invalidateQueries for real-time updates
 */
export const useInventoryQuery = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        return EMPTY_INVENTORY;
      }

      // Fetch ALL products — no filter params, limit=0 means "no limit"
      const params = new URLSearchParams();
      params.append('limit', '0');
      const url = `${API_BASE_URL}/products?${params.toString()}`;

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
        // hasData: true when shop has ANY active products (uses unfiltered totalAll)
        hasData: (result.data.totalAll ?? result.data.total) > 0,
        products: result.data.products || [],
        total: result.data.total || 0,
        totalAll: result.data.totalAll ?? (result.data.total || 0),
        // Categories with counts: [{ name: 'Prescription', count: 5 }, ...]
        categories: result.data.categories || [],
        // Stock status counts: { inStock: 8, lowStock: 2, outOfStock: 0 }
        stockStatus: result.data.stockStatus || { inStock: 0, lowStock: 0, outOfStock: 0 },
        // Dynamic filters (sizes, colors, brands, etc.)
        filters: result.data.filters || EMPTY_INVENTORY.filters,
        page: result.data.page || 1,
        totalPages: result.data.totalPages || 1,
        hasMore: result.data.hasMore ?? false,
      };
    },
    staleTime: 30 * 1000,        // Keep data fresh for 30 seconds
    refetchInterval: 60 * 1000,  // Auto-refresh every 60 seconds
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
