import React from 'react';

/**
 * Enlace de salto accesible (Skip to Content)
 * Cumple con WCAG 2.2 Criterio de Éxito 2.4.1 (Evitar Bloques)
 */
export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only sr-only-focusable bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-b-lg shadow-xl border-2 border-slate-950 transition-all focus:top-0 focus:left-4 fixed z-[99999]"
    >
      Saltar directamente al contenido principal (Presiona Enter)
    </a>
  );
};
