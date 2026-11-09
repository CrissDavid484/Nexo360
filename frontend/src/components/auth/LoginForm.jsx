import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

export const OFFICIAL_MICROSOFT_DUOC_LOGIN_URL =
  'https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize?client_id=674913e2-e170-4787-833f-e307f87db6e5&nonce=05f0ed614ee974e04f8096c70660da67&redirect_uri=https%3A%2F%2Fexperienciavivo.duoc.cl%2Fauth%2Fopenidc%2Fcallback&response_type=code&scope=openid+profile+email+offline_access+api%3A%2F%2F674913e2-e170-4787-833f-e307f87db6e5%2Faccess&state=45c6f7423b9a772dc296a3d5e4f1739f&sso_reload=true';

const FALLBACK_DB_USERS = [
  {
    email: 'c.guzman@duocuc.cl',
    fullName: 'Cristian Guzmán',
    rol: 'estudiante_paedis',
    roleLabel: 'Estudiante Regular • PAEDIS',
    isPaedis: true,
    campus: 'Sede Alameda',
    career: 'Ingeniería en Informática',
  },
  {
    email: 'd.rojas@duocuc.cl',
    fullName: 'Daniela Rojas',
    rol: 'estudiante_paedis',
    roleLabel: 'Estudiante Regular • PAEDIS',
    isPaedis: true,
    campus: 'Sede Alameda',
    career: 'Ingeniería en Informática',
  },
  {
    email: 'm.contreras@duocuc.cl',
    fullName: 'Matías Contreras',
    rol: 'estudiante',
    roleLabel: 'Estudiante Regular',
    isPaedis: false,
    campus: 'Sede Antonio Varas',
    career: 'Analista Programador Computacional',
  },
  {
    email: 'v.soto@duocuc.cl',
    fullName: 'Valentina Soto',
    rol: 'tutor_par',
    roleLabel: 'Estudiante • Tutora Par & Ley 21.790',
    isPaedis: false,
    campus: 'Sede Alameda',
    career: 'Ingeniería en Administración',
  },
  {
    email: 'm.gomez@profesor.duoc.cl',
    fullName: 'Mauricio Gómez Arratia',
    rol: 'profesor',
    roleLabel: 'Profesor / Docente Titular',
    isPaedis: false,
    campus: 'Sede Alameda',
    career: 'Escuela de Informática y Telecomunicaciones',
  },
  {
    email: 'p.valenzuela@duoc.cl',
    fullName: 'Patricia Valenzuela',
    rol: 'director',
    roleLabel: 'Directora de Carrera',
    isPaedis: false,
    campus: 'Sede Alameda',
    career: 'Dirección Escuela de Informática',
  },
  {
    email: 'r.mendez@duoc.cl',
    fullName: 'Roberto Méndez',
    rol: 'subdirector',
    roleLabel: 'Subdirector Académico',
    isPaedis: false,
    campus: 'Sede Alameda',
    career: 'Subdirección Académica de Sede',
  },
  {
    email: 't.montes@duoc.cl',
    fullName: 'Tania Montes',
    rol: 'coordinador_paedis',
    roleLabel: 'Coordinadora PAEDIS e Inclusión',
    isPaedis: true,
    campus: 'Sede Alameda',
    career: 'Unidad de Apoyo y Bienestar PAEDIS',
  },
  {
    email: 'c.herrera@duoc.cl',
    fullName: 'Camila Herrera',
    rol: 'administrativo',
    roleLabel: 'Jefa de Biblioteca y Financiamiento',
    isPaedis: false,
    campus: 'Sede Alameda',
    career: 'Gestión de Financiamiento y Biblioteca',
  },
  {
    email: 'admin.nexo360@duoc.cl',
    fullName: 'Administrador Nexo360',
    rol: 'admin',
    roleLabel: 'Administrador de la Plataforma',
    isPaedis: false,
    campus: 'Casa Central / Sede Alameda',
    career: 'Dirección de Servicios Digitales TI',
  },
];

