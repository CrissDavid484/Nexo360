import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Terminal,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

const INSTITUTIONAL_EMAIL_REGEX = /^[^\s@]+@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;
const PASSWORD_LETTER_REGEX = /[a-zA-Z]/;
const PASSWORD_DIGIT_REGEX = /\d/;

function isValidInstitutionalEmail(value) {
  return INSTITUTIONAL_EMAIL_REGEX.test(String(value || '').trim());
}

function validateResetFields({ email, token, newPassword, confirmPassword }) {
  if (!isValidInstitutionalEmail(email)) {
    return 'Ingresa un correo institucional válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).';
  }
  if (!String(token || '').trim()) {
    return 'Ingresa el código o token de recuperación enviado a tu correo.';
  }
  if (!newPassword || newPassword.length < 8) {
    return 'La nueva contraseña debe tener al menos 8 caracteres.';
  }
  if (!PASSWORD_LETTER_REGEX.test(newPassword) || !PASSWORD_DIGIT_REGEX.test(newPassword)) {
    return 'La nueva contraseña debe incluir al menos una letra y un número.';
  }
  if (newPassword !== confirmPassword) {
    return 'Las contraseñas no coinciden. Verifica ambos campos.';
  }
  return '';
}

function getHeaderTitle(mode, resetCompleted) {
  if (mode === 'request') {
    return 'Recuperar Contraseña';
  }
  if (resetCompleted) {
    return 'Contraseña Actualizada';
  }
  return 'Restablecer Contraseña';
}

function getHeaderSubtitle(mode, clearReadingMode) {
  if (mode === 'request') {
    return clearReadingMode
      ? 'Ingresa tu correo Duoc UC para recibir un código.'
      : 'Ingresa tu correo institucional (@duocuc.cl, @profesor.duoc.cl o @duoc.cl) para recibir instrucciones de recuperación.';
  }
  return clearReadingMode
    ? 'Ingresa el código y tu nueva contraseña.'
    : 'Ingresa tu correo institucional, el código de un solo uso y define una nueva contraseña segura.';
}

