import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { MfaPrompt } from '../components/auth/MfaPrompt';
import { ForgotPasswordFlow } from '../components/auth/ForgotPasswordFlow';
import { AccessibilityBar } from '../components/common/AccessibilityBar';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import logo03 from '../assets/logo03.png';

function resolveAuthMode(initialMode, queryMode, hasToken) {
  if (initialMode === 'reset' || queryMode === 'reset' || hasToken) {
    return 'reset';
  }
  if (initialMode === 'forgot' || queryMode === 'forgot') {
    return 'forgot';
  }
  return 'login';
}

export const LoginPage = ({ initialMode = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const urlRecoveryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      mode: (params.get('mode') || '').trim().toLowerCase(),
      token: (params.get('token') || '').trim(),
      email: (params.get('email') || '').trim().toLowerCase(),
    };
  }, [location.search]);

  const [mfaSession, setMfaSession] = useState(null);
  const [authMode, setAuthMode] = useState(() =>
    resolveAuthMode(initialMode, urlRecoveryParams.mode, Boolean(urlRecoveryParams.token))
  );
  const [recoveryEmail, setRecoveryEmail] = useState(urlRecoveryParams.email);
  const [recoveryToken, setRecoveryToken] = useState(urlRecoveryParams.token);

  const { setAuthData, isAuthenticated } = useAuth();
  const { getVoiceProps, clearReadingMode } = useAccessibility();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const resolved = resolveAuthMode(
      initialMode,
      urlRecoveryParams.mode,
      Boolean(urlRecoveryParams.token)
    );
    setAuthMode(resolved);
    if (urlRecoveryParams.email) {
      setRecoveryEmail(urlRecoveryParams.email);
    }
    if (urlRecoveryParams.token) {
      setRecoveryToken(urlRecoveryParams.token);
    }
  }, [initialMode, urlRecoveryParams.mode, urlRecoveryParams.email, urlRecoveryParams.token]);

  // Sincronización de título de página para NVDA y lectores de pantalla (WCAG 2.4.2)
  useEffect(() => {
    const titles = {
      login: 'Iniciar Sesión Institucional | Nexo360 - Duoc UC Alameda',
      forgot: 'Recuperar Contraseña | Nexo360 - Duoc UC Alameda',
      reset: 'Restablecer Contraseña | Nexo360 - Duoc UC Alameda',
      mfa: 'Verificación de Seguridad MFA | Nexo360 - Duoc UC Alameda',
    };
    document.title = titles[mfaSession ? 'mfa' : authMode] || 'Iniciar Sesión | Nexo360';
  }, [authMode, mfaSession]);

  const handleMfaRequired = ({ sessionId, mfaCode, email }) => {
    setMfaSession({ sessionId, initialMfaCode: mfaCode, email });
  };

  const handleApproved = (token, user) => {
    setAuthData(token, user);
    navigate('/dashboard');
  };

  const handleCancelMfa = () => {
    setMfaSession(null);
  };

  const handleOpenForgotPassword = (prefillEmail = '') => {
    setRecoveryEmail(String(prefillEmail || '').trim().toLowerCase());
    setRecoveryToken('');
    setAuthMode('forgot');
  };

  const handleBackToLogin = () => {
    setAuthMode('login');
    setRecoveryToken('');
    if (location.pathname !== '/login' || location.search) {
      navigate('/login', { replace: true });
    }
  };

  const renderAuthFlow = () => {
    if (mfaSession) {
      return (
        <MfaPrompt
          sessionInfo={mfaSession}
          onApproved={handleApproved}
          onCancel={handleCancelMfa}
        />
      );
    }
    if (authMode === 'forgot' || authMode === 'reset') {
      return (
        <ForgotPasswordFlow
          initialMode={authMode === 'reset' ? 'reset' : 'request'}
          initialEmail={recoveryEmail}
          initialToken={recoveryToken}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    return (
      <LoginForm
        onMfaRequired={handleMfaRequired}
        onDirectSuccess={handleApproved}
        onForgotPassword={handleOpenForgotPassword}
      />
    );
  };

  const subtitleText = clearReadingMode
    ? 'Centro de Ayuda Duoc UC'
    : 'Centro de Ayuda y Servicios • Duoc UC - Sede Alameda';

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-900 w-full max-w-full overflow-x-clip">
      <AccessibilityBar />

      <main
        id="main-content"
        tabIndex="-1"
        aria-label="Acceso y autenticación institucional Nexo360"
        className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 px-4 w-full max-w-full animate-fade-in-up focus:outline-none"
      >
        {/* Marca institucional oficial (Logo 03: Nexo360 Duoc UC | Ícono N 360 - Responsive tipo SVG) */}
        <header className="mb-7 text-center">
          <div className="inline-flex flex-col items-center justify-center">
            <img
              src={logo03}
              alt="Nexo360 Duoc UC"
              className="nexo-logo-official w-auto object-contain transition-all duration-200 select-none drop-shadow-xs"
              style={{
                height: 'clamp(44px, 4vw + 20px, 64px)',
                aspectRatio: '1024 / 307'
              }}
            />
            <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-2.5">
              {subtitleText}
            </p>
          </div>
        </header>

        {/* Contenedor del flujo de autenticación */}
        <div className="w-full max-w-[460px]">
          {renderAuthFlow()}
        </div>

        <footer className="mt-8 pt-4 border-t border-slate-300/70 w-full max-w-[460px] text-center">
          <nav aria-label="Enlaces institucionales y legales">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <a
                href="https://www.duoc.cl/terminos"
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps('Términos de uso de Duoc UC')}
                className="min-h-[44px] inline-flex items-center hover:underline hover:text-[#002B49] rounded px-2 py-1"
              >
                Términos de uso
              </a>
              <a
                href="https://www.duoc.cl/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps('Privacidad Duoc UC')}
                className="min-h-[44px] inline-flex items-center hover:underline hover:text-[#002B49] rounded px-2 py-1"
              >
                Privacidad
              </a>
              <span className="min-h-[44px] inline-flex items-center text-slate-400 px-1">
                © 2026 Duoc UC • Sede Alameda
              </span>
            </div>
          </nav>
        </footer>
      </main>
    </div>
  );
};