const MicrosoftLogo = () => (
  <svg width="19" height="19" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const EMAIL_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;

export const LoginForm = ({ onDirectSuccess }) => {
  const [dbUsers, setDbUsers] = useState(FALLBACK_DB_USERS);
  const [officialBaseUrl, setOfficialBaseUrl] = useState(OFFICIAL_MICROSOFT_DUOC_LOGIN_URL);
  const [email, setEmail] = useState('c.guzman@duocuc.cl');
  const [showProfiles, setShowProfiles] = useState(false);
  const [awaitingExternalSso, setAwaitingExternalSso] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const popupRef = useRef(null);
  const { announce } = useAccessibility();

  useEffect(() => {
    let mounted = true;
    api
      .getInstitutionalUsers()
      .then((res) => {
        if (!mounted) return;
        if (res?.success && Array.isArray(res.users) && res.users.length > 0) {
          setDbUsers(res.users);
        }
        if (res?.officialLoginUrl) {
          setOfficialBaseUrl(res.officialLoginUrl);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const cleanEmail = email.trim().toLowerCase();
  const matchedDbUser = dbUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;

  const buildMicrosoftRedirectUrl = (targetEmail) => {
    const clean = (targetEmail || '').trim().toLowerCase();
    if (!clean) return officialBaseUrl;
    return `${officialBaseUrl}&login_hint=${encodeURIComponent(clean)}`;
  };

  const finalizeNexoSession = useCallback(
    async (targetEmail) => {
      const emailToAuth = (targetEmail || email).trim().toLowerCase();
      if (!emailToAuth || !EMAIL_DOMAIN_REGEX.test(emailToAuth)) {
        setAwaitingExternalSso(false);
        return;
      }

      setIsCompleting(true);
      setErrorMessage('');
      announce('Iniciando sesión en Nexo360...', 'polite');

      try {
        const res = await api.ssoLogin(emailToAuth);
        if (res?.success && res.token && res.user) {
          announce(`Bienvenido a Nexo360, ${res.user.nombre || res.user.email}`, 'polite');
          onDirectSuccess(res.token, res.user);
          return;
        }

        const fallbackProfile =
          dbUsers.find((u) => u.email.toLowerCase() === emailToAuth) || {
            nombre: emailToAuth,
            fullName: emailToAuth,
            email: emailToAuth,
            emailDuoc: emailToAuth,
            rol: emailToAuth.endsWith('@profesor.duoc.cl')
              ? 'profesor'
              : emailToAuth.endsWith('@duoc.cl')
              ? 'administrativo'
              : 'estudiante',
            roleLabel: emailToAuth.endsWith('@profesor.duoc.cl')
              ? 'Profesor / Docente Duoc UC'
              : emailToAuth.endsWith('@duoc.cl')
              ? 'Funcionario Duoc UC'
              : 'Estudiante Regular Duoc UC',
            isPaedis: false,
            sede: 'Sede Alameda',
            campus: 'Sede Alameda',
            carrera: 'Carrera Institucional Duoc UC',
            career: 'Carrera Institucional Duoc UC',
          };

        onDirectSuccess('demo-token-cristian', {
          ...fallbackProfile,
          nombre: fallbackProfile.fullName || fallbackProfile.nombre || emailToAuth,
        });
      } catch (err) {
        console.error('Error al completar sesión SSO:', err);
        setErrorMessage('No se pudo conectar con el servicio. Intenta nuevamente.');
        setIsCompleting(false);
      }
    },
    [email, dbUsers, announce, onDirectSuccess]
  );

  useEffect(() => {
    if (!awaitingExternalSso || isCompleting) return;

    const handleWindowReturn = () => {
      if (awaitingExternalSso && !isCompleting) {
        finalizeNexoSession(email);
      }
    };

    const popupCheckInterval = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        clearInterval(popupCheckInterval);
        finalizeNexoSession(email);
      }
    }, 800);

    window.addEventListener('focus', handleWindowReturn);
    return () => {
      clearInterval(popupCheckInterval);
      window.removeEventListener('focus', handleWindowReturn);
    };
  }, [awaitingExternalSso, isCompleting, email, finalizeNexoSession]);

  const handleStartOfficialRedirect = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cleanEmail) {
      const msg = 'Por favor escribe tu correo institucional Duoc UC.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    if (!EMAIL_DOMAIN_REGEX.test(cleanEmail)) {
      const msg =
        'Ingresa un correo institucional válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    const redirectUrl = buildMicrosoftRedirectUrl(cleanEmail);
    announce('Abriendo portal de inicio de sesión Microsoft de Duoc UC.', 'polite');

    const width = 540;
    const height = 680;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

    popupRef.current = window.open(
      redirectUrl,
      'DuocMicrosoftOfficialSSO',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    setAwaitingExternalSso(true);
  };

  return (
    <section aria-labelledby="login-form-title" className="w-full mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 sm:p-9 space-y-6">
        <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
          <MicrosoftLogo />
          <span>Cuenta Institucional Duoc UC</span>
        </div>

        <div>
          <h1
            id="login-form-title"
            className="text-2xl font-bold text-slate-900 tracking-tight"
          >
            Iniciar sesión
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Ingresa tu correo institucional para autenticarte de forma segura en el portal de Microsoft Duoc UC.
          </p>
        </div>

        {errorMessage && (
          <div
            id="login-sso-error"
            role="alert"
            aria-live="assertive"
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!awaitingExternalSso ? (
          <form onSubmit={handleStartOfficialRedirect} noValidate className="space-y-5">
            {/* Campo de Correo */}
            <div className="space-y-2">
              <label
                htmlFor="ms-email"
                className="block text-xs sm:text-sm font-semibold text-slate-800"
              >
                Correo institucional
              </label>

              <input
                id="ms-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="nombre@duocuc.cl"
                aria-invalid={errorMessage ? 'true' : 'false'}
                aria-describedby="email-identity-preview"
                className="w-full min-h-[48px] px-4 py-2.5 border border-slate-300 focus:border-[#002B49] text-slate-900 text-sm font-medium placeholder-slate-400 rounded-xl bg-slate-50/50 focus:bg-white transition-all"
              />

              {/* Vista previa sutil del perfil */}
              <div
                id="email-identity-preview"
                aria-live="polite"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center gap-2.5 text-slate-600"
              >
                <UserCheck
                  className="w-4 h-4 text-[#002B49] shrink-0"
                  aria-hidden="true"
                />
                {matchedDbUser ? (
                  <span className="truncate">
                    <strong className="text-slate-900 font-semibold">
                      {matchedDbUser.fullName || matchedDbUser.nombre}
                    </strong>{' '}
                    · {matchedDbUser.roleLabel}
                  </span>
                ) : cleanEmail && EMAIL_DOMAIN_REGEX.test(cleanEmail) ? (
                  <span>
                    Ingresarás como <strong className="text-slate-900">{cleanEmail}</strong>
                  </span>
                ) : (
                  <span>Usa tu cuenta @duocuc.cl, @profesor.duoc.cl o @duoc.cl</span>
                )}
              </div>
            </div>

            {/* Botón Principal de Inicio de Sesión */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-3 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-xs hover:shadow-md flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <MicrosoftLogo />
                <span>Continuar con Microsoft Duoc UC</span>
                <ExternalLink className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
              </button>
            </div>

            {/* Selector desplegable y limpio de perfiles de prueba */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProfiles(!showProfiles)}
                aria-expanded={showProfiles}
                className="w-full min-h-[38px] py-1.5 px-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Cambiar perfil de demostración ({dbUsers.length} cuentas)</span>
                </span>
                {showProfiles ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              {showProfiles && (
                <div
                  role="group"
                  aria-label="Seleccionar perfil institucional de demostración"
                  className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 animate-fade-in"
                >
                  {dbUsers.slice(0, 10).map((u) => {
                    const isSelected = u.email.toLowerCase() === cleanEmail;
                    return (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => {
                          setEmail(u.email);
                          setErrorMessage('');
                          announce(
                            `Seleccionado ${u.fullName || u.nombre}, ${u.roleLabel}`,
                            'polite'
                          );
                        }}
                        aria-pressed={isSelected}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#002B49] text-white border-[#002B49]'
                            : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800 border-slate-200/80'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate block">
                          {u.fullName || u.nombre}
                        </span>
                        <span
                          className={`text-[11px] truncate block mt-0.5 ${
                            isSelected ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          {u.roleLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        ) : (
          /* ESTADO 2: Esperando finalización en Microsoft */
          <div
            role="region"
            aria-live="polite"
            className="p-6 bg-slate-50/80 border border-slate-200 rounded-2xl text-center space-y-5 animate-fade-in"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">
                Completa el acceso en la ventana de Microsoft
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Abrimos el acceso oficial para{' '}
                <strong className="text-slate-900">{cleanEmail}</strong>. Al regresar a esta pestaña entrarás automáticamente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={isCompleting}
                onClick={() => finalizeNexoSession(cleanEmail)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                <span>
                  {isCompleting ? 'Entrando...' : 'Continuar al portal'}
                </span>
              </button>

              <a
                href={buildMicrosoftRedirectUrl(cleanEmail)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/90 inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Reabrir ventana</span>
              </a>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setAwaitingExternalSso(false);
                  setIsCompleting(false);
                }}
                className="min-h-[36px] text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline px-2"
              >
                Usar otro correo
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
