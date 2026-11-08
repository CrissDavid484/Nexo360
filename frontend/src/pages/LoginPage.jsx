import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { MfaPrompt } from '../components/auth/MfaPrompt';
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
    // A11y: Elemento semántico <main> con id para salto directo de SkipLink
    <main
      id="main-content"
      className="flex-1 flex flex-col items-center justify-center min-h-screen py-10 px-4"
      style={{
        background: 'linear-gradient(135deg, #f3f2f1 0%, #e8e8e8 100%)',
      }}
    >
      {/* Logo Duoc UC arriba del formulario estilo institucional */}
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-3">
          {/* A11y: Ícono decorativo con aria-hidden="true" */}
          <div
            className="w-12 h-12 bg-[#002B49] rounded-xl flex items-center justify-center shadow border-2 border-amber-400"
            aria-hidden="true"
          >
            <span className="text-[#FFB81C] font-black text-xl leading-none">D</span>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-700 font-extrabold uppercase tracking-widest leading-none">
              Duoc UC • Portal Estudiantil
            </p>
            <p className="text-xl font-black text-slate-900 leading-tight">
              Nexo<span className="text-amber-600">360</span>
            </p>
          </div>
        </div>
      </header>

      {/* Contenedor del flujo de autenticación */}
      <div className="w-full max-w-md">
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

      {/* A11y: Pie de página semántico <footer> con enlaces accesibles y target size mínimo de 44px */}
      <footer className="mt-10 text-center">
        <nav aria-label="Enlaces institucionales y legales">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-700">
            <a
              href="https://www.duoc.cl/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center hover:underline hover:text-[#002B49] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 rounded px-2"
            >
              Términos de uso (abre en nueva pestaña)
            </a>
            <a
              href="https://www.duoc.cl/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center hover:underline hover:text-[#002B49] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 rounded px-2"
            >
              Privacidad y cookies (abre en nueva pestaña)
            </a>
            <span className="min-h-[44px] inline-flex items-center text-slate-600">
              © 2026 Duoc UC • Nexo360
            </span>
          </div>
        </nav>
      </footer>
    </main>
  );
};
