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
 * Integra el switch "theme-switch" (Uiverse.io by Galahhad) con sol, luna, nubes y estrellas
 * para el cambio Claro / Oscuro, junto con un botón flotante accesible en ambos modos.
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

          {/* 1. Cambio de Claro a Oscuro con Uiverse Theme Switch (by Galahhad) */}
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

            <label
              className="theme-switch"
              title="Alternar entre modo claro y modo oscuro"
            >
              <input
                type="checkbox"
                className="theme-switch__checkbox"
                checked={highContrast}
                onChange={toggleHighContrast}
                aria-label="Alternar entre modo claro y modo oscuro de alto contraste"
              />
              <div className="theme-switch__container">
                <div className="theme-switch__clouds" />
                <div className="theme-switch__stars-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="theme-switch__circle-container">
                  <div className="theme-switch__sun-moon-container">
                    <div className="theme-switch__moon">
                      <div className="theme-switch__spot" />
                      <div className="theme-switch__spot" />
                      <div className="theme-switch__spot" />
                    </div>
                  </div>
                </div>
              </div>
            </label>
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
