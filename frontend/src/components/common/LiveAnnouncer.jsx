import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

/**
 * Región en vivo ARIA (WCAG 2.2 Criterio de Éxito 4.1.3 - Mensajes de Estado)
 * Permite que los lectores de pantalla (NVDA, JAWS, VoiceOver) escuchen
 * actualizaciones dinámicas de la aplicación sin perder el foco.
 */
export const LiveAnnouncer = () => {
  const { announcement, announcementPriority } = useAccessibility();

  return (
    <div
      role="status"
      aria-live={announcementPriority}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};
