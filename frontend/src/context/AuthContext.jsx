import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // TODO: Call API to verify token
      // const response = await api.get('/auth/me');
      // setUser(response.data.user);
      // setShop(response.data.shop);
      // setIsAuthenticated(true);
      
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    // TODO: Implement actual login
    console.log('Login:', credentials);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    // TODO: Call logout API
    setUser(null);
    setShop(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    shop,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
