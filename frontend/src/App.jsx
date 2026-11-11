import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SkipLink } from './components/common/SkipLink';
import { LiveAnnouncer } from './components/common/LiveAnnouncer';
import { ReadingGuideOverlay } from './components/common/ReadingGuideOverlay';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

const TomaRamosSimulator = lazy(() =>
  import('./components/simulation/TomaRamosSimulator').then((m) => ({
    default: m.TomaRamosSimulator,
  }))
);

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
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-900 transition-colors duration-200">
      {/* 1. Salto de accesibilidad para teclado (WCAG 2.4.1) */}
      <SkipLink />

      {/* 2. Región en vivo para lectores de pantalla (WCAG 4.1.3) */}
      <LiveAnnouncer />

      {/* 2.1 Guía de lectura para Dislexia y TDAH (W3C COGA) */}
      <ReadingGuideOverlay />

      {/* 3. Contenido Principal Rutas */}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toma-ramos"
          element={
            <ProtectedRoute>
              <Suspense
                fallback={
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="w-10 h-10 border-3 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-slate-600 font-semibold text-sm">
                        Cargando Simulador Oficial de Toma de Ramos Duoc UC...
                      </p>
                    </div>
                  </div>
                }
              >
                <TomaRamosSimulator onExit={() => (window.location.href = '/dashboard')} />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/simulador" element={<Navigate to="/toma-ramos" replace />} />
        <Route path="/simulador-toma-ramos" element={<Navigate to="/toma-ramos" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};
