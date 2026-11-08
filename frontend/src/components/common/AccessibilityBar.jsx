import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Eye, Type, Activity } from 'lucide-react';

/**
 * // A11y: Barra Superior de Accesibilidad Universal (WCAG 2.2 AA)
 * // A11y: Permanentemente visible para garantizar autonomía inmediata al usuario.
 * // A11y: Sin etiquetas segregadoras, cumpliendo con el principio de diseño universal.
 */
export const AccessibilityBar = () => {
  const {
    fontSize,
    highContrast,
    dyslexicFont,
    reducedMotion,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    toggleDyslexicFont,
    toggleReducedMotion,
  } = useAccessibility();

  return (
    <aside
      id="accessibility-panel"
      aria-label="Panel de configuración de accesibilidad universal"
      className="bg-[#001f35] text-white border-b-2 border-[#FFB81C] px-4 py-2.5 text-sm transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-black flex items-center gap-2 text-[#FFB81C] text-xs sm:text-sm uppercase tracking-wide">
            <span aria-hidden="true" className="w-2.5 h-2.5 bg-[#FFB81C] rounded-full inline-block animate-pulse"></span>
            Accesibilidad Universal:
          </span>
          <span className="text-slate-200 hidden sm:inline text-xs font-semibold">
            Personaliza tu experiencia visual y de lectura en cualquier momento
          </span>
        </div>

        <nav aria-label="Herramientas de ajuste de visualización y lectura" className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Controles de Tamaño de Fuente */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border-2 border-slate-700">
            {/* A11y: Botón con tamaño mínimo de toque de 44x44px */}
            <button
              type="button"
              onClick={decreaseFontSize}
              disabled={fontSize === 'normal'}
              aria-label="Reducir tamaño de letra"
              title="Reducir tamaño de letra (A-)"
              className="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs font-black hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-colors text-white"
            >
              A-
            </button>

            {/* A11y: Región de estado para anunciar el tamaño actual */}
            <span
              className="px-2.5 text-xs font-black text-[#FFB81C] min-w-[48px] text-center"
              aria-live="polite"
              aria-label={`Tamaño actual de texto: ${fontSize === 'normal' ? '100 por ciento' : fontSize === 'large' ? '115 por ciento' : '130 por ciento'}`}
            >
              {fontSize === 'normal' ? '100%' : fontSize === 'large' ? '115%' : '130%'}
            </span>

            <button
              type="button"
              onClick={increaseFontSize}
              disabled={fontSize === 'xlarge'}
              aria-label="Aumentar tamaño de letra"
              title="Aumentar tamaño de letra (A+)"
              className="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs font-black hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-colors text-white"
            >
              A+
            </button>
          </div>

          {/* Toggle Alto Contraste */}
          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            title="Alternar modo de alto contraste (fondo oscuro y texto amarillo de alta visibilidad)"
            className={`min-h-[44px] flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
              highContrast
                ? 'bg-[#FFB81C] text-slate-950 border-white ring-2 ring-white'
                : 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{highContrast ? 'Alto Contraste: SÍ' : 'Alto Contraste'}</span>
          </button>

          {/* Toggle Fuente Dislexia */}
          <button
            type="button"
            onClick={toggleDyslexicFont}
            aria-pressed={dyslexicFont}
            title="Alternar tipografía optimizada para personas con dislexia"
            className={`min-h-[44px] flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
              dyslexicFont
                ? 'bg-[#FFB81C] text-slate-950 border-white ring-2 ring-white'
                : 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Type className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{dyslexicFont ? 'Lectura Fácil: SÍ' : 'Lectura Fácil'}</span>
          </button>

          {/* Toggle Movimiento Reducido */}
          <button
            type="button"
            onClick={toggleReducedMotion}
            aria-pressed={reducedMotion}
            title="Pausar animaciones y efectos de movimiento para evitar fatiga visual o mareos"
            className={`min-h-[44px] flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
              reducedMotion
                ? 'bg-[#FFB81C] text-slate-950 border-white ring-2 ring-white'
                : 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{reducedMotion ? 'Animaciones: NO' : 'Pausar Efectos'}</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};
