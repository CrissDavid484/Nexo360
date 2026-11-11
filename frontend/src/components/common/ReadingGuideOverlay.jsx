import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

/**
 * =========================================================================
 * GUÍA DE LECTURA / REGLA DE ENFOQUE NEURODIVERGENTE (W3C COGA & BDA)
 * =========================================================================
 * Ayuda técnica diseñada para personas con Dislexia, TDAH y fatiga cognitiva.
 * Despliega una franja suave y translúcida que sigue la posición vertical del
 * cursor, evitando el salto involuntario de líneas ("line jumping") y la
 * saturación visual provocada por bloques densos de texto.
 *
 * Características:
 * - pointer-events: none (no bloquea clics, selecciones ni navegación).
 * - Rendimiento optimizado mediante requestAnimationFrame.
 * - Desactivable con un clic en la barra de accesibilidad.
 */
export const ReadingGuideOverlay = () => {
  const { readingGuide } = useAccessibility();
  const [mouseY, setMouseY] = useState(-100);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!readingGuide) {
      setIsVisible(false);
      return;
    }

    let rafId = null;
    const handleMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setMouseY(e.clientY);
        setIsVisible(true);
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [readingGuide]);

  if (!readingGuide || !isVisible || mouseY < 0) {
    return null;
  }

  return (
    <div
      id="reading-guide-overlay"
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-40 transition-transform duration-75 ease-out select-none"
      style={{
        top: 0,
        transform: `translateY(${mouseY - 20}px)`,
        height: '42px',
      }}
    >
      {/* Franja de lectura translúcida con bordes dorados suaves */}
      <div className="w-full h-full bg-amber-400/15 border-y-2 border-amber-500/40 shadow-[0_0_15px_rgba(255,184,28,0.2)] backdrop-contrast-[1.05]" />
    </div>
  );
};
