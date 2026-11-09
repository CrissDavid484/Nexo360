import React from 'react';
import { Search, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

const QUICK_FILTERS = [
  { label: 'PAEDIS y apoyos', query: 'PAEDIS' },
  { label: 'Justificar inasistencia', query: 'inasistencia' },
  { label: 'Toma de ramos', query: 'inscripción de asignaturas' },
  { label: 'Estudiante cuidador', query: 'cuidador' },
  { label: 'Gratuidad y CAE', query: 'gratuidad' },
  { label: 'Revalidar o perder TNE', query: 'TNE' },
  { label: 'Clave, MFA y AVA', query: 'MFA' },
  { label: 'Contrato de continuidad', query: 'contrato de continuidad' },
];

/**
 * Buscador Principal del Centro de Ayuda
 * Diseño limpio, calmado y centrado en el usuario sin sobrecarga de etiquetas técnicas.
 */
export const SearchBar = ({
  searchTerm,
  onSearchChange,
  resultsCount,
  matchedSectionsCount = 0,
  matchedArticlesCount = 0,
}) => {
  const { announce } = useAccessibility();

  const handleClear = () => {
    onSearchChange('');
    announce('Búsqueda limpiada. Mostrando todas las categorías.');
  };

  const handleChipClick = (chip) => {
    const isSame = searchTerm.toLowerCase() === chip.query.toLowerCase();
    const nextValue = isSame ? '' : chip.query;
    onSearchChange(nextValue);
    if (nextValue) {
      announce(`Buscando: ${chip.label}.`);
    } else {
      announce('Filtro desactivado. Mostrando todo el contenido.');
    }
  };

  return (
    <search
      role="search"
      aria-label="Buscar trámites, beneficios o respuestas en el Centro de Ayuda"
      className="w-full"
    >
      <label htmlFor="dashboard-search" className="sr-only">
        Buscar trámites, dudas o servicios estudiantiles
      </label>

      {/* Campo de búsqueda principal */}
      <div className="relative flex items-center group">
        <div
          className="absolute left-4 pointer-events-none text-slate-400 group-focus-within:text-[#002B49] transition-colors flex items-center"
          aria-hidden="true"
        >
          <Search className="w-5 h-5" />
        </div>

        <input
          id="dashboard-search"
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Busca un trámite o tema (ej. PAEDIS, inasistencia, TNE, gratuidad, congelar...)"
          className="w-full min-h-[54px] pl-12 pr-12 py-3.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 focus:border-[#002B49] rounded-2xl text-slate-900 text-sm sm:text-base font-medium placeholder:text-slate-400 shadow-2xs focus:shadow-md transition-all duration-200"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Sugerencias rápidas y amigables */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 mr-1">
          Temas frecuentes:
        </span>
        {QUICK_FILTERS.map((chip) => {
          const isActive = searchTerm.toLowerCase() === chip.query.toLowerCase();
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChipClick(chip)}
              aria-pressed={isActive}
              className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 active:scale-[0.97] ${
                isActive
                  ? 'bg-[#002B49] text-white border-[#002B49] shadow-2xs'
                  : 'bg-slate-50/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200/80'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Estado de resultados limpio */}
      {searchTerm && (
        <div
          className="mt-4 px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 animate-fade-in"
          aria-live="polite"
        >
          <span>
            Mostrando <strong>{matchedSectionsCount}</strong>{' '}
            {matchedSectionsCount === 1 ? 'trámite' : 'trámites'},{' '}
            <strong>{matchedArticlesCount}</strong>{' '}
            {matchedArticlesCount === 1 ? 'guía' : 'guías'} y{' '}
            <strong>{resultsCount}</strong>{' '}
            {resultsCount === 1 ? 'categoría' : 'categorías'} para{' '}
            <strong>&ldquo;{searchTerm}&rdquo;</strong>
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-[#002B49] hover:underline font-semibold px-1.5 py-0.5 rounded"
          >
            Limpiar filtro
          </button>
        </div>
      )}
    </search>
  );
};
