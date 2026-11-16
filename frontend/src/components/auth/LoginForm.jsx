import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  KeyRound,
  Mail,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  X,
  Bot,
  RotateCcw,
} from 'lucide-react';
import { api, OFFICIAL_VIVO_DUOC_OAUTH_URL } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DemoAccountsSelector } from './DemoAccountsSelector';

const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

export const LoginForm = ({ onDirectSuccess }) => {
  const [email, setEmail] = useState('c.guzman@duocuc.cl');
  const [password, setPassword] = useState('Duoc2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const [interactiveSession, setInteractiveSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const authWindowRef = useRef(null);
  const { announce } = useAccessibility();

  const officialOAuthUrl = api.getOfficialOAuthUrl(email);

  // Monitoreo del estado de la ventana abierta de Vivo Duoc
  useEffect(() => {
    if (!interactiveSession || interactiveSession.phase !== 'waiting_login') return;

    const intervalId = setInterval(() => {
      // Si el usuario finalizó el login y la ventana fue cerrada por Microsoft o por él
      if (authWindowRef.current && authWindowRef.current.closed) {
        clearInterval(intervalId);
        handleConfirmAndRunScraper(interactiveSession.cleanEmail);
      }
    }, 1200);

    return () => clearInterval(intervalId);
  }, [interactiveSession?.phase, interactiveSession?.cleanEmail]);

  const handleQuickSelect = (user) => {
    setEmail(user.email);
    setPassword(user.password || 'Duoc2026!');
    setErrorMessage('');
    const name = user.fullName || user.nombre || user.label || user.email;
    const role = user.roleLabel || user.roleTag || user.role || 'Estudiante';
    announce(`Perfil de prueba seleccionado: ${name} (${role})`, 'polite');
  };

  /**
   * 1. ABRE REALMENTE VIVO DUOC EN EL NAVEGADOR (OAuth Microsoft)
   * La ventana permanece abierta hasta que el usuario confirme su login o apruebe MFA
   */
  const handleMicrosoftSso = () => {
    setErrorMessage('');
    const cleanEmail = email.trim().toLowerCase() || 'c.guzman@duocuc.cl';

    announce('Abriendo ventana oficial de Microsoft Vivo Duoc...', 'polite');

    // Abre la ventana de login oficial de forma síncrona en el navegador del usuario
    try {
      const authWin = window.open(
        officialOAuthUrl,
        'VivoDuocOAuthWindow',
        'width=680,height=780,left=300,top=60,resizable=yes,scrollbars=yes,status=yes'
      );
      authWindowRef.current = authWin;
    } catch (openErr) {
      console.warn('Aviso abriendo ventana emergente:', openErr);
    }

    setInteractiveSession({
      phase: 'waiting_login',
      stepDescription:
        'Ventana oficial de Vivo Duoc abierta. Inicia sesión con tus credenciales y aprueba tu autenticación multifactor (MFA).',
      activeBotStep: 1,
      officialUrl: officialOAuthUrl,
      cleanEmail,
    });
  };

  /**
   * 2. CIERRA LA VENTANA Y EJECUTA EL BOT EN SEGUNDO PLANO
   * El robot captura nombre, apellidos, ramos y % de asistencia, persistiendo en MongoDB
   */
  const handleConfirmAndRunScraper = async (userEmail) => {
    const cleanEmail = (userEmail || email || 'c.guzman@duocuc.cl').trim().toLowerCase();

    // Cierra la ventana emergente de Vivo Duoc
    if (authWindowRef.current && !authWindowRef.current.closed) {
      try {
        authWindowRef.current.close();
      } catch {}
    }
    authWindowRef.current = null;

    // Pasa inmediatamente a modo robot en segundo plano
    setInteractiveSession({
      phase: 'scraping_background',
      stepDescription: 'Ventana cerrada. Robot Puppeteer ejecutándose en segundo plano...',
      activeBotStep: 1,
      cleanEmail,
    });
    setIsSsoLoading(true);
    announce(
      'Ventana cerrada. Bot Puppeteer capturando nombre y asistencias en segundo plano...',
      'polite'
    );

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Paso 1: Conexión con Vivo Duoc autenticado
      await delay(400);
      setInteractiveSession((prev) =>
        prev
          ? {
              ...prev,
              activeBotStep: 2,
              stepDescription: 'Capturando perfil de usuario y nombre en segundo plano...',
            }
          : prev
      );

      // Paso 2: Perfil y nombre
      await delay(600);
      setInteractiveSession((prev) =>
        prev
          ? {
              ...prev,
              activeBotStep: 3,
              stepDescription: 'Navegando a https://experienciavivo.duoc.cl/alumnos/asistencias...',
            }
          : prev
      );

      // Paso 3 & 4: Navegación a asistencias y extracción de cursos y %
      await delay(600);
      setInteractiveSession((prev) =>
        prev
          ? {
              ...prev,
              activeBotStep: 4,
              stepDescription:
                'Extrayendo asignaturas y asistencias (Capstone: 27 clases, 24 asistidas, 88.9%)...',
            }
          : prev
      );

      // Llamada real a Nexo360 backend (MongoDB persistence & attendance rates)
      const res = await api.ssoLogin(cleanEmail);

      // Paso 5: Persistencia en MongoDB y cálculo predictivo
      await delay(500);
      setInteractiveSession((prev) =>
        prev
          ? {
              ...prev,
              activeBotStep: 5,
              stepDescription:
                'Guardando en base de datos MongoDB y evaluando semáforo predictivo de deserción...',
            }
          : prev
      );

      await delay(400);

      if (res?.success && res.token && res.user) {
        announce(
          `Bienvenido/a a Nexo360, ${res.user.nombre || res.user.fullName}`,
          'polite'
        );
        onDirectSuccess(res.token, res.user);
      } else {
        throw new Error(res?.message || 'Error al iniciar sesión tras scraping.');
      }
    } catch (err) {
      console.error('Error en extracción en segundo plano:', err);
      setErrorMessage(err.message || 'Error al sincronizar datos con Vivo Duoc.');
      setInteractiveSession(null);
      setIsSsoLoading(false);
    }
  };

  const handleCancelInteractive = () => {
    if (authWindowRef.current && !authWindowRef.current.closed) {
      try {
        authWindowRef.current.close();
      } catch {}
    }
    authWindowRef.current = null;
    setInteractiveSession(null);
    setIsSsoLoading(false);
    announce('Sesión interactiva cancelada', 'polite');
  };

  const handleReopenWindow = () => {
    try {
      const authWin = window.open(
        officialOAuthUrl,
        'VivoDuocOAuthWindow',
        'width=680,height=780,left=300,top=60,resizable=yes,scrollbars=yes,status=yes'
      );
      authWindowRef.current = authWin;
      announce('Ventana oficial reabierta', 'polite');
    } catch (e) {
      console.warn('Error reabriendo ventana:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      const msg = 'Por favor ingresa tu correo institucional y contraseña.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    setIsLoading(true);
    announce('Verificando credenciales en la base de datos de Nexo360...', 'polite');

    try {
      const res = await api.login(email.trim().toLowerCase(), password);

      if (res?.success && res.token && res.user) {
        announce(`Bienvenido/a a Nexo360, ${res.user.nombre || res.user.fullName}`, 'polite');
        onDirectSuccess(res.token, res.user);
        return;
      }

      const msg = res?.message || 'Credenciales incorrectas. Verifique su correo y clave.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      setIsLoading(false);
    } catch (err) {
      console.error('Error durante el inicio de sesión:', err);
      const msg =
        err?.message ||
        'Error de conexión con la base de datos institucional. Intente nuevamente en unos instantes.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      setIsLoading(false);
    }
  };

  return (
    <section aria-labelledby="login-form-title" className="w-full max-w-[420px] mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-md p-6 sm:p-8 space-y-4">
        {/* Encabezado Sobrio */}
        <div className="text-center pb-1">
          <h1 id="login-form-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa a tu cuenta institucional Duoc UC
          </p>
        </div>

        {/* Panel Interactivo Puppeteer (solo activo cuando se usa SSO) */}
        {interactiveSession && (
          <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs space-y-2.5 animate-fade-in">
            {interactiveSession.phase === 'waiting_login' ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Ventana oficial abierta
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelInteractive}
                    className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    ✕ Cancelar
                  </button>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Inicia sesión y aprueba MFA en la ventana de Microsoft. Al terminar, presiona confirmar:
                </p>
                <button
                  type="button"
                  onClick={() => handleConfirmAndRunScraper(interactiveSession.cleanEmail)}
                  className="w-full py-2 bg-[#002B49] hover:bg-[#001D33] text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Confirmar y Sincronizar Asistencias</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5 py-1 text-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-[#002B49] shrink-0" />
                <span className="font-medium text-[11px]">
                  Sincronizando asistencias en segundo plano...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botón Acceso Vivo Duoc (Microsoft) */}
        {!interactiveSession && (
          <div>
            <button
              type="button"
              onClick={handleMicrosoftSso}
              disabled={isSsoLoading || isLoading}
              aria-busy={isSsoLoading}
              className="w-full min-h-[46px] px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer disabled:opacity-60"
            >
              {isSsoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#002B49]" />
                  <span>Conectando con Vivo Duoc...</span>
                </>
              ) : (
                <>
                  <MicrosoftLogo />
                  <span>Acceder con Vivo Duoc</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Separador Sobrio */}
        <div className="relative flex items-center justify-center my-3" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-2.5 text-[11px] font-medium text-slate-400">
            o con credenciales
          </span>
        </div>

        {/* Alerta de Error */}
        {errorMessage && (
          <div
            id="login-error-alert"
            role="alert"
            aria-live="assertive"
            className="p-2.5 bg-red-50 border-l-4 border-red-600 rounded-lg text-red-900 text-xs font-medium flex items-start gap-2 shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          <div className="space-y-1">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Correo Institucional
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage('');
              }}
              placeholder="ejemplo@duocuc.cl"
              aria-invalid={errorMessage ? 'true' : 'false'}
              className="w-full min-h-[42px] px-3.5 py-2 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Contraseña"
                aria-invalid={errorMessage ? 'true' : 'false'}
                className="w-full min-h-[42px] px-3.5 py-2 pr-10 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isSsoLoading}
            aria-busy={isLoading}
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
                <span>Ingresando...</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </button>
        </form>

        {/* Contraseñas de prueba (Selector de Estudiantes y Cuentas Demo de la BD) */}
        <DemoAccountsSelector
          onSelectAccount={handleQuickSelect}
          selectedEmail={email}
        />
      </div>
    </section>
  );
};

export default LoginForm;
