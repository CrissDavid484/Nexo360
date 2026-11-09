import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  Type,
  PauseCircle,
  SlidersHorizontal,
  RotateCcw,
  X,
  Moon,
  Sun,
} from 'lucide-react';

/**
 * Widget Flotante de Ajustes de Lectura y Apariencia
 * Integra el switch 3D "cosmic-toggle" (Uiverse.io by 3HugaDa3) para el cambio Claro / Oscuro
 * y corrige el contraste del botón flotante e insignias en ambos modos.
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
    resetPreferences,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeCount =
    (fontSize !== 'normal' ? 1 : 0) +
    (highContrast ? 1 : 0) +
    (dyslexicFont ? 1 : 0) +
    (reducedMotion ? 1 : 0);

  const hasActivePreferences = activeCount > 0;

  const fontPercentage =
    fontSize === 'normal' ? '100%' : fontSize === 'large' ? '115%' : '130%';

  // Cerrar con tecla Escape o al hacer clic fuera del menú flotante
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCosmicMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--x', `${x}%`);
    e.currentTarget.style.setProperty('--y', `${y}%`);
  };

  return (
    <aside
      id="accessibility-panel"
      ref={containerRef}
      aria-label="Ajustes de apariencia y lectura"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end"
    >
      {/* Panel flotante desplegable */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Opciones de apariencia y lectura"
          className="mb-3 w-[320px] sm:w-[350px] bg-white text-slate-900 rounded-2xl border border-slate-200/90 shadow-2xl p-5 space-y-4 animate-scale-in origin-bottom-right"
        >
          {/* Cabecera del panel */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900">
                Ajustes de vista y lectura
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {hasActivePreferences && (
                <button
                  type="button"
                  onClick={resetPreferences}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#002B49] hover:underline px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Restablecer valores predeterminados"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Restablecer</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar panel de ajustes"
                className="min-h-[32px] min-w-[32px] rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 1. Cambio de Claro a Oscuro con Uiverse Cosmic Toggle (by 3HugaDa3) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {highContrast ? (
                <Moon className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {highContrast ? 'Modo Oscuro Activo' : 'Modo Claro / Oscuro'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {highContrast ? 'Alto contraste nocturno' : 'Cambiar a apariencia oscura'}
                </span>
              </div>
            </div>

            <div className="cosmic-toggle-wrapper">
              <label
                className="cosmic-toggle"
                onMouseMove={handleCosmicMouseMove}
                title="Alternar entre modo claro y modo oscuro"
              >
                <input
                  className="toggle"
                  type="checkbox"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                  aria-label="Alternar entre modo claro y modo oscuro de alto contraste"
                />
                <div className="slider">
                  <div className="cosmos" />
                  <div className="energy-line" />
                  <div className="energy-line" />
                  <div className="energy-line" />
                  <div className="toggle-orb">
                    <div className="inner-orb" />
                    <div className="ring" />
                  </div>
                  <div className="particles">
                    <div style={{ '--angle': '30deg' }} className="particle" />
                    <div style={{ '--angle': '90deg' }} className="particle" />
                    <div style={{ '--angle': '150deg' }} className="particle" />
                    <div style={{ '--angle': '210deg' }} className="particle" />
                    <div style={{ '--angle': '270deg' }} className="particle" />
                    <div style={{ '--angle': '330deg' }} className="particle" />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Tamaño del texto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Tamaño de letra</span>
              <span
                className="font-bold text-[#002B49]"
                aria-live="polite"
              >
                {fontPercentage}
              </span>
            </div>

            <div
              role="group"
              aria-label="Ajustar tamaño de letra"
              className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/70"
            >
              <button
                type="button"
                onClick={decreaseFontSize}
                disabled={fontSize === 'normal'}
                aria-label="Reducir tamaño de texto"
                className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg shadow-2xs transition-all flex items-center justify-center"
              >
                A-
              </button>

              <span className="min-h-[36px] flex items-center justify-center text-xs font-semibold text-slate-600 select-none">
                {fontPercentage}
              </span>

              <button
                type="button"
                onClick={increaseFontSize}
                disabled={fontSize === 'xlarge'}
                aria-label="Aumentar tamaño de texto"
                className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg shadow-2xs transition-all flex items-center justify-center"
              >
                A+
              </button>
            </div>
          </div>

          {/* 3. Opciones de comodidad de lectura */}
          <div className="space-y-2 pt-1">
            {/* Lectura Cómoda / Dislexia */}
            <button
              type="button"
              onClick={toggleDyslexicFont}
              aria-pressed={dyslexicFont}
              className={`a11y-option-btn w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-200 ${
                dyslexicFont
                  ? 'bg-[#002B49] text-white border-[#002B49]'
                  : 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-800 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type
                  className={`w-4 h-4 shrink-0 ${
                    dyslexicFont ? 'text-[#FFB81C]' : 'text-[#002B49]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <span className="text-xs font-bold block leading-tight">
                    Lectura cómoda
                  </span>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      dyslexicFont ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    Tipografía amigable para dislexia
                  </span>
                </div>
              </div>

              <span
                aria-hidden="true"
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                  dyslexicFont ? 'bg-[#FFB81C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`a11y-switch-thumb w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    dyslexicFont ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>

            {/* Sin Animaciones */}
            <button
              type="button"
              onClick={toggleReducedMotion}
              aria-pressed={reducedMotion}
              className={`a11y-option-btn w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-200 ${
                reducedMotion
                  ? 'bg-[#002B49] text-white border-[#002B49]'
                  : 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-800 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PauseCircle
                  className={`w-4 h-4 shrink-0 ${
                    reducedMotion ? 'text-[#FFB81C]' : 'text-[#002B49]'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <span className="text-xs font-bold block leading-tight">
                    Sin animaciones
                  </span>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      reducedMotion ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    Pausa efectos y transiciones
                  </span>
                </div>
              </div>

              <span
                aria-hidden="true"
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                  reducedMotion ? 'bg-[#FFB81C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`a11y-switch-thumb w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    reducedMotion ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante principal (FAB) corregido y pulido */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Abrir ajustes de apariencia y lectura"
        className={`a11y-fab-btn min-h-[46px] px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border ${
          isOpen || hasActivePreferences
            ? 'bg-[#002B49] text-white border-slate-700'
            : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200/90'
        }`}
      >
        <SlidersHorizontal
          className={`w-4 h-4 shrink-0 ${
            isOpen || hasActivePreferences ? 'text-[#FFB81C]' : 'text-[#002B49]'
          }`}
          aria-hidden="true"
        />
        <span>Ajustes</span>
        {hasActivePreferences && (
          <span
            className="a11y-fab-badge w-5 h-5 rounded-full bg-[#FFB81C] text-slate-950 text-[11px] font-extrabold flex items-center justify-center shadow-2xs"
            aria-label={`${activeCount} ajustes activos`}
          >
            {activeCount}
          </span>
        )}
      </button>
    </aside>
  );
};
