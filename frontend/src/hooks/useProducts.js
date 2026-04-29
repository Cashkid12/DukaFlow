import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Hook to fetch products with filtering and pagination
 */
export const useProducts = (filters = {}) => {
  const { getToken } = useAuth();
  const { 
    search, 
    category, 
    stockStatus, 
    sortBy, 
    sortOrder,
    page = 1,
    limit = 20,
    ...businessFilters 
  } = filters;

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Not authenticated. Please sign in again.');
        }

        // Build query params
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (stockStatus) params.append('stockStatus', stockStatus);
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);
        params.append('page', page);
        params.append('limit', limit);

        // Add business-type specific filters
        Object.entries(businessFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const response = await fetch(`${API_BASE_URL}/products?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            throw new Error('Session expired. Please sign in again.');
          }
          if (response.status === 400) {
            throw new Error(errorData.message || 'Shop not set up. Please complete onboarding.');
          }
          
          throw new Error(errorData.message || 'Failed to fetch products');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Products fetch error:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 1000,
  });
};

/**
 * Hook to fetch inventory statistics
 */
export const useInventoryStats = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['inventory', 'stats'],
    queryFn: async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Not authenticated. Please sign in again.');
        }

        const response = await fetch(`${API_BASE_URL}/products/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            throw new Error('Session expired. Please sign in again.');
          }
          
          throw new Error(errorData.message || 'Failed to fetch inventory stats');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Inventory stats error:', error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 1000,
  });
};

/**
 * Hook to fetch single product
 */
export const useProduct = (productId) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch product');

      const result = await response.json();
      return result.data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useProducts;
