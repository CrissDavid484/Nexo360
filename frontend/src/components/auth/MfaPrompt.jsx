import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

export const MfaPrompt = ({ sessionInfo, onApproved, onCancel }) => {
  const { sessionId, initialMfaCode, email } = sessionInfo;
  const [currentCode, setCurrentCode] = useState(initialMfaCode || '..');
  const [isApproved, setIsApproved] = useState(false);
  const [pollError, setPollError] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const { announce } = useAccessibility();
  const pollIntervalRef = useRef(null);
  const MAX_POLL_COUNT = 150; // 5 minutos (150 intentos × 2 segundos)

  // Anunciar código al montar el componente
  useEffect(() => {
    if (initialMfaCode && initialMfaCode !== '..') {
      announce(
        `Aprobación requerida. Abre Microsoft Authenticator y selecciona el número ${initialMfaCode}`,
        'assertive'
      );
    }
  }, [initialMfaCode]);

  // Polling cada 2 segundos
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await api.checkMfaStatus(sessionId);

        if (!isMounted) return;

        setPollCount((prev) => prev + 1);

        // Verificar si la sesión MFA expiró (máx 5 minutos)
        if (pollCount >= MAX_POLL_COUNT) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPollError('La sesión de aprobación expiró. Por favor vuelve a iniciar sesión.');
          announce('La sesión de aprobación expiró.', 'assertive');
          return;
        }

        if (res.mfaCode && res.mfaCode !== currentCode) {
          setCurrentCode(res.mfaCode);
          announce(`Código de autenticación actualizado a: ${res.mfaCode}`, 'assertive');
        }

        if (res.status === 'COMPLETED') {
          // Detener polling
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

          setIsApproved(true);
          announce('Sesión iniciada con éxito. Redirigiendo al panel principal.', 'assertive');

          // Esperar breve momento para que el usuario perciba la confirmación
          setTimeout(() => {
            if (isMounted) {
              onApproved(res.token, res.user);
            }
          }, 1500);
        } else if (res.status === 'FAILED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPollError(res.errorMessage || 'La solicitud fue rechazada o expiró.');
          announce('Error en la autenticación institucional.', 'assertive');
        }
      } catch (err) {
        console.error('Error durante polling de MFA:', err);
      }
    };

    // Iniciar primer chequeo inmediato y luego cada 2s
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId, currentCode]);

  return (
    <div
      role="region"
      aria-labelledby="mfa-heading"
      className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border-2 border-amber-400 p-8 sm:p-10 transition-all text-center"
    >
      {/* Icono de Teléfono / Authenticator */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 text-amber-600 mb-6 border-4 border-amber-400 animate-pulse">
        <Smartphone className="w-10 h-10" aria-hidden="true" />
      </div>

      <h1 id="mfa-heading" className="text-3xl font-black text-slate-900 tracking-tight">
        Aprobación Requerida
      </h1>

      <p className="mt-3 text-base text-slate-600">
        Hemos enviado una notificación a la aplicación <strong className="text-slate-900">Microsoft Authenticator</strong> vinculada a tu cuenta institucional:
      </p>

      <p className="text-sm font-semibold text-duoc-navy bg-slate-100 py-1.5 px-3 rounded-lg inline-block mt-2">
        {email}
      </p>

      {/* Caja Grande con el Número de Autenticación */}
      <div className="my-8 p-6 bg-slate-950 text-amber-400 rounded-2xl border-4 border-amber-400 shadow-inner">
        <span className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">
          Número para marcar en tu teléfono
        </span>
        <div
          aria-label={`Número de aprobación: ${currentCode}`}
          className="text-7xl sm:text-8xl font-black font-mono tracking-widest select-all"
        >
          {currentCode}
        </div>
        <p className="mt-3 text-xs text-slate-300">
          Abre la aplicación en tu celular y pulsa este número para verificar tu identidad.
        </p>
      </div>

      {/* Estado del Polling / Éxito / Error */}
      {isApproved ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-center gap-3 text-emerald-900 font-bold text-lg"
        >
          <CheckCircle2 className="w-7 h-7 text-emerald-600" aria-hidden="true" />
          <span>¡Sesión Iniciada con Éxito! Redirigiendo...</span>
        </div>
      ) : pollError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-900 font-medium text-sm text-left mb-4"
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
            <span>Fallo de Aprobación</span>
          </div>
          <p>{pollError}</p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 focus:ring-4 focus:ring-red-400"
          >
            Volver a Intentar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 text-slate-600 text-sm font-medium py-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" aria-hidden="true" />
          <span>Esperando aprobación en tu dispositivo móvil...</span>
        </div>
      )}

      {/* Botón para Cancelar o Regresar */}
      {!isApproved && !pollError && (
        <div className="mt-8 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 focus:ring-4 focus:ring-amber-400"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Cancelar y volver al formulario</span>
          </button>
        </div>
      )}
    </div>
  );
};
