import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, ShieldCheck, HelpCircle, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { DEFAULT_CAMPUS } from '../utils/studentUtils';
import { AccessibilityBar } from '../components/common/AccessibilityBar';

/**
 * Vista Institucional 404 - Página No Encontrada (Nexo360 • Duoc UC - Sede Alameda)
 * 
 * Regla de negocio:
 * Si el usuario cuenta con sesión activa autenticada, el botón "Volver al portal Nexo360"
 * lo redirige al Dashboard institucional (/dashboard).
 * Si el usuario NO está autenticado, lo redirige de forma segura al inicio de sesión (/login).
 */
export const NotFoundPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { getVoiceProps } = useAccessibility();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Página no encontrada (Error 404) | Nexo360 - Duoc UC Alameda';
  }, []);

  const handleReturnToPortal = () => {
    if (isAuthenticated) {
      navigate('/centro-de-ayuda', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-900 transition-colors duration-200">
      <AccessibilityBar />

      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 animate-fade-in-up focus:outline-none"
        tabIndex="-1"
        aria-label="Página no encontrada"
      >
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Acento decorativo superior Duoc UC */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#002B49] via-amber-400 to-[#002B49]" />

          {/* Icono central de error 404 */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Compass className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" aria-hidden="true" />
          </div>

          {/* Badge institucional */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
            <span>Error 404 • Ruta no encontrada</span>
          </div>

          <h1
            {...getVoiceProps('Error 404. Página no encontrada.')}
            className="text-2xl sm:text-3xl font-black text-[#002B49] tracking-tight mb-3"
          >
            Página no encontrada
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-medium">
            La dirección que intentas abrir no existe, cambió de ubicación o requiere autenticación previa.
          </p>

          {/* Detalle contextual sobre el estado de la sesión */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 mb-8 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isAuthenticated ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="font-semibold text-slate-800">
                {isAuthenticated ? `Sesión activa: ${user?.name || user?.email || 'Estudiante'}` : 'Sesión no iniciada'}
              </span>
            </div>
            <span className="text-slate-500 text-[11px] font-mono">
              {isAuthenticated ? 'Destino: /dashboard' : 'Destino: /login'}
            </span>
          </div>

          {/* Botones de acción accesibles */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleReturnToPortal}
              {...getVoiceProps(
                isAuthenticated ? 'Volver al portal Nexo360' : 'Volver al Inicio de Sesión'
              )}
              className="flex-1 min-h-[48px] px-6 py-3 bg-[#002B49] hover:bg-[#001f35] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center justify-center gap-2 focus:outline-hidden focus:ring-4 focus:ring-amber-400"
            >
              {isAuthenticated ? (
                <>
                  <LayoutDashboard className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Volver al portal Nexo360</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Volver al Inicio de Sesión</span>
                </>
              )}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => window.history.length > 1 ? window.history.back() : navigate('/login')}
              {...getVoiceProps('Regresar a la página anterior')}
              className="min-h-[48px] px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Regresar</span>
            </button>
          </div>
        </div>

        {/* Footer discreto */}
        <p className="mt-6 text-xs text-slate-500 font-medium text-center">
          Nexo360 • Plataforma Integral de Apoyo Estudiantil Duoc UC - {DEFAULT_CAMPUS}
        </p>
      </main>
    </div>
  );
};
export default NotFoundPage;
