import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Eye, Type, Sparkles, Activity } from 'lucide-react';

/**
 * Barra Superior de Accesibilidad Universal
 * Permite al estudiante adaptar visualmente y motrizmente la interfaz.
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
      aria-label="Panel de configuración de accesibilidad"
      className="bg-duoc-navy text-white border-b-2 border-amber-400 px-4 py-2 text-sm select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold flex items-center gap-1.5 text-amber-300">
            <span aria-hidden="true" className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block animate-pulse"></span>
            PAEDIS Accesibilidad:
          </span>
          <span className="text-slate-200 hidden sm:inline">Personaliza tu experiencia de lectura</span>
        </div>

        <nav aria-label="Herramientas de visualización" className="flex flex-wrap items-center gap-2">
          {/* Controles de Tamaño de Fuente */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={decreaseFontSize}
              disabled={fontSize === 'normal'}
              aria-label="Reducir tamaño de letra"
              title="Reducir tamaño de letra"
              className="px-2.5 py-1 text-xs font-bold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded focus:ring-2 focus:ring-amber-400"
            >
              A-
            </button>
            <span className="px-2 text-xs font-semibold text-amber-300" aria-current="true">
              {fontSize === 'normal' ? '100%' : fontSize === 'large' ? '115%' : '130%'}
            </span>
            <button
              type="button"
              onClick={increaseFontSize}
              disabled={fontSize === 'xlarge'}
              aria-label="Aumentar tamaño de letra"
              title="Aumentar tamaño de letra"
              className="px-2.5 py-1 text-xs font-bold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded focus:ring-2 focus:ring-amber-400"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition-all ${
              highContrast
                ? 'bg-yellow-400 text-slate-950 border-white font-bold ring-2 ring-white'
                : 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>{highContrast ? 'Alto Contraste: SÍ' : 'Alto Contraste'}</span>
          </button>

          {/* Toggle Fuente Dislexia */}
          <button
            type="button"
            onClick={toggleDyslexicFont}
            aria-pressed={dyslexicFont}
            title="Alternar fuente optimizada para lectura con dislexia"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition-all ${
              dyslexicFont
                ? 'bg-amber-400 text-slate-950 border-white font-bold'
                : 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Type className="w-4 h-4" aria-hidden="true" />
            <span>{dyslexicFont ? 'Lectura Fácil: SÍ' : 'Lectura Fácil'}</span>
          </button>

          {/* Toggle Movimiento Reducido */}
          <button
            type="button"
            onClick={toggleReducedMotion}
            aria-pressed={reducedMotion}
            title="Pausar animaciones y efectos de movimiento para evitar mareos o fatiga"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition-all ${
              reducedMotion
                ? 'bg-amber-400 text-slate-950 border-white font-bold'
                : 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" aria-hidden="true" />
            <span>{reducedMotion ? 'Animaciones: NO' : 'Pausar Efectos'}</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};
