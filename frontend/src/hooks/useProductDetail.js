import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * React Query hooks for Product Detail page.
 */

// Fetch single product
export const useProductDetail = (productId) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const url = `${API_BASE_URL}/products/${productId}`;
      let response;
      try {
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (networkErr) {
        throw new Error('Unable to load product details');
      }

      if (!response.ok) {
        if (response.status === 404) throw new Error('Product not found');
        throw new Error('Failed to load product');
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error('Product data unavailable');
      }
      return result.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!productId,
  });
};

// Fetch price history
export const usePriceHistory = (productId) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['product', productId, 'priceHistory'],
    queryFn: async () => {
      if (!productId) return [];
      const token = await getToken();
      if (!token) return [];

      const url = `${API_BASE_URL}/products/${productId}/price-history`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return [];
      const result = await response.json();
      return result.success ? result.data : [];
    },
    staleTime: 60 * 1000,
    enabled: !!productId,
  });
};

// Fetch stock history
export const useStockHistory = (productId) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['product', productId, 'stockHistory'],
    queryFn: async () => {
      if (!productId) return [];
      const token = await getToken();
      if (!token) return [];

      const url = `${API_BASE_URL}/products/${productId}/stock-history`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return [];
      const result = await response.json();
      return result.success ? result.data : [];
    },
    staleTime: 60 * 1000,
    enabled: !!productId,
  });
};

// Mutations
export const useUpdateProduct = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutate = async ({ productId, data }) => {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update product');
    }

    const result = await response.json();
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    return result.data;
  };

  return mutate;
};

export const useDeleteProduct = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutate = async (productId) => {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }

    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  return mutate;
};

export const useRestockProduct = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutate = async ({ productId, quantity, newCostPrice, newSellingPrice, supplier }) => {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/products/${productId}/restock`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity, newCostPrice, newSellingPrice, supplier }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to restock product');
    }

    const result = await response.json();
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
    queryClient.invalidateQueries({ queryKey: ['product', productId, 'stockHistory'] });
    queryClient.invalidateQueries({ queryKey: ['product', productId, 'priceHistory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    return result.data;
  };

  return mutate;
};

export const useUploadImage = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutate = async ({ productId, imageUrl }) => {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/products/${productId}/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    return result.data;
  };

  return mutate;
};
