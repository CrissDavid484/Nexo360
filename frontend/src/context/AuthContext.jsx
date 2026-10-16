import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAccessibility } from './AccessibilityContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nexo360_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const { loadUserPreferences, announce } = useAccessibility();

  useEffect(() => {
    const verifyExistingAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          if (response.user.accessibilityPreferences) {
            loadUserPreferences(response.user.accessibilityPreferences);
          }
        } else {
          // Token inválido o expirado
          logout();
        }
      } catch (err) {
        console.warn('Error verificando sesión existente:', err);
        // Mantener sesión offline si hay token para no interrumpir navegación en pruebas
      } finally {
        setIsLoading(false);
      }
    };

    verifyExistingAuth();
  }, [token]);

  const setAuthData = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('nexo360_token', newToken);

    if (newUser?.accessibilityPreferences) {
      loadUserPreferences(newUser.accessibilityPreferences);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexo360_token');
    announce('Sesión cerrada correctamente');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        setAuthData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
