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

// Componente para proteger las rutas exclusivas de administración y coordinación PAEDIS (RBAC)
const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-3" aria-hidden="true"></div>
          <p className="text-slate-600 font-semibold text-sm">Verificando autorizaciones de seguridad Duoc UC...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = (user?.role || '').toLowerCase();
  const isAuthorized = role === 'admin' || role === 'administrador' || role === 'coordinador_paedis';

  if (!isAuthorized) {
    return <Navigate to="/centro-de-ayuda" replace />;
  }

  return children;
};

// Ruta raíz inteligente: redirige al centro de ayuda si ya está autenticado o al login si no
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

  return <Navigate to={isAuthenticated ? "/centro-de-ayuda" : "/login"} replace />;
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

      {/* 2.5 Filtros SVG calibrados para daltonismo (fuera del flujo visual para no alterar position: fixed) */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        className="fixed pointer-events-none opacity-0"
      >
        <defs>
          <filter id="nexo-cb-protanopia" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                0.78  0.22  0.00  0  0
                0.34  0.44  0.22  0  0
                0.00  0.30  0.70  0  0
                0     0     0     1  0
              "
            />
          </filter>

          <filter id="nexo-cb-deuteranopia" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                 0.75  0.00  0.25  0  0
                 0.45  0.20  0.35  0  0
                -0.20  0.45  0.75  0  0
                 0     0     0     1  0
              "
            />
          </filter>

          <filter id="nexo-cb-tritanopia" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                0.950  0.050  0.000  0  0
                0.000  0.433  0.567  0  0
                0.000  0.475  0.525  0  0
                0.000  0.000  0.000  1  0
              "
            />
          </filter>
        </defs>
      </svg>

      {/* 3. Contenido Principal Rutas */}
      <div id="nexo-cb-canvas" className="flex-1 flex flex-col w-full min-w-0">
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

            {/* Rutas Principales Institucionales con Enrutamiento Real y Persistencia F5 */}
            <Route
              path="/centro-de-ayuda"
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
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/biblioteca"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vivo-duoc"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/soporte"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Rutas de Administración Protegidas por RBAC (Admin y Coordinador PAEDIS) */}
            <Route
              path="/panel-admin"
              element={
                <AdminProtectedRoute>
                  <DashboardPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/panel-admin/:subTab"
              element={
                <AdminProtectedRoute>
                  <DashboardPage />
                </AdminProtectedRoute>
              }
            />

            {/* Redirecciones de Compatibilidad, Alias y Rutas Rápidas */}
            <Route path="/dashboard" element={<Navigate to="/centro-de-ayuda" replace />} />
            <Route path="/simulador" element={<Navigate to="/toma-ramos" replace />} />
            <Route path="/simulador-toma-ramos" element={<Navigate to="/toma-ramos" replace />} />
            <Route path="/tickets" element={<Navigate to="/soporte" replace />} />
            <Route path="/admin-panel" element={<Navigate to="/panel-admin" replace />} />
            <Route path="/admin-panel/*" element={<Navigate to="/panel-admin" replace />} />
            <Route path="/admin" element={<Navigate to="/panel-admin" replace />} />
            <Route path="/admin/*" element={<Navigate to="/panel-admin" replace />} />

            {/* 4. Ruta 404 Institucional: Página no encontrada */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};
