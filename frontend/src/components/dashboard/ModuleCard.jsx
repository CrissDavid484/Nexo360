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
    // A11y: Uso de elemento interactivo nativo <button type="button"> en lugar de <article role="button">
    // A11y: Cumple con activación nativa de teclado (Enter y Espacio) sin emulaciones frágiles de keydown.
    <button
      type="button"
      onClick={() => onSelect(category)}
      aria-haspopup="dialog"
      aria-label={`Módulo ${category.title}. ${category.description}. Abrir ventana de trámites.`}
      className={`group w-full min-h-[200px] flex flex-col justify-between bg-white rounded-3xl p-7 transition-all duration-200 text-left shadow-md hover:shadow-2xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 border-2 ${
        isHighlighted
          ? 'border-amber-400 bg-gradient-to-br from-white via-amber-50/30 to-amber-100/40'
          : 'border-slate-300 hover:border-[#002B49]'
      }`}
    >
      <div className="w-full">
        {/* Fila Superior: Icono y Badge */}
        <div className="flex items-center justify-between gap-3 mb-5">
          {/* A11y: Contenedor con ícono decorativo marcado con aria-hidden="true" */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border ${
              isHighlighted
                ? 'bg-[#FFB81C] text-[#002B49] border-amber-500'
                : 'bg-[#002B49] text-[#FFB81C] border-[#002B49]'
            }`}
            aria-hidden="true"
          >
            <IconComponent className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-1.5">
            {isHighlighted && (
              <span className="flex items-center gap-1 bg-[#FFB81C] text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Principal
              </span>
            )}
            <span className="bg-slate-100 text-slate-900 text-xs font-black px-3 py-1 rounded-full border border-slate-300">
              {category.badge}
            </span>
          </div>
        </div>

        {/* A11y: Jerarquía de encabezados corregida a <h3> para respetar el <h2> de la sección */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-[#002B49] transition-colors mb-3">
          {category.title}
        </h3>

        {/* A11y: Descripción con contraste reforzado AAA */}
        <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 font-medium">
          {category.description}
        </p>
      </div>

      {/* Pie de Tarjeta con Acción Visual */}
      <div className="w-full pt-4 border-t border-slate-200 flex items-center justify-between text-[#002B49] font-black text-sm">
        <span className="group-hover:underline flex items-center gap-1">
          Ver opciones y trámites
        </span>
        <div
          className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-[#002B49] group-hover:text-[#FFB81C] flex items-center justify-center transition-colors"
          aria-hidden="true"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
};
