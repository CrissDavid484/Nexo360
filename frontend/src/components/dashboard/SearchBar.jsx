import React from 'react';
import { Search, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const SearchBar = ({ searchTerm, onSearchChange, resultsCount }) => {
  const { announce } = useAccessibility();

  const handleClear = () => {
    onSearchChange('');
    announce('Filtro de búsqueda borrado. Mostrando todos los módulos institucionales.');
  };

  return (
    // A11y: Elemento semántico <search> de HTML5 con role="search"
    <search role="search" aria-label="Búsqueda de trámites y servicios institucionales" className="w-full max-w-3xl mx-auto my-6 block">
      {/* A11y: <label> explícito sin etiquetas segregadoras */}
      <label
        htmlFor="dashboard-search"
        className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2"
      >
        Buscar en Centro de Ayuda & Trámites:
      </label>

      <div className="relative flex items-center">
        {/* A11y: Ícono decorativo con aria-hidden="true" */}
        <div className="absolute left-4 pointer-events-none text-slate-500 flex items-center">
          <Search className="w-6 h-6" aria-hidden="true" />
        </div>

        <input
          id="dashboard-search"
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar trámites (ej: toma de ramos, notas, becas, TNE, certificados)..."
          className="w-full min-h-[52px] pl-14 pr-14 py-3 bg-white border-2 border-slate-400 rounded-2xl text-slate-900 text-base font-semibold shadow-md placeholder-slate-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 focus:border-[#002B49] transition-all"
        />

        {/* A11y: Botón de limpiar búsqueda con tamaño táctil mínimo 44x44px */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar término de búsqueda"
            className="absolute right-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] transition-colors"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* A11y: Mensaje de retroalimentación dinámico con aria-live="polite" */}
      {searchTerm && (
        <p
          className="mt-2 text-sm text-slate-900 font-bold px-2 flex items-center gap-1.5"
          aria-live="polite"
        >
          <span>Se encontraron {resultsCount} {resultsCount === 1 ? 'módulo' : 'módulos'} para "{searchTerm}".</span>
        </p>
      )}
    </search>
  );
};
