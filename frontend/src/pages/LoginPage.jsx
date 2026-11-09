import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { MfaPrompt } from '../components/auth/MfaPrompt';
import { AccessibilityBar } from '../components/common/AccessibilityBar';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [mfaSession, setMfaSession] = useState(null);
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex flex-col bg-[#F6F8FA] text-slate-900">
      <AccessibilityBar />

      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center py-10 px-4 animate-fade-in-up"
      >
        {/* Marca institucional limpia */}
        <header className="mb-7 text-center">
          <div className="inline-flex items-center gap-3">
            <div
              className="w-11 h-11 bg-[#002B49] rounded-xl flex items-center justify-center shadow-xs"
              aria-hidden="true"
            >
              <span className="text-[#FFB81C] font-bold text-xl leading-none">N</span>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-[#002B49] leading-tight">
                Nexo<span className="text-amber-600">360</span>
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Centro de Ayuda y Servicios • Duoc UC
              </p>
            </div>
          </div>
        </header>

        {/* Contenedor del flujo de autenticación */}
        <div className="w-full max-w-lg">
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

        <footer className="mt-8 text-center">
          <nav aria-label="Enlaces institucionales y legales">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <a
                href="https://www.duoc.cl/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] inline-flex items-center hover:underline hover:text-[#002B49] rounded px-1.5"
              >
                Términos de uso
              </a>
              <a
                href="https://www.duoc.cl/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] inline-flex items-center hover:underline hover:text-[#002B49] rounded px-1.5"
              >
                Privacidad
              </a>
              <span className="min-h-[38px] inline-flex items-center text-slate-400">
                © 2026 Duoc UC
              </span>
            </div>
          </nav>
        </footer>
      </main>
    </div>
  );
};
