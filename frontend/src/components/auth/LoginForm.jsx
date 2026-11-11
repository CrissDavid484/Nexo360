import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, KeyRound, Mail } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DemoAccountsSelector } from './DemoAccountsSelector';

export const LoginForm = ({ onDirectSuccess }) => {
  const [email, setEmail] = useState('c.guzman@duocuc.cl');
  const [password, setPassword] = useState('Duoc2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { announce } = useAccessibility();

  const handleQuickSelect = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setErrorMessage('');
    announce(`Perfil de prueba seleccionado: ${user.label} (${user.roleTag})`, 'polite');
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
    <section aria-labelledby="login-form-title" className="w-full mx-auto">
      <div className="bg-white border-2 border-slate-300 rounded-3xl shadow-xl p-6 sm:p-10 space-y-6">
        {/* Encabezado Institucional Accesible */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center font-black text-xl shadow-xs"
              aria-hidden="true"
            >
              N
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 tracking-wider uppercase block">
                Nexo360 • Duoc UC
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Portal de Servicios y Acompañamiento Estudiantil
              </span>
            </div>
          </div>
        </div>

        <div>
          <h1 id="login-form-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Iniciar Sesión Institucional
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5 leading-relaxed">
            Ingresa con tu correo institucional y contraseña encriptada para acceder al portal y a tus herramientas personalizadas.
          </p>
        </div>

        {errorMessage && (
          <div
            id="login-error-alert"
            role="alert"
            aria-live="assertive"
            className="p-3.5 bg-red-50 border-l-4 border-red-700 rounded-xl text-red-950 text-xs sm:text-sm font-bold flex items-start gap-2.5 shadow-2xs"
          >
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Campo Correo Institucional */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider"
            >
              <Mail className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
              <span>
                Correo Institucional <span className="text-red-700" aria-hidden="true">*</span>
              </span>
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
              placeholder="ejemplo@duocuc.cl o @duoc.cl"
              aria-invalid={errorMessage ? 'true' : 'false'}
              aria-describedby={errorMessage ? 'login-error-alert' : undefined}
              className="w-full min-h-[46px] px-4 py-2.5 border-2 border-slate-300 text-slate-900 text-sm font-bold placeholder-slate-400 rounded-xl bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 focus:border-[#002B49] transition-all"
            />
          </div>

          {/* Campo Contraseña con botón Ver/Ocultar */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider"
            >
              <KeyRound className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
              <span>
                Contraseña <span className="text-red-700" aria-hidden="true">*</span>
              </span>
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
                placeholder="Ingresa tu contraseña"
                aria-invalid={errorMessage ? 'true' : 'false'}
                className="w-full min-h-[46px] px-4 py-2.5 pr-12 border-2 border-slate-300 text-slate-900 text-sm font-bold placeholder-slate-400 rounded-xl bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 focus:border-[#002B49] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 min-h-[44px] min-w-[44px] px-3 flex items-center justify-center text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded-r-xl"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Eye className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Botón de Envío */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full min-h-[50px] px-6 py-3 bg-[#002B49] hover:bg-[#001f35] text-white font-black text-sm sm:text-base rounded-xl transition-all shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 border-2 border-[#FFB81C] disabled:opacity-60 flex items-center justify-center gap-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#FFB81C]" aria-hidden="true" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Ingresar a Nexo360</span>
              )}
            </button>
          </div>
        </form>

        {/* ================================================================= */}
        {/* MÓDULO AISLADO DE DEMOSTRACIÓN (ELIMINAR AL PASAR A PRODUCCIÓN)   */}
        {/* ================================================================= */}
        <div className="pt-2 border-t border-slate-200">
          <DemoAccountsSelector onSelectAccount={handleQuickSelect} />
        </div>
      </div>
    </section>
  );
};
