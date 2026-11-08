import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

// Logo SVG institucional de Microsoft (oficial)
// A11y: Marcado con aria-hidden="true" porque es decorativo y el contexto ya se describe textualmente.
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
      const msg = 'Escribe tu correo institucional de Duoc UC.';
      setErrorMessage(msg);
      // A11y: Notificación inmediata para usuarios de lector de pantalla
      announce(msg, 'assertive');
      return;
    }

    if (!email.includes('@')) {
      const msg = 'Ingresa una dirección de correo institucional válida (ej. usuario@duocuc.cl).';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    announce('Correo verificado. Ahora escribe tu contraseña.', 'polite');
    setStep('password');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      const msg = 'Escribe tu contraseña institucional.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    setIsLoading(true);
    // A11y: Anuncio en vivo del estado de autenticación
    announce('Iniciando proceso de autenticación institucional en Duoc UC...', 'polite');

    try {
      const res = await api.login(email, password);

      if (!res.success) {
        const msg = res.message || 'Tu cuenta o contraseña son incorrectas. Inténtalo de nuevo.';
        setErrorMessage(msg);
        announce(msg, 'assertive');
        setIsLoading(false);
        return;
      }

      if (res.sessionId) {
        onMfaRequired({
          sessionId: res.sessionId,
          mfaCode: res.mfaCode || null,
          email,
        });
      } else if (res.status === 'COMPLETED' && res.token) {
        onDirectSuccess(res.token, res.user);
      } else {
        const msg = 'Respuesta inesperada del servidor. Intenta nuevamente.';
        setErrorMessage(msg);
        announce(msg, 'assertive');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error durante el login:', err);
      const msg = 'No se pudo conectar con el servicio. Por favor intenta más tarde.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      setIsLoading(false);
    }
  };

  return (
    // A11y: Uso de etiqueta semántica <section> con etiqueta accesible
    <section
      aria-labelledby="login-form-title"
      className="w-full max-w-sm mx-auto"
    >
      {/* Contenedor estilo MS Login accesible */}
      <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-8 sm:p-10">
        {/* Logo Microsoft */}
        <div className="mb-6 flex items-center gap-2">
          <MicrosoftLogo />
          <span className="text-xs font-semibold text-slate-700 tracking-wider">
            Microsoft Azure AD • Duoc UC
          </span>
        </div>

        {step === 'email' ? (
          <>
            {/* A11y: Único <h1> por vista para la jerarquía de títulos */}
            <h1
              id="login-form-title"
              className="text-2xl font-black text-slate-900 mb-3 tracking-tight"
            >
              Iniciar sesión
            </h1>

            {/* A11y: Mensaje de error dinámico con role="alert" y aria-live="assertive" */}
            {errorMessage && (
              <div
                id="login-email-error"
                role="alert"
                aria-live="assertive"
                className="mb-4 p-3 bg-red-50 border-l-4 border-red-700 rounded text-red-950 text-xs sm:text-sm font-bold flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} noValidate>
              <div className="mb-4">
                {/* A11y: <label> explícito asociado mediante htmlFor y id con contraste AAA */}
                <label
                  htmlFor="ms-email"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                >
                  Correo, teléfono o Skype <span className="text-red-700" aria-hidden="true">*</span>
                </label>
                <input
                  id="ms-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@duocuc.cl"
                  // A11y: Atributos aria-invalid y aria-describedby para indicar errores a tecnologías asistivas
                  aria-invalid={errorMessage ? 'true' : 'false'}
                  aria-describedby={errorMessage ? 'login-email-error' : undefined}
                  className="w-full min-h-[44px] px-3.5 py-2.5 border-2 border-slate-400 text-slate-900 text-sm placeholder-slate-500 rounded-md bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 focus:border-[#002B49] transition-all"
                />
              </div>

              {/* A11y: Reemplazo de span con onClick por elemento nativo interactivo */}
              <div className="text-xs text-slate-700 mb-6 flex items-center gap-1.5">
                <span>¿No tienes cuenta?</span>
                <button
                  type="button"
                  onClick={() => announce('Para solicitar tu cuenta Duoc UC, contacta a tu coordinación de sede.', 'polite')}
                  className="min-h-[44px] inline-flex items-center text-[#002B49] font-black underline hover:text-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 rounded px-1"
                >
                  Crea una aquí
                </button>
              </div>

              {/* A11y: Botón con tamaño mínimo de toque de 44x44px y foco ultra-visible Duoc */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="min-h-[44px] min-w-[120px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white font-black text-sm rounded-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 shadow-sm"
                >
                  Siguiente
                </button>
              </div>
            </form>

            {/* Opciones de inicio alternativas */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-700 mb-2">Opciones de inicio de sesión</p>
              {/* A11y: Botón interactivo accesible con tamaño táctil adecuado */}
              <button
                type="button"
                onClick={() => announce('Inicio con llave FIDO2 o Windows Hello disponible para credenciales institucionales.', 'polite')}
                className="w-full min-h-[44px] flex items-center gap-2.5 text-xs sm:text-sm text-[#002B49] font-bold hover:underline p-2 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
              >
                <span aria-hidden="true" className="text-base">🔑</span>
                <span>Iniciar sesión con Windows Hello o llave de seguridad</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Paso 2: Contraseña */}
            <div className="mb-4">
              {/* A11y: Botón Volver con tamaño táctil accesible mínimo 44px */}
              <button
                type="button"
                onClick={() => { setStep('email'); setErrorMessage(''); setPassword(''); }}
                className="min-h-[44px] flex items-center gap-2 text-xs font-bold text-[#002B49] hover:underline mb-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 rounded px-2"
                aria-label={`Volver al paso anterior y cambiar el correo ${email}`}
              >
                <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[220px]">{email}</span>
              </button>

              <h1
                id="login-form-title"
                className="text-2xl font-black text-slate-900 tracking-tight"
              >
                Escribir contraseña
              </h1>
            </div>

            {/* A11y: Mensaje de error dinámico con role="alert" */}
            {errorMessage && (
              <div
                id="login-password-error"
                role="alert"
                aria-live="assertive"
                className="mb-4 p-3 bg-red-50 border-l-4 border-red-700 rounded text-red-950 text-xs sm:text-sm font-bold flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className="mb-4">
                {/* A11y: <label> explícito para el campo de contraseña */}
                <label
                  htmlFor="ms-password"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                >
                  Contraseña institucional <span className="text-red-700" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="ms-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Escribe tu contraseña"
                    disabled={isLoading}
                    // A11y: aria-invalid y aria-describedby para lector de pantalla
                    aria-invalid={errorMessage ? 'true' : 'false'}
                    aria-describedby={errorMessage ? 'login-password-error' : undefined}
                    className="w-full min-h-[44px] px-3.5 py-2.5 pr-14 border-2 border-slate-400 text-slate-900 text-sm placeholder-slate-500 rounded-md bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 focus:border-[#002B49] transition-all disabled:opacity-60"
                  />
                  {/* A11y: Botón de alternar visibilidad con tamaño mínimo de 44x44px y etiqueta accesible dinámica */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 min-h-[44px] min-w-[44px] px-3 flex items-center justify-center text-slate-700 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded-r-md"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* A11y: Botón nativo en lugar de span con cursor pointer */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => announce('Para recuperar tu clave comunícate con la Mesa de Ayuda Duoc UC.', 'polite')}
                  className="min-h-[44px] inline-flex items-center text-xs font-bold text-[#002B49] underline hover:text-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 rounded"
                >
                  ¿Olvidaste tu contraseña institucional?
                </button>
              </div>

              <div className="flex justify-end">
                {/* A11y: Botón de envío accesible con min-h-[44px], foco y estado aria-busy */}
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="min-h-[44px] min-w-[140px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white font-black text-sm rounded-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin text-[#FFB81C]" aria-hidden="true" />}
                  <span>{isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Badge Duoc UC institucional accesible */}
      <div className="mt-5 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#002B49] text-amber-300 text-xs font-black border-2 border-amber-400 shadow">
          {/* A11y: Icono decorativo con aria-hidden="true" */}
          <span aria-hidden="true">🎓</span>
          <span>Cuenta institucional Duoc UC • Periodo Académico 2026</span>
        </span>
      </div>

      {/* Acceso Demo accesible para Capstone */}
      {import.meta.env.DEV && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              onDirectSuccess('demo-token-cristian', {
                nombre: 'Cristian Guzmán',
                rut: '19.876.543-2',
                email: 'c.guzman@duocuc.cl',
                carrera: 'Ingeniería en Informática',
                sede: 'Sede Alameda',
                ajustes: {
                  isEnrolled: true,
                  tutorParAsignado: 'Tania Montes (Tutor PAR)',
                  diagnosticoDeclarado: 'Ajuste de Accesibilidad Sensorial / Motriz',
                },
              });
            }}
            // A11y: Botón con tamaño mínimo 44px y foco accesible
            className="w-full min-h-[44px] py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-slate-950 font-black text-xs rounded-lg border-2 border-amber-500 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">⚡</span>
            <span>Ingreso Rápido Demo (solo desarrollo)</span>
          </button>
        </div>
      )}
    </section>
  );
};
