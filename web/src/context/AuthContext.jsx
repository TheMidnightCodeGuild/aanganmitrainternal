import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.getCurrentUser();
          setUser(response.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear user state and token on authentication failure
          setUser(null);
          setAuthError('Your session has expired. Please login again.');
          apiService.logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setLoading(false);
    setAuthError(null); // Clear any previous auth errors
  };

  const logout = () => {
    setUser(null);
    setLoading(false);
    setAuthError(null);
    apiService.logout();
  };

  // Function to handle authentication failures from API calls
  const handleAuthFailure = () => {
    setUser(null);
    setLoading(false);
    setAuthError('Your session has expired. Please login again.');
    apiService.logout();
  };

  // Clear auth error
  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      handleAuthFailure,
      isAuthenticated: !!user,
      authError,
      clearAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
