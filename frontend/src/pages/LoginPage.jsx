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
    /*
     * Fondo estilo Microsoft: blanco puro en centro,
     * imagen de fondo sutil con el gradiente de Duoc UC
     */
    <main
      id="main-content"
      className="flex-1 flex flex-col items-center justify-center min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f3f2f1 0%, #e8e8e8 100%)',
      }}
    >
      {/* Logo Duoc UC arriba del card — al estilo MS Login */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3">
          {/* Ícono cuadrado Duoc (simulado con colores institucionales) */}
          <div className="w-10 h-10 bg-[#002B49] rounded flex items-center justify-center shadow">
            <span className="text-amber-400 font-black text-lg leading-none">D</span>
          </div>
          <div className="text-left">
            <p className="text-[0.7rem] text-slate-500 font-medium uppercase tracking-widest leading-none">
              Duoc UC
            </p>
            <p className="text-[1.1rem] font-bold text-slate-900 leading-tight">
              Nexo<span className="text-amber-500">360</span>
            </p>
          </div>
        </div>
      </div>

      {/* Formulario o pantalla MFA */}
      <div className="w-full max-w-sm px-4">
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

      {/* Footer institucional mínimo */}
      <footer className="mt-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.7rem] text-slate-500">
          <a href="https://www.duoc.cl/terminos" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Términos de uso
          </a>
          <a href="https://www.duoc.cl/privacidad" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Privacidad y cookies
          </a>
          <span>© 2026 Duoc UC · PAEDIS</span>
        </div>
      </footer>
    </main>
  );
};
