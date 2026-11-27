import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
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

export const LoginForm = ({ onDirectSuccess, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { announce, getVoiceProps, clearReadingMode } = useAccessibility();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) return;

    let active = true;
    const finishOidc = async () => {
      setIsSsoLoading(true);
      setErrorMessage('');
      announce('Validando autenticación institucional Microsoft Entra ID...', 'polite');
      try {
        const res = await api.completeOidcCallback(code, state);
        if (!active) return;
        if (res?.success && res.token && res.user) {
          window.history.replaceState({}, document.title, window.location.pathname);
          announce(`Bienvenido/a a Nexo360, ${res.user.nombre || res.user.fullName}`, 'polite');
          onDirectSuccess(res.token, res.user);
          return;
        }
        const msg = res?.message || 'No fue posible validar el inicio de sesión institucional con Microsoft Entra ID.';
        setErrorMessage(msg);
        announce(msg, 'assertive');
      } catch (err) {
        if (!active) return;
        const msg = err?.message || 'Error al completar autenticación con Microsoft Entra ID.';
        setErrorMessage(msg);
        announce(msg, 'assertive');
      } finally {
        if (active) setIsSsoLoading(false);
      }
    };

    finishOidc();
    return () => {
      active = false;
    };
  }, [announce, onDirectSuccess]);

  const handleQuickSelect = async (user) => {
    setEmail(user.email);
    setPassword('');
    setErrorMessage('');
    const name = user.fullName || user.nombre || user.label || user.email;
    const role = user.roleLabel || user.roleTag || user.role || 'Usuario';
    announce(`Cuenta demo seleccionada: ${name} (${role}). Iniciando sesión de prueba...`, 'polite');

    setIsSsoLoading(true);
    try {
      const res = await api.ssoLogin({ email: user.email });
      if (res?.success && res.token && res.user) {
        announce(`Bienvenido/a a Nexo360, ${res.user.nombre || res.user.fullName}`, 'polite');
        onDirectSuccess(res.token, res.user);
        return;
      }
      const msg = res?.message || 'El acceso rápido demo no está habilitado en este entorno.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
    } catch (err) {
      const msg = err?.message || 'No se pudo iniciar sesión con la cuenta de prueba seleccionada.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
    } finally {
      setIsSsoLoading(false);
    }
  };

  /**
   * Inicio de sesión institucional mediante Microsoft Entra ID (OIDC + PKCE)
   */
  const handleMicrosoftSso = async () => {
    setErrorMessage('');
    setIsSsoLoading(true);
    announce('Verificando configuración de Microsoft Entra ID (Duoc UC)...', 'polite');

    try {
      const statusRes = await api.getOidcStatus();
      if (!statusRes?.success || !statusRes?.enabled) {
        const msg =
          'El inicio de sesión único con Microsoft Entra ID (SSO Duoc UC) está pendiente de configuración institucional por Duoc UC. Ingresa con tu correo y contraseña institucional.';
        setErrorMessage(msg);
        announce(msg, 'assertive');
        setIsSsoLoading(false);
        return;
      }

      const authRes = await api.getOidcAuthorizeUrl();
      const targetUrl = authRes?.authorizeUrl || authRes?.url;
      if (!authRes?.success || !targetUrl) {
        throw new Error(authRes?.message || 'No fue posible obtener la URL oficial de autorización Microsoft Entra ID.');
      }

      announce('Redirigiendo al portal oficial de Microsoft Entra ID Duoc UC...', 'polite');
      window.location.assign(targetUrl);
    } catch (err) {
      console.error('Error en SSO Microsoft:', err);
      const msg =
        err?.message ||
        'Microsoft Entra ID SSO no disponible en este momento. Ingresa con tu correo y contraseña institucional.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      setIsSsoLoading(false);
    }
  };

  /**
   * Inicio de sesión institucional nativo con correo y contraseña cifrada (bcrypt)
   */
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
      <div className="bg-white border border-slate-300 border-t-4 border-t-[#002B49] rounded-2xl shadow-sm p-6 sm:p-8 space-y-4">
        {/* Encabezado Sobrio */}
        <div className="text-center pb-1">
          <h1 id="login-form-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-xs font-medium text-slate-600 mt-1">
            {clearReadingMode
              ? 'Ingresa con tu cuenta institucional Duoc UC.'
              : 'Accede con tu cuenta institucional Duoc UC • Sede Alameda'}
          </p>
        </div>

        {/* Botón Acceso Vivo Duoc (Microsoft) */}
        <div>
          <button
            type="button"
            onClick={handleMicrosoftSso}
            disabled={isSsoLoading || isLoading}
            aria-busy={isSsoLoading}
            {...getVoiceProps('Acceder con Vivo Duoc')}
            className="w-full min-h-[46px] px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer disabled:opacity-60"
          >
            {isSsoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#002B49]" aria-hidden="true" />
                <span>Conectando con Microsoft Entra ID...</span>
              </>
            ) : (
              <>
                <MicrosoftLogo />
                <span>Acceder con Vivo Duoc</span>
              </>
            )}
          </button>
        </div>

        {/* Separador Sobrio */}
        <div className="relative flex items-center justify-center my-3" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-2.5 text-[11px] font-medium text-slate-400">
            o con credenciales
          </span>
        </div>

        {/* Alerta de Error / Estado SSO */}
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
              {...getVoiceProps(
                `Correo Institucional${email ? `, ${email}` : ', campo vacío'}`
              )}
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
                {...getVoiceProps('Contraseña institucional')}
                className="w-full min-h-[42px] px-3.5 py-2 pr-10 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                {...getVoiceProps(showPassword ? 'Ocultar contraseña' : 'Ver contraseña')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => onForgotPassword?.(email.trim().toLowerCase())}
                {...getVoiceProps('¿Olvidaste tu contraseña? Recuperar acceso')}
                className="min-h-[38px] px-2 py-1 text-xs font-semibold text-[#002B49] hover:text-[#001D33] hover:underline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isSsoLoading}
            aria-busy={isLoading}
            {...getVoiceProps('Ingresar al portal institucional')}
            className="w-full min-h-[44px] px-4 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer disabled:opacity-60"
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

        {/* Selector de cuentas de prueba (solo visible si el backend habilita modo demo) */}
        <DemoAccountsSelector
          onSelectAccount={handleQuickSelect}
          selectedEmail={email}
        />
      </div>
    </section>
  );
};

export default LoginForm;
