import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, Volume2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

const BASE_MAX_POLL_COUNT = 150; // 5 minutos (150 intentos × 2 segundos)
const MAX_CONSECUTIVE_ERRORS = 3;

export const MfaPrompt = ({ sessionInfo, onApproved, onCancel }) => {
  const { sessionId, initialMfaCode, email } = sessionInfo;
  const [currentCode, setCurrentCode] = useState(initialMfaCode || '..');
  const [isApproved, setIsApproved] = useState(false);
  const [pollError, setPollError] = useState(null);
  const { announce, getVoiceProps, voiceReader, speakText } = useAccessibility();

  const MAX_POLL_COUNT = voiceReader ? BASE_MAX_POLL_COUNT * 2 : BASE_MAX_POLL_COUNT;

  const pollIntervalRef = useRef(null);
  const redirectTimeoutRef = useRef(null);
  const pollCountRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const isPollingInFlightRef = useRef(false);
  const currentCodeRef = useRef(initialMfaCode || '..');
  const maxPollCountRef = useRef(MAX_POLL_COUNT);
  maxPollCountRef.current = MAX_POLL_COUNT;

  const handleRepeatCode = () => {
    const message = `Código de aprobación para Microsoft Authenticator: ${currentCode}`;
    announce(message, 'assertive');
    speakText(message, { force: true });
  };

  // A11y: Anuncio por voz accesible al montar el componente
  useEffect(() => {
    if (initialMfaCode && initialMfaCode !== '..') {
      announce(
        `Aprobación requerida. Abre Microsoft Authenticator en tu celular y pulsa el número ${initialMfaCode}`,
        'assertive'
      );
    }
  }, [initialMfaCode, announce]);

  // Polling reactivo cada 2 segundos sin stale closures ni promesas colgantes
  useEffect(() => {
    let isMounted = true;
    pollCountRef.current = 0;
    consecutiveErrorsRef.current = 0;
    isPollingInFlightRef.current = false;

    const clearPollingInterval = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    const failPolling = (message) => {
      clearPollingInterval();
      if (!isMounted) return;
      setPollError(message);
      announce(message, 'assertive');
    };

    const checkStatus = async () => {
      if (!isMounted || isPollingInFlightRef.current) return;
      isPollingInFlightRef.current = true;

      try {
        const res = await api.checkMfaStatus(sessionId);
        if (!isMounted) return;

        consecutiveErrorsRef.current = 0;
        pollCountRef.current += 1;

        if (pollCountRef.current >= maxPollCountRef.current) {
          failPolling('La sesión de aprobación expiró. Por favor vuelve a iniciar sesión.');
          return;
        }

        if (res?.mfaCode && res.mfaCode !== currentCodeRef.current) {
          currentCodeRef.current = res.mfaCode;
          setCurrentCode(res.mfaCode);
          announce(`Código de autenticación actualizado a: ${res.mfaCode}`, 'assertive');
        }

        if (res?.status === 'COMPLETED') {
          clearPollingInterval();
          setIsApproved(true);
          announce('Sesión iniciada con éxito. Redirigiendo al panel principal de Nexo360.', 'assertive');

          redirectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              onApproved(res.token, res.user);
            }
          }, 1500);
        } else if (res?.status === 'FAILED') {
          failPolling(res.errorMessage || 'La solicitud fue rechazada o expiró.');
        }
      } catch (err) {
        console.error('Error durante polling de MFA:', err);
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
          failPolling('No se pudo verificar el estado de aprobación MFA. Intenta nuevamente.');
        }
      } finally {
        isPollingInFlightRef.current = false;
      }
    };

    const runPoll = () => {
      checkStatus().catch((err) => {
        console.error('[MfaPrompt] Fallo inesperado al consultar estado MFA:', err);
      });
    };

    runPoll();
    pollIntervalRef.current = setInterval(runPoll, 2000);

    return () => {
      isMounted = false;
      clearPollingInterval();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [sessionId, announce, onApproved]);

  return (
    // A11y: Uso de etiqueta semántica <section> con etiquetado accesible para lectores de pantalla
    <section
      aria-labelledby="mfa-heading"
      className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-slate-300 border-t-4 border-t-[#002B49] p-8 sm:p-10 transition-all text-center"
    >
      {/* Icono de Teléfono / Authenticator */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-[#002B49] mb-5 border border-slate-200">
        {/* A11y: Icono decorativo marcado con aria-hidden="true" */}
        <Smartphone className="w-8 h-8" aria-hidden="true" />
      </div>

      {/* A11y: Título único asociado a la sección */}
      <h1 id="mfa-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        Aprobación Requerida
      </h1>

      <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
        Hemos enviado una notificación a la aplicación <strong className="text-slate-950 font-black">Microsoft Authenticator</strong> vinculada a tu cuenta institucional Duoc UC:
      </p>

      <p className="text-sm font-bold text-[#002B49] bg-slate-100 py-2 px-4 rounded-lg inline-block mt-3 border border-slate-300">
        {email}
      </p>

      {/* A11y: Caja de alta visibilidad para el número de autenticación con botón interactivo accesible */}
      <div
        role="region"
        aria-label="Número de confirmación en dos pasos"
        {...getVoiceProps(`Número de confirmación en dos pasos: ${currentCode}`)}
        className="my-7 p-6 bg-[#001D33] text-[#FFB81C] rounded-2xl border-2 border-[#002B49] ring-2 ring-[#FFB81C]/70"
      >
        <span className="block text-xs uppercase tracking-widest text-slate-200 font-bold mb-2">
          Número para marcar en tu teléfono
        </span>
        <div
          aria-live="polite"
          aria-atomic="true"
          className="text-6xl sm:text-7xl font-black font-mono tracking-widest select-all text-[#FFB81C]"
        >
          {currentCode}
        </div>
        <p className="mt-3 text-xs text-slate-200 font-medium">
          Abre la aplicación en tu celular y pulsa este número para verificar tu identidad.
        </p>
        {voiceReader && (
          <p className="mt-1.5 text-[11px] font-semibold text-[#FFB81C]">
            Tiempo de espera extendido (10 minutos) activo para Lectura por Voz.
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-white/15 flex justify-center">
          <button
            type="button"
            onClick={handleRepeatCode}
            {...getVoiceProps('Escuchar código nuevamente')}
            className="min-h-[44px] px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
            <span>Escuchar código nuevamente</span>
          </button>
        </div>
      </div>

      {/* A11y: Estado dinámico con notificaciones para tecnologías asistivas */}
      {isApproved ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-center justify-center gap-3 text-emerald-950 font-black text-base sm:text-lg"
        >
          <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>¡Sesión Iniciada con Éxito! Redirigiendo...</span>
        </div>
      ) : pollError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-50 border-2 border-red-600 rounded-xl text-red-950 font-bold text-sm text-left mb-4"
        >
          <div className="flex items-center gap-2 mb-1 text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
            <span className="font-black">Fallo de Aprobación</span>
          </div>
          <p className="text-xs text-red-900 mt-1">{pollError}</p>
          {/* A11y: Botón con tamaño mínimo de toque 44px y foco ultra-visible */}
          <button
            type="button"
            onClick={onCancel}
            {...getVoiceProps('Volver a intentar inicio de sesión')}
            className="mt-3 w-full min-h-[44px] py-2.5 px-4 bg-red-700 text-white rounded-lg font-black text-sm hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-all"
          >
            Volver a Intentar
          </button>
        </div>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 text-slate-800 text-sm font-bold py-2"
        >
          <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" aria-hidden="true" />
          <span>Esperando aprobación en tu dispositivo móvil...</span>
        </div>
      )}

      {/* A11y: Botón para Cancelar con tamaño táctil mínimo 44px */}
      {!isApproved && !pollError && (
        <div className="mt-8 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            {...getVoiceProps('Cancelar y volver al formulario')}
            className="min-h-[44px] inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950 px-5 py-2.5 rounded-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Cancelar y volver al formulario</span>
          </button>
        </div>
      )}
    </section>
  );
};
