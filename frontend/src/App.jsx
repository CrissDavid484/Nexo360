import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { lazyLoad } from './utils/lazyLoad';
import { SkipLink } from './components/common/SkipLink';
import { LiveAnnouncer } from './components/common/LiveAnnouncer';
import { ReadingGuideOverlay } from './components/common/ReadingGuideOverlay';
import { ThemeCurtainOverlay } from './components/common/ThemeCurtainOverlay';
import { VoiceReaderObserver } from './components/common/VoiceReaderObserver';
import { KeyboardNavigationObserver } from './components/common/KeyboardNavigationObserver';
import { LoginPage } from './pages/LoginPage';

// Code-Splitting para optimización extrema de carga y rendimiento de red
const DashboardPage = lazyLoad(() => import('./pages/DashboardPage'), 'DashboardPage');

const NotFoundPage = lazyLoad(() => import('./pages/NotFoundPage'), 'NotFoundPage');

const TomaRamosSimulator = lazyLoad(
  () => import('./components/simulation/TomaRamosSimulator'),
  'TomaRamosSimulator'
);

// Componente para proteger las rutas privadas institucionales
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
          <p className="text-slate-600 font-semibold text-sm">Verificando credenciales Duoc UC...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Ruta raíz inteligente: redirige al dashboard si ya está autenticado o al login si no
const RootRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
          <p className="text-slate-600 font-semibold text-sm">Iniciando Nexo360...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-900 transition-colors duration-200 w-full max-w-full overflow-x-clip">
      {/* 1. Salto de accesibilidad para teclado (WCAG 2.4.1) */}
      <SkipLink />

      {/* 2. Región en vivo para lectores de pantalla (WCAG 4.1.3) */}
      <LiveAnnouncer />

      {/* 2.1 Guía de lectura para Dislexia y TDAH (W3C COGA) */}
      <ReadingGuideOverlay />

      {/* 2.2 Cortina de transición elegante entre temas claro / oscuro */}
      <ThemeCurtainOverlay />

      {/* 2.3 Observador global de lectura en voz alta (Web Speech API) */}
      <VoiceReaderObserver />

      {/* 2.4 Observador global de navegación por teclado (Flechas + Tab) */}
      <KeyboardNavigationObserver />

      {/* 3. Contenido Principal Rutas */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12" role="status" aria-live="polite">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
              <p className="text-slate-600 font-semibold text-sm">Cargando módulo de Nexo360...</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<LoginPage initialMode="reset" />} />
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
                <TomaRamosSimulator onExit={() => (window.location.href = '/dashboard')} />
              </ProtectedRoute>
            }
          />
          <Route path="/simulador" element={<Navigate to="/toma-ramos" replace />} />
          <Route path="/simulador-toma-ramos" element={<Navigate to="/toma-ramos" replace />} />
          
          {/* 4. Ruta 404 Institucional: Página no encontrada */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
};
