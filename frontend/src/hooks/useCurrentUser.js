import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Hook to fetch the current user's profile (role, permissions, shop, sessions).
 * Caches for 5 minutes — role changes require re-fetch.
 */
export const useCurrentUser = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/auth/me/clerk`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch user profile');
      const result = await res.json();
      return result.success ? result.data : null;
    },
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export default useCurrentUser;
