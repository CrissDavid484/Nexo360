import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { MfaPrompt } from '../components/auth/MfaPrompt';
import { AccessibilityBar } from '../components/common/AccessibilityBar';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import logo03 from '../assets/logo03.png';

export const LoginPage = () => {
  const [mfaSession, setMfaSession] = useState(null);
  const { setAuthData, isAuthenticated } = useAuth();
  const { getVoiceProps } = useAccessibility();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-900">
      <AccessibilityBar />

      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center py-10 px-4 animate-fade-in-up"
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
              Centro de Ayuda y Servicios • Duoc UC - Sede Alameda
            </p>
          </div>
        </header>

        {/* Contenedor del flujo de autenticación */}
        <div className="w-full max-w-[460px]">
          {mfaSession ? (
            <MfaPrompt
              sessionInfo={mfaSession}
              onApproved={handleApproved}
              onCancel={handleCancelMfa}
            />
          ) : (
            <LoginForm
              onMfaRequired={handleMfaRequired}
              onDirectSuccess={handleApproved}
            />
          )}
        </div>

        <footer className="mt-8 pt-4 border-t border-slate-300/70 w-full max-w-[460px] text-center">
          <nav aria-label="Enlaces institucionales y legales">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <a
                href="https://www.duoc.cl/terminos"
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps('Términos de uso de Duoc UC')}
                className="min-h-[38px] inline-flex items-center hover:underline hover:text-[#002B49] rounded px-1.5"
              >
                Términos de uso
              </a>
              <a
                href="https://www.duoc.cl/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps('Privacidad Duoc UC')}
                className="min-h-[38px] inline-flex items-center hover:underline hover:text-[#002B49] rounded px-1.5"
              >
                Privacidad
              </a>
              <span className="min-h-[38px] inline-flex items-center text-slate-400">
                © 2026 Duoc UC • Sede Alameda
              </span>
            </div>
          </nav>
        </footer>
      </main>
    </div>
  );
};
