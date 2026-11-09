import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAccessibility } from './AccessibilityContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nexo360_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const { loadUserPreferences, announce } = useAccessibility();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexo360_token');
    announce('Sesión cerrada correctamente');
  }, [announce]);

  useEffect(() => {
    let isMounted = true;

    const verifyExistingAuth = async () => {
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (!isMounted) return;

        if (response.success && response.user) {
          setUser(response.user);
          if (response.user.accessibilityPreferences) {
            loadUserPreferences(response.user.accessibilityPreferences);
          }
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Error verificando sesión existente, cerrando sesión por seguridad:', err);
        if (isMounted) logout();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifyExistingAuth();
    return () => {
      isMounted = false;
    };
  }, [token, loadUserPreferences, logout]);

  const setAuthData = useCallback(
    (newToken, newUser) => {
      localStorage.setItem('nexo360_token', newToken);
      setToken(newToken);
      setUser(newUser);

      if (newUser?.accessibilityPreferences) {
        loadUserPreferences(newUser.accessibilityPreferences);
      }
    },
    [loadUserPreferences]
  );

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : updatedFields));
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      setAuthData,
      updateUser,
      logout,
    }),
    [user, token, isLoading, setAuthData, updateUser, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