export const ForgotPasswordFlow = ({
  initialMode = 'request',
  initialEmail = '',
  initialToken = '',
  onBackToLogin,
}) => {
  const normalizedInitialMode = initialMode === 'reset' ? 'reset' : 'request';
  const [mode, setMode] = useState(normalizedInitialMode);
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [devPreview, setDevPreview] = useState(null);
  const [resetCompleted, setResetCompleted] = useState(false);

  const isMountedRef = useRef(true);
  const { announce, getVoiceProps, clearReadingMode } = useAccessibility();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setMode(initialMode === 'reset' ? 'reset' : 'request');
    setResetCompleted(false);
    setErrorMessage('');
    setStatusMessage('');
    setDevPreview(null);
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialMode, initialEmail, initialToken]);

  const switchToResetStep = (prefilledToken = '') => {
    setErrorMessage('');
    setStatusMessage('');
    setResetCompleted(false);
    if (prefilledToken) {
      setToken(prefilledToken);
    }
    setMode('reset');
    announce('Paso de restablecimiento de contraseña. Ingresa el código y tu nueva contraseña.', 'polite');
  };

  const switchToRequestStep = () => {
    setErrorMessage('');
    setStatusMessage('');
    setDevPreview(null);
    setResetCompleted(false);
    setMode('request');
    announce('Paso de solicitud de código de recuperación.', 'polite');
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setDevPreview(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidInstitutionalEmail(cleanEmail)) {
      const msg = 'Ingresa un correo institucional válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    setIsSubmitting(true);
    announce('Enviando solicitud de recuperación de contraseña...', 'polite');

    try {
      const res = await api.forgotPassword(cleanEmail);
      if (!isMountedRef.current) return;

      if (res?.success) {
        const msg =
          res.message ||
          'Si el correo institucional está registrado, recibirás un código para restablecer tu contraseña.';
        setStatusMessage(msg);
        if (res.devPreview?.token) {
          setDevPreview(res.devPreview);
        }
        announce(msg, 'polite');
      } else {
        const msg = res?.message || 'No se pudo procesar la solicitud de recuperación.';
        setErrorMessage(msg);
        announce(msg, 'assertive');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err?.message || 'Error de conexión al solicitar la recuperación de contraseña.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();
    const validationError = validateResetFields({
      email: cleanEmail,
      token: cleanToken,
      newPassword,
      confirmPassword,
    });

    if (validationError) {
      setErrorMessage(validationError);
      announce(validationError, 'assertive');
      return;
    }

    setIsSubmitting(true);
    announce('Restableciendo contraseña institucional...', 'polite');

    try {
      const res = await api.resetPassword({
        email: cleanEmail,
        token: cleanToken,
        newPassword,
      });
      if (!isMountedRef.current) return;

      if (res?.success) {
        const msg =
          res.message ||
          'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.';
        setResetCompleted(true);
        setStatusMessage(msg);
        setNewPassword('');
        setConfirmPassword('');
        setToken('');
        announce(msg, 'polite');
      } else {
        const msg =
          res?.message ||
          'No se pudo restablecer la contraseña. Verifica el código e intenta nuevamente.';
        setErrorMessage(msg);
        announce(msg, 'assertive');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err?.message || 'Error de conexión al restablecer la contraseña.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const headerTitle = getHeaderTitle(mode, resetCompleted);
  const headerSubtitle = getHeaderSubtitle(mode, clearReadingMode);
  const passwordHint = clearReadingMode
    ? 'Mínimo 8 caracteres, una letra y un número.'
    : 'Debe tener al menos 8 caracteres e incluir al menos una letra y un número.';

  return (
    <section aria-labelledby="forgot-password-title" className="w-full max-w-[440px] mx-auto">
      <div className="bg-white border border-slate-300 border-t-4 border-t-[#002B49] rounded-2xl shadow-sm p-6 sm:p-8 space-y-4">
        <div className="text-center pb-1">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-[#002B49] mb-3 border border-slate-200"
            aria-hidden="true"
          >
            {mode === 'request' ? (
              <Mail className="w-6 h-6" aria-hidden="true" />
            ) : (
              <KeyRound className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <h1
            id="forgot-password-title"
            className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
          >
            {headerTitle}
          </h1>
          <p className="text-xs font-medium text-slate-600 mt-1.5 leading-relaxed">
            {headerSubtitle}
          </p>
        </div>

        {errorMessage && (
          <div
            id="recovery-error-alert"
            role="alert"
            aria-live="assertive"
            className="p-3 bg-red-50 border-l-4 border-red-600 rounded-lg text-red-900 text-xs font-medium flex items-start gap-2 shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div
            id="recovery-status-alert"
            role="status"
            aria-live="polite"
            className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-lg text-emerald-950 text-xs font-medium flex items-start gap-2 shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        {mode === 'request' && devPreview?.token && (
          <div
            role="region"
            aria-label="Código de recuperación en entorno de desarrollo"
            className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5 text-xs text-amber-950"
          >
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Terminal className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>Modo desarrollo: código de recuperación disponible</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              Código de un solo uso:{' '}
              <code className="px-2 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-[#002B49] select-all">
                {devPreview.token}
              </code>
            </p>
            <button
              type="button"
              onClick={() => switchToResetStep(devPreview.token)}
              {...getVoiceProps('Ingresar código ahora')}
              className="w-full min-h-[40px] px-3.5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-xs rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer"
            >
              Ingresar código ahora
            </button>
          </div>
        )}

        {mode === 'request' && (
          <form onSubmit={handleRequestSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="recovery-request-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Correo Institucional
              </label>
              <input
                id="recovery-request-email"
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
                {...getVoiceProps(`Correo Institucional${email ? `, ${email}` : ', campo vacío'}`)}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              {...getVoiceProps('Enviar código de recuperación')}
              className="w-full min-h-[44px] px-4 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
                  <span>Enviando solicitud...</span>
                </>
              ) : (
                <span>Enviar código de recuperación</span>
              )}
            </button>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => switchToResetStep('')}
                {...getVoiceProps('Ya tengo un código de recuperación')}
                className="w-full min-h-[40px] px-3 py-2 text-xs font-semibold text-[#002B49] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer"
              >
                Ya tengo un código de recuperación
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && !resetCompleted && (
          <form onSubmit={handleResetSubmit} noValidate className="space-y-3.5">
            <div className="space-y-1">
              <label
                htmlFor="recovery-reset-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Correo Institucional
              </label>
              <input
                id="recovery-reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="ejemplo@duocuc.cl"
                {...getVoiceProps(`Correo Institucional${email ? `, ${email}` : ', campo vacío'}`)}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="recovery-reset-token"
                className="block text-xs font-semibold text-slate-700"
              >
                Código o Token de Recuperación
              </label>
              <input
                id="recovery-reset-token"
                type="text"
                required
                autoComplete="one-time-code"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Pega el código recibido en tu correo"
                {...getVoiceProps('Código o token de recuperación')}
                className="w-full min-h-[44px] px-3.5 py-2 border border-slate-300 text-slate-900 font-mono text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="recovery-new-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  id="recovery-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  aria-describedby="recovery-password-hint"
                  placeholder="Mínimo 8 caracteres"
                  {...getVoiceProps('Nueva contraseña')}
                  className="w-full min-h-[44px] px-3.5 py-2 pr-10 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Ver nueva contraseña'}
                  {...getVoiceProps(showNewPassword ? 'Ocultar nueva contraseña' : 'Ver nueva contraseña')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p id="recovery-password-hint" className="text-[11px] text-slate-500">
                {passwordHint}
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="recovery-confirm-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  id="recovery-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Repite tu nueva contraseña"
                  {...getVoiceProps('Confirmar nueva contraseña')}
                  className="w-full min-h-[44px] px-3.5 py-2 pr-10 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Ocultar confirmación de contraseña'
                      : 'Ver confirmación de contraseña'
                  }
                  {...getVoiceProps(
                    showConfirmPassword
                      ? 'Ocultar confirmación de contraseña'
                      : 'Ver confirmación de contraseña'
                  )}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              {...getVoiceProps('Guardar nueva contraseña')}
              className="w-full min-h-[44px] px-4 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
                  <span>Actualizando contraseña...</span>
                </>
              ) : (
                <span>Restablecer Contraseña</span>
              )}
            </button>

            <button
              type="button"
              onClick={switchToRequestStep}
              {...getVoiceProps('Solicitar un nuevo código')}
              className="w-full min-h-[40px] px-3 py-2 text-xs font-semibold text-[#002B49] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer"
            >
              Solicitar un nuevo código
            </button>
          </form>
        )}

        {mode === 'reset' && resetCompleted && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onBackToLogin?.()}
              {...getVoiceProps('Volver a Iniciar Sesión')}
              className="w-full min-h-[44px] px-4 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          </div>
        )}

        {!resetCompleted && (
          <div className="pt-3 border-t border-slate-200/80 text-center">
            <button
              type="button"
              onClick={() => onBackToLogin?.()}
              {...getVoiceProps('Volver a Iniciar Sesión')}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#002B49] hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ForgotPasswordFlow;
