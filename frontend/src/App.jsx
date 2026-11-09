import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SkipLink } from './components/common/SkipLink';
import { LiveAnnouncer } from './components/common/LiveAnnouncer';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

// Componente para proteger la ruta del Dashboard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600 font-semibold text-sm">Cargando Nexo360...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FA] text-slate-900 transition-colors duration-200">
      {/* 1. Salto de accesibilidad para teclado (WCAG 2.4.1) */}
      <SkipLink />

      {/* 2. Región en vivo para lectores de pantalla (WCAG 4.1.3) */}
      <LiveAnnouncer />

      {/* 3. Contenido Principal Rutas */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};
