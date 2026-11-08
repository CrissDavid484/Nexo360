import React from 'react';

/**
 * // A11y: Enlace de salto accesible (Skip to Content) - WCAG 2.2 Criterio 2.4.1 (Evitar Bloques).
 * // A11y: Permite a usuarios de teclado y lectores de pantalla saltar la navegación e ir directo al contenido.
 * // A11y: Foco ultra-visible con anillo institucional Duoc UC (#FFB81C) y tamaño táctil mínimo > 44px.
 */
export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[99999] min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-6 py-3 bg-[#FFB81C] text-slate-950 font-black text-sm rounded-lg shadow-2xl border-2 border-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-transform"
    >
      Saltar directamente al contenido principal (Presiona Enter)
    </a>
  );
};
