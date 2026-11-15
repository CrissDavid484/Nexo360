import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

/**
 * =========================================================================
 * CORTINA DE TRANSICIÓN VISUAL AL CAMBIAR DE TEMA (CLARO <-> OSCURO)
 * =========================================================================
 * Añade un barrido visual suave tipo telón / cortina de revelación ("curtain reveal")
 * con borde sutil dorado institucional Duoc UC (#FFB81C) al alternar apariencias.
 *
 * Características:
 * - pointer-events: none (no interfiere con el uso).
 * - z-[9998] (por debajo de la regla de lectura z-[9999], pero sobre el resto).
 * - Desactivado automáticamente si el usuario tiene activado movimiento reducido.
 */
export const ThemeCurtainOverlay = () => {
  const { isCurtainAnimating, reducedMotion } = useAccessibility();

  if (!isCurtainAnimating || reducedMotion) {
    return null;
  }

  return (
    <div
      id="theme-curtain-overlay"
      aria-hidden="true"
      className="theme-curtain-overlay pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
    >
      {/* Velo con haz dorado que desciende barriendo la pantalla */}
      <div className="w-full h-full relative">
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FFB81C] to-transparent shadow-[0_0_24px_rgba(255,184,28,0.9)] animate-curtain-beam" />
      </div>
    </div>
  );
};
