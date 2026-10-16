import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { MfaPrompt } from '../components/auth/MfaPrompt';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Accessibility, HelpCircle } from 'lucide-react';

export const LoginPage = () => {
  const [mfaSession, setMfaSession] = useState(null);
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const handleMfaRequired = ({ sessionId, mfaCode, email }) => {
    setMfaSession({
      sessionId,
      initialMfaCode: mfaCode,
      email,
    });
  };

  const handleApproved = (token, user) => {
    setAuthData(token, user);
    navigate('/dashboard');
  };

  const handleCancelMfa = () => {
    setMfaSession(null);
  };

  return (
    <main id="main-content" className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Banner de Bienvenida Accesible */}
        <section aria-labelledby="portal-welcome-heading" className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-duoc-navy text-amber-400 font-bold text-xs uppercase tracking-wider mb-4 border border-amber-400">
            <Accessibility className="w-4 h-4" aria-hidden="true" />
            <span>Plataforma Oficial Duoc UC • Programa PAEDIS</span>
          </div>

          <h2 id="portal-welcome-heading" className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Acceso Centralizado <span className="text-duoc-navy">Nexo</span><span className="text-amber-500">360</span>
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto font-medium">
            Todos los servicios institucionales, trámites y acompañamiento en un único entorno accesible, diseñado conforme a las pautas WCAG 2.2 AA.
          </p>
        </section>

        {/* Componente Dinámico: Formulario o Pantalla MFA */}
        <div className="mt-4">
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

        {/* Garantías de Seguridad y Accesibilidad */}
        <section aria-label="Información de seguridad y soporte" className="mt-12 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3 shadow-sm">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="block text-slate-900 font-bold mb-0.5">Zero-Knowledge Credentials</strong>
              <span>Tus contraseñas no se guardan en ninguna base de datos interna.</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3 shadow-sm">
            <HelpCircle className="w-5 h-5 text-duoc-navy flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="block text-slate-900 font-bold mb-0.5">Soporte PAEDIS</strong>
              <span>¿Problemas para acceder? Contacta a la coordinación de tu sede.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
