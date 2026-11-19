import React, { useState } from 'react';
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

  const handleQuickSelect = (user) => {
    setEmail(user.email);
    setPassword(user.password || 'Duoc2026!');
    setErrorMessage('');
    const name = user.fullName || user.nombre || user.label || user.email;
    const role = user.roleLabel || user.roleTag || user.role || 'Estudiante';
    announce(`Perfil de prueba seleccionado: ${name} (${role})`, 'polite');
  };

  /**
   * Inicio de sesión institucional instantáneo mediante Microsoft SSO contra MongoDB
   */
  const handleMicrosoftSso = async () => {
    setErrorMessage('');
    const cleanEmail = email.trim().toLowerCase() || 'c.guzman@duocuc.cl';

    setIsSsoLoading(true);
    announce('Iniciando sesión institucional con cuenta Microsoft Duoc UC...', 'polite');

    try {
      const res = await api.ssoLogin(cleanEmail);

      if (res?.success && res.token && res.user) {
        announce(
          `Bienvenido/a a Nexo360, ${res.user.nombre || res.user.fullName}`,
          'polite'
        );
        onDirectSuccess(res.token, res.user);
      } else {
        throw new Error(res?.message || 'Error al iniciar sesión institucional.');
      }
    } catch (err) {
      console.error('Error en SSO Microsoft:', err);
      const msg = err.message || 'Error al conectar con la base de datos institucional.';
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
                <Loader2 className="w-4 h-4 animate-spin text-[#002B49]" />
                <span>Accediendo a cuenta institucional...</span>
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
