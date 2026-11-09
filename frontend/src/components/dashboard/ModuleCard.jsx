import React from 'react';
import {
  GraduationCap,
  Compass,
  BookOpen,
  HeartHandshake,
  CreditCard,
  Laptop,
  Award,
  ShieldAlert,
  Users,
  ChevronRight,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const ICON_MAP = {
  GraduationCap,
  Compass,
  BookOpen,
  HeartHandshake,
  CreditCard,
  Laptop,
  Award,
  ShieldAlert,
  Users,
};

/**
 * Tarjeta de Categoría del Centro de Ayuda
 * Diseño limpio, estructurado como lista editorial de temas para evitar sobrecarga sensorial.
 */
export const ModuleCard = ({ category, onSelect, onSelectSubmodule }) => {
  const IconComponent = ICON_MAP[category.iconName] || BookOpen;
  const previewSubmodules = category.submodules.slice(0, 4);
  const remainingCount = Math.max(0, category.submodules.length - previewSubmodules.length);

  return (
    <article
      aria-labelledby={`cat-heading-${category.id}`}
      className="group w-full flex flex-col justify-between rounded-2xl bg-white p-6 text-left border border-slate-200/80 shadow-2xs hover:shadow-lg hover:border-slate-300/90 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="w-full">
        {/* Cabecera limpia: Ícono suave y contador simple */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl bg-slate-100 text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#FFB81C] flex items-center justify-center shrink-0 transition-colors duration-200"
            aria-hidden="true"
          >
            <IconComponent className="w-5 h-5" aria-hidden="true" />
          </div>

          <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/70">
            {category.submodules.length} trámites
          </span>
        </div>

        {/* Título de categoría */}
        <h3
          id={`cat-heading-${category.id}`}
          className="text-lg font-bold text-slate-900 tracking-tight mb-1.5 leading-snug"
        >
          <button
            type="button"
            onClick={() => onSelect(category)}
            className="text-left hover:text-[#002B49] transition-colors rounded-md"
          >
            {category.title}
          </button>
        </h3>

        {/* Descripción breve y humana */}
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
          {category.description}
        </p>

        {/* Lista limpia de apartados directos */}
        <div className="mb-4 border-t border-slate-100 pt-2">
          <ul className="divide-y divide-slate-100" aria-label={`Apartados frecuentes de ${category.title}`}>
            {previewSubmodules.map((sub) => (
              <li key={sub.id}>
                <button
                  type="button"
                  onClick={() =>
                    onSelectSubmodule ? onSelectSubmodule(category, sub) : onSelect(category)
                  }
                  aria-label={`Ver ${sub.title} en ${category.title}`}
                  className="w-full min-h-[38px] py-2 px-2 -mx-2 rounded-lg text-left text-xs sm:text-sm font-medium text-slate-700 hover:text-[#002B49] hover:bg-slate-50/90 flex items-center justify-between gap-2 transition-colors group/row"
                >
                  <span className="truncate">{sub.title}</span>
                  <ChevronRight
                    className="w-4 h-4 text-slate-400 group-hover/row:text-[#002B49] group-hover/row:translate-x-0.5 transition-all shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pie de tarjeta con botón pulido */}
      <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(category)}
          aria-haspopup="dialog"
          aria-label={`Ver todos los apartados de ${category.title}`}
          className="min-h-[42px] flex-1 bg-slate-50 hover:bg-[#002B49] text-slate-800 hover:text-white px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-between gap-2 border border-slate-200/80 hover:border-[#002B49] transition-all duration-200 group/btn active:scale-[0.98]"
        >
          <span>
            {remainingCount > 0
              ? `Ver todos (${category.submodules.length})`
              : 'Explorar categoría'}
          </span>
          <ArrowRight
            className="w-4 h-4 text-slate-400 group-hover/btn:text-[#FFB81C] group-hover/btn:translate-x-0.5 transition-all shrink-0"
            aria-hidden="true"
          />
        </button>

        {category.officialCategoryUrl && (
          <a
            href={category.officialCategoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir ${category.title} en centroayuda.duoc.cl`}
            aria-label={`Abrir ${category.title} en el sitio web oficial (nueva pestaña)`}
            className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#002B49] border border-slate-200/80 flex items-center justify-center transition-colors"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
};
