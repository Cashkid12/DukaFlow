import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EMPTY_POS = {
  hasProducts: false,
  products: [],
  total: 0,
  categories: [],
};

/**
 * Hook to fetch sellable products for the POS.
 * Returns only in_stock or low_stock products with quantity > 0.
 */
export const useSalesQuery = (filters = {}) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['sales', 'products', filters],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return EMPTY_POS;

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      params.append('sortBy', filters.sortBy || 'name');
      params.append('sortOrder', filters.sortOrder || 'asc');
      params.append('limit', '100');

      const url = `${API_BASE_URL}/products?${params.toString()}`;

      let response;
      try {
        response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      } catch {
        throw new Error('Unable to load products');
      }

      if (!response.ok) return EMPTY_POS;

      const result = await response.json();
      if (!result.success || !result.data) return EMPTY_POS;

      // Filter to only sellable products (in_stock or low_stock, qty > 0)
      const sellable = (result.data.products || []).filter(
        (p) => p.stock > 0
      );

      return {
        hasProducts: sellable.length > 0 || result.data.total > 0,
        products: sellable,
        total: sellable.length,
        categories: result.data.categories || [],
      };
    },
    staleTime: 20 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Hook to fetch workers for the shop.
 */
export const useWorkersQuery = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];

      const url = `${API_BASE_URL}/workers`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return [];
      const result = await response.json();
      return result.success ? result.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export default useSalesQuery;
