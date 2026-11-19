import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAccessibility } from './AccessibilityContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nexo360_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const { loadUserPreferences, clearDisabilityProfile, announce } = useAccessibility();

  const logout = useCallback(() => {
    localStorage.removeItem('nexo360_token');
    setToken(null);
    setUser(null);
    clearDisabilityProfile();
    announce('Sesión cerrada correctamente');
  }, [announce, clearDisabilityProfile]);

  useEffect(() => {
    let isActive = true;

    const verifyExistingAuth = async () => {
      if (!token) {
        if (isActive) setIsLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (!isActive) return;

        if (response?.success && response?.user) {
          setUser(response.user);
          loadUserPreferences(response.user.accessibilityPreferences, {
            disabilityProfile: response.user.disabilityProfile,
          });
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Error verificando sesión existente, cerrando sesión por seguridad:', err);
        if (isActive) logout();
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    verifyExistingAuth().catch((error) => {
      console.error('Error al inicializar sesión:', error);
      if (isActive) setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [token, loadUserPreferences, logout]);

  const setAuthData = useCallback(
    (newToken, newUser) => {
      localStorage.setItem('nexo360_token', newToken);
      setToken(newToken);
      setUser(newUser);

      if (newUser) {
        loadUserPreferences(newUser.accessibilityPreferences, {
          disabilityProfile: newUser.disabilityProfile,
        });
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
