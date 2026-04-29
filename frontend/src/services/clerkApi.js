import { useAuth } from '@clerk/clerk-react';

/**
 * API Client with Clerk Authentication
 * Automatically attaches Clerk session token to requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create API instance with auth token
 * Use inside React components/hooks
 */
export const useApi = () => {
  const { getToken } = useAuth();

  const authenticatedFetch = async (url, options = {}) => {
    try {
      // Get Clerk session token
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Merge headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      // Make request
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      // Handle errors
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // API Helper Functions
  return {
    // Products
    getProducts: () => authenticatedFetch('/products'),
    createProduct: (data) => authenticatedFetch('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateProduct: (id, data) => authenticatedFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteProduct: (id) => authenticatedFetch(`/products/${id}`, {
      method: 'DELETE',
    }),

    // Sales
    getSales: () => authenticatedFetch('/sales'),
    createSale: (data) => authenticatedFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    // Shop
    getShop: () => authenticatedFetch('/shop'),
    updateShop: (data) => authenticatedFetch('/shop', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    // User
    getProfile: () => authenticatedFetch('/auth/profile'),
    updateProfile: (data) => authenticatedFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  };
};

export default useApi;
