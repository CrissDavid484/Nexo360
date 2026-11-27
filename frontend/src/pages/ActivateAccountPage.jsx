import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { AccessibilityBar } from '../components/common/AccessibilityBar';
import { Button } from '../components/ui/Button';
import logo03 from '../assets/logo03.png';
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Check,
  X,
} from 'lucide-react';

export const ActivateAccountPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = (searchParams.get('token') || '').trim();

  // Estados de verificación de token
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [userData, setUserData] = useState(null);

  // Estados del formulario
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  // Verificación de token al montar
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        setVerifying(false);
        setTokenValid(false);
        setTokenError('No se proporcionó un token de activación en el enlace.');
        return;
      }

      try {
        const res = await api.verifyActivationToken(token);
        if (!isMounted) return;

        if (res?.success) {
          setTokenValid(true);
          setUserData(res);
        } else {
          setTokenValid(false);
          setTokenError(res?.message || 'El enlace de activación ha expirado o ya fue utilizado.');
        }
      } catch (err) {
        if (!isMounted) return;
        setTokenValid(false);
        setTokenError(err.message || 'Error al validar el enlace de activación con los servidores institucionales.');
      } finally {
        if (isMounted) setVerifying(false);
      }
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Validaciones de robustez de contraseña
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch && consentAccepted;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.activateAccount({
        token,
        password,
        consentimiento: {
          aceptado: true,
          fechaAceptacion: new Date(),
          finalidadTratamiento: 'Gestión académica, alertas tempranas SAT y acompañamiento PAEDIS según Ley N° 21.719',
        },
      });

      if (res?.success) {
        setActivatedSuccess(true);
      } else {
        setSubmitError(res?.message || 'No fue posible completar la activación de la cuenta.');
      }
    } catch (err) {
      setSubmitError(err.message || 'Error de comunicación al activar la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <AccessibilityBar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl p-6 sm:p-10 transition-all">
          
          {/* Cabecera Institucional */}
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src={logo03}
              alt="Duoc UC Sede Alameda - Nexo360"
              className="h-12 w-auto object-contain mb-4"
            />
            <h1 className="text-2xl sm:text-3xl font-black text-[#002B49] dark:text-amber-400 tracking-tight">
              Activación de Cuenta Institucional
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md">
              Plataforma Institucional Nexo360 • Duoc UC Sede Alameda
            </p>
          </div>

          {/* Estado de carga */}
          {verifying && (
            <div className="text-center py-12" role="status" aria-live="polite">
              <div className="w-12 h-12 border-4 border-amber-400 border-t-[#002B49] rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Verificando credencial de activación...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Conectando de forma segura con el Directorio Institucional
              </p>
            </div>
          )}

          {/* Token inválido o expirado */}
          {!verifying && !tokenValid && !activatedSuccess && (
            <div className="text-center py-6" role="alert">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-900/40">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Enlace de activación inválido o expirado
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                {tokenError || 'El token de seguridad no es válido. Los enlaces de activación expiran tras 48 horas de su emisión por motivos de seguridad institucional.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#002B49] hover:bg-[#003b64] text-white font-bold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-amber-400"
                >
                  Ir al Inicio de Sesión
                </Link>
                <Link
                  to="/soporte"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-amber-400"
                >
                  Contactar Soporte
                </Link>
              </div>
            </div>
          )}

          {/* Cuenta activada exitosamente */}
          {activatedSuccess && (
            <div className="text-center py-6" role="alert">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-900/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Cuenta activada con éxito!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                Tu contraseña institucional ha sido guardada de forma segura con cifrado nativo. Ya puedes acceder a todos los módulos y servicios de Nexo360.
              </p>
              <Button
                variant="primary"
                className="w-full sm:w-auto px-8 py-3 bg-[#002B49] hover:bg-[#003b64] text-white font-bold text-base shadow-lg rounded-xl"
                onClick={() => navigate('/login', { replace: true })}
              >
                Iniciar Sesión Ahora <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Formulario de activación */}
          {!verifying && tokenValid && !activatedSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tarjeta de resumen de usuario */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-700/50 border border-blue-200/60 dark:border-blue-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#002B49] text-white flex items-center justify-center font-bold text-lg">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider font-semibold text-blue-900 dark:text-blue-300">
                      Titular Institucional
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {userData?.fullName || 'Estudiante'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono truncate">
                      {userData?.email}
                    </p>
                  </div>
                </div>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Campo Contraseña */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  Nueva Contraseña Institucional
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres..."
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-400 text-sm transition-all"
                    autoComplete="new-password"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Campo Confirmación */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-400 text-sm transition-all"
                    autoComplete="new-password"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                </div>
              </div>

              {/* Indicadores de requisitos de contraseña */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Requisitos de seguridad:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    Mínimo 8 caracteres
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                    {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    Al menos una mayúscula (A-Z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                    {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    Al menos una minúscula (a-z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    Al menos un número (0-9)
                  </div>
                </div>
                {password.length > 0 && confirmPassword.length > 0 && (
                  <p className={`pt-1 font-medium ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                  </p>
                )}
              </div>

              {/* Consentimiento Ley N° 21.719 */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-amber-400 text-[#002B49] focus:ring-4 focus:ring-amber-400 cursor-pointer"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-[#002B49] dark:text-amber-400 flex items-center gap-1 mb-1">
                      <ShieldCheck className="w-4 h-4" /> Consentimiento de Privacidad (Ley N° 21.719)
                    </span>
                    Acepto el tratamiento de mis datos institucionales exclusivamente con fines académicos, cálculo de alertas preventivas SAT y coordinación de apoyos PAEDIS en Duoc UC Sede Alameda. Comprendo que puedo consultar o revocar mis preferencias en mi Perfil.
                  </div>
                </label>
              </div>

              {/* Botón de Enviar */}
              <Button
                type="submit"
                variant="primary"
                disabled={!isFormValid || submitting}
                className="w-full py-3.5 rounded-xl bg-[#002B49] hover:bg-[#003b64] text-white font-bold text-base shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Activando Cuenta...' : 'Activar Cuenta Institucional'}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                >
                  ¿Ya activaste tu cuenta? Iniciar sesión
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
};

export default ActivateAccountPage;
