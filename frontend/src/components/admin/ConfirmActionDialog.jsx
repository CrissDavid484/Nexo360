import React, { useRef } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2';

/**
 * Diálogo de confirmación accesible (alertdialog) para acciones destructivas.
 * Escape cancela, el foco queda atrapado y vuelve al disparador al cerrar.
 * El foco inicial va a "Cancelar" (opción segura).
 */
export const ConfirmActionDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const { getVoiceProps } = useAccessibility();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useAccessibleModal({
    isOpen,
    onClose: onCancel,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 animate-fade-in overscroll-contain">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-message"
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain p-6 shadow-2xl border border-red-300 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="confirm-action-title" className="text-base sm:text-lg font-black text-slate-950">
              {title}
            </h3>
            <p id="confirm-action-message" className="mt-1 text-sm text-slate-800 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            {...getVoiceProps('Cancelar y volver sin hacer cambios')}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 cursor-pointer ${FOCUS_RING}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            {...getVoiceProps(`${confirmLabel}. Esta acción no se puede deshacer.`)}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-black bg-red-800 hover:bg-red-900 text-white inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${FOCUS_RING}`}
          >
            {busy && <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
