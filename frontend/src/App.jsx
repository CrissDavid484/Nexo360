import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SkipLink } from './components/common/SkipLink';
import { LiveAnnouncer } from './components/common/LiveAnnouncer';
import { AccessibilityBar } from './components/common/AccessibilityBar';
import { Navbar } from './components/common/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

// Componente para proteger la ruta del Dashboard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-bold">Cargando plataforma Nexo360...</p>
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
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors duration-200">
      {/* 1. Salto de accesibilidad para teclado (WCAG 2.4.1) */}
      <SkipLink />

      {/* 2. Región en vivo para lectores de pantalla (WCAG 4.1.3) */}
      <LiveAnnouncer />

      {/* 3. Barra y Navbar externos (solo visibles en pantalla de inicio de sesión) */}
      {!isAuthenticated && (
        <>
          <AccessibilityBar />
          <Navbar />
        </>
      )}

      {/* 4. Contenido Principal Rutas */}
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

      {/* 5. Pie de Página Institucional externo (solo en Login) */}
      {!isAuthenticated && (
        <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t-4 border-amber-400 mt-auto text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-200">
                Nexo360 • Plataforma de Inclusión Duoc UC PAEDIS
              </p>
              <p className="text-slate-400 mt-1">
                Desarrollada bajo estándares internacionales de accesibilidad WCAG 2.2 AA.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-slate-300">
                Mesa de Ayuda PAEDIS: <span className="font-bold text-amber-400">paedis@duoc.cl</span>
              </p>
              <p className="text-slate-500 mt-0.5">
                Zero-Knowledge Authentication Proxy • 2026 Duoc UC
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
