import React from 'react';
import { Search, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const SearchBar = ({ searchTerm, onSearchChange, resultsCount }) => {
  const { announce } = useAccessibility();

  const handleClear = () => {
    onSearchChange('');
    announce('Filtro de búsqueda borrado. Mostrando todas las categorías.');
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <label htmlFor="dashboard-search" className="sr-only">
        Buscar servicios, trámites, asignaturas o beneficios PAEDIS
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
          <Search className="w-6 h-6" aria-hidden="true" />
        </div>
        <input
          id="dashboard-search"
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar trámites (ej: inscripción de asignaturas, PAEDIS, notas, becas, TNE)..."
          className="w-full pl-13 pr-12 py-4 bg-white border-3 border-slate-300 rounded-2xl text-slate-900 text-lg font-medium shadow-md placeholder-slate-400 focus:border-duoc-navy focus:ring-4 focus:ring-amber-400 focus:outline-none transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar término de búsqueda"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 focus:ring-2 focus:ring-amber-400 rounded-full m-2"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
      </div>

      {searchTerm && (
        <p className="mt-2 text-sm text-slate-600 font-semibold px-2" aria-live="polite">
          Se encontraron {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'} para "{searchTerm}".
        </p>
      )}
    </div>
  );
};
