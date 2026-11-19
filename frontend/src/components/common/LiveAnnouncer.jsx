import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

/**
 * Región en vivo ARIA (WCAG 2.2 Criterio de Éxito 4.1.3 - Mensajes de Estado)
 * Compatible con lectores de pantalla estándar (NVDA, JAWS, VoiceOver, Narrador).
 * Separa regiones corteses (role="status" / polite) de alertas críticas (role="alert" / assertive)
 * para garantizar que NVDA capture avisos sin solapamientos ni pérdida de contexto.
 */
export const LiveAnnouncer = () => {
  const { announcement, announcementPriority } = useAccessibility();

  const isAssertive = announcementPriority === 'assertive';

  return (
    <div className="sr-only" aria-hidden="false">
      {/* Región de estado para avisos informativos y cambios de pestaña (NVDA role="status") */}
      <div
        id="nvda-live-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="additions text"
      >
        {!isAssertive ? announcement : ''}
      </div>

      {/* Región de alerta para avisos críticos, errores y modales (NVDA role="alert") */}
      <div
        id="nvda-live-alert"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-relevant="additions text"
      >
        {isAssertive ? announcement : ''}
      </div>
    </div>
  );
};
