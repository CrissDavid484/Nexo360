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
  Sparkles,
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

export const ModuleCard = ({ category, onSelect }) => {
  const IconComponent = ICON_MAP[category.iconName] || BookOpen;
  const isHighlighted = category.highlight;

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect(category)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(category);
        }
      }}
      aria-haspopup="dialog"
      aria-label={`Módulo institucional: ${category.title}. ${category.description}. Presiona Enter para explorar los submenús.`}
      className={`group relative flex flex-col justify-between bg-white rounded-2xl p-7 transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-4 focus:ring-amber-500 shadow-md hover:shadow-xl hover:-translate-y-1 ${
        isHighlighted
          ? 'border-3 border-amber-400 bg-gradient-to-br from-white via-amber-50/20 to-amber-100/30'
          : 'border-2 border-slate-200 hover:border-duoc-navy'
      }`}
    >
      <div>
        {/* Fila Superior: Icono y Badge */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${
              isHighlighted
                ? 'bg-amber-400 text-duoc-navy'
                : 'bg-duoc-navy text-amber-400'
            }`}
          >
            <IconComponent className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-1.5">
            {isHighlighted && (
              <span className="flex items-center gap-1 bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Principal
              </span>
            )}
            <span className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-full border border-slate-300">
              {category.badge}
            </span>
          </div>
        </div>

        {/* Título de Categoría */}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-duoc-navy transition-colors mb-3">
          {category.title}
        </h2>

        {/* Descripción Breve */}
        <p className="text-slate-600 text-base leading-relaxed mb-6 font-medium">
          {category.description}
        </p>
      </div>

      {/* Pie de Tarjeta con Acción Visual */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-duoc-navy font-bold text-sm">
        <span className="group-hover:underline flex items-center gap-1">
          Ver opciones y trámites
        </span>
        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-duoc-navy group-hover:text-amber-400 flex items-center justify-center transition-colors">
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
};
