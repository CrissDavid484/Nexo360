import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

export const LoginForm = ({ onMfaRequired, onDirectSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { announce } = useAccessibility();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      const msg = 'Por favor ingresa tanto tu correo institucional como tu contraseña.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    setIsLoading(true);
    announce('Iniciando proceso de autenticación institucional en Duoc UC...', 'polite');

    try {
      const res = await api.login(email, password);

      if (!res.success) {
        setErrorMessage(res.message || 'Error de autenticación. Verifica tus datos.');
        announce(res.message || 'Error de autenticación', 'assertive');
        setIsLoading(false);
        return;
      }

      // Si requiere MFA (Paso 4 del flujo)
      if (res.status === 'AWAITING_MFA' || res.mfaCode || res.sessionId) {
        onMfaRequired({
          sessionId: res.sessionId,
          mfaCode: res.mfaCode || '...',
          email,
        });
      } else if (res.status === 'COMPLETED' && res.token) {
        onDirectSuccess(res.token, res.user);
      }
    } catch (err) {
      console.error('Error durante el login:', err);
      const msg = 'No se pudo conectar con el servicio de autenticación. Por favor intente más tarde.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-8 sm:p-10 transition-all">
      {/* Encabezado del Formulario */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-700 mb-4 border-2 border-amber-300">
          <ShieldCheck className="w-9 h-9" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Ingreso Institucional
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Accede con tu cuenta institucional de Duoc UC para disfrutar de los servicios centralizados del programa PAEDIS.
        </p>
      </div>

      {/* Alerta de Error Accesible */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg flex items-start gap-3 text-red-900"
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <p className="font-bold text-sm">Error en el acceso</p>
            <p className="text-sm mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Campo Correo Institucional */}
        <div>
          <label
            htmlFor="institutional-email"
            className="block text-sm font-bold text-slate-800 mb-1"
          >
            Correo Institucional <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" aria-hidden="true" />
            </div>
            <input
              id="institutional-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@duocuc.cl"
              aria-describedby="email-hint"
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 text-base font-medium placeholder-slate-400 focus:bg-white focus:border-duoc-navy focus:ring-4 focus:ring-amber-400 disabled:opacity-50 transition-all"
            />
          </div>
          <p id="email-hint" className="mt-1.5 text-xs text-slate-500 font-medium">
            Ingresa tu correo oficial terminado en @duocuc.cl o @duoc.cl
          </p>
        </div>

        {/* Campo Contraseña */}
        <div>
          <label
            htmlFor="institutional-password"
            className="block text-sm font-bold text-slate-800 mb-1"
          >
            Contraseña Institucional <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <input
              id="institutional-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              aria-describedby="password-hint"
              disabled={isLoading}
              className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 text-base font-medium placeholder-slate-400 focus:bg-white focus:border-duoc-navy focus:ring-4 focus:ring-amber-400 disabled:opacity-50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800 focus:ring-2 focus:ring-amber-400 rounded-lg m-1"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Eye className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
          <p id="password-hint" className="mt-1.5 text-xs text-slate-500">
            Tus credenciales no se almacenan en el sistema (Zero-Knowledge Credentials).
          </p>
        </div>

        {/* Botón de Envío con Estado de Carga */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 bg-duoc-navy hover:bg-slate-900 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl border-2 border-amber-400 transition-all flex items-center justify-center gap-3 focus:ring-4 focus:ring-amber-400 disabled:opacity-75 disabled:cursor-wait"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" aria-hidden="true" />
              <span>Conectando con Duoc UC...</span>
            </>
          ) : (
            <span>Ingresar de Forma Segura</span>
          )}
        </button>

        {/* Acceso Rápido para Demostración Capstone */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onDirectSuccess('demo-token-cristian', {
                nombre: 'Cristian Guzman Garcia',
                rut: '19.876.543-2',
                email: 'c.guzmang@duocuc.cl',
                carrera: 'Ingeniería en Informática',
                sede: 'Sede San Joaquín',
                paedis: {
                  isEnrolled: true,
                  tutorParAsignado: 'Tania Montes (Tutor PAR)',
                  diagnosticoDeclarado: 'Ajuste de Accesibilidad Sensorial / Motriz',
                },
              });
            }}
            className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <span>⚡ Ingreso Rápido: Cristian Guzmán (Demo Capstone Vivo Duoc)</span>
          </button>
        </div>
      </form>

      {/* Recordatorio de Privacidad y Accesibilidad */}
      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Cumple con estándares WCAG 2.2 AA y Ley de Inclusión Estudiantil.
        </p>
      </div>
    </div>
  );
};
