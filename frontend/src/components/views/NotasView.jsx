import React, { useState } from 'react';
import { VIVO_NOTAS } from '../../data/vivoDuocData';
import { ChevronDown, ChevronUp, ShieldCheck, AlertCircle } from 'lucide-react';

export const NotasView = () => {
  const [expandedCourse, setExpandedCourse] = useState('capstone');

  const toggleCourse = (id) => {
    setExpandedCourse((prev) => (prev === id ? null : id));
  };

  return (
    // A11y: Etiqueta semántica <section> con encabezado accesible asociado
    <section aria-labelledby="notas-heading" className="space-y-6">
      {/* Título y descripción oficial */}
      <div className="border-b border-slate-200 pb-4">
        <h2 id="notas-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Mis Notas y Calificaciones
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed font-medium">
          Revisa el estado de tus evaluaciones parciales y nota final por cada una de las asignaturas que tomaste este semestre en Duoc UC.
        </p>
      </div>

      {/* Tarjeta de Calificaciones */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        {/* Cabecera azul marino con nombre de la carrera */}
        <header className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#FFB81C]">
          <h3 className="text-sm sm:text-base font-black tracking-wider uppercase">
            INGENIERÍA EN INFORMÁTICA
          </h3>
          <span className="text-xs text-amber-300 font-bold hidden sm:inline">
            Semestre Otoño/Primavera 2026 • Sede San Joaquín / Alameda
          </span>
        </header>

        {/* Lista de asignaturas */}
        <div className="divide-y divide-slate-200">
          {VIVO_NOTAS.map((ramo) => {
            const isExpanded = expandedCourse === ramo.id;
            const contentId = `notas-evaluaciones-${ramo.id}`;

            return (
              <div key={ramo.id} className="transition-colors">
                {/* A11y: Botón interactivo nativo único en lugar de div role="button" con botón anidado */}
                {/* A11y: Cumple con WCAG 4.1.2 Name, Role, Value y elimina controles interactivos anidados ilegales */}
                <button
                  type="button"
                  onClick={() => toggleCourse(ramo.id)}
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  className="w-full min-h-[56px] px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 text-sm sm:text-base tracking-wide">
                      {ramo.curso}
                    </span>
                    {ramo.ajusteRazonable && (
                      <span className="bg-amber-100 text-amber-950 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                        Adecuación Aprobada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      {/* A11y: Contraste reforzado a text-slate-700 (AAA) */}
                      <span className="text-xs text-slate-700 block font-bold">Nota final:</span>
                      <span className="text-base sm:text-lg font-black text-slate-950">
                        {ramo.notaFinal}
                      </span>
                    </div>

                    {/* A11y: Ícono visual sincronizado sin botón anidado */}
                    <div className="p-2 text-slate-600 rounded-lg" aria-hidden="true">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-800" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-800" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Desglose de evaluaciones al expandir */}
                {isExpanded && ramo.evaluaciones && (
                  <div
                    id={contentId}
                    className="px-6 py-5 bg-slate-50 border-t border-slate-200"
                    role="region"
                    aria-label={`Evaluaciones de ${ramo.curso}`}
                  >
                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                      Detalle de Evaluaciones Parciales
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {ramo.evaluaciones.map((eva, idx) => (
                        <article
                          key={idx}
                          className="bg-white p-4 rounded-xl border border-slate-300 flex flex-col justify-between shadow-xs"
                        >
                          <div>
                            <span className="text-xs text-slate-700 font-bold block">
                              {eva.ponderacion}
                            </span>
                            <span className="text-xs font-black text-slate-900 block mt-1">
                              {eva.nombre}
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline justify-between border-t border-slate-200 pt-2">
                            {/* A11y: Contraste AAA mejorado */}
                            <span className="text-xs text-slate-700 font-bold">Calificación:</span>
                            <span
                              className={`text-base font-black ${
                                eva.nota === '--'
                                  ? 'text-slate-600'
                                  : Number(eva.nota) >= 4.0
                                  ? 'text-emerald-800'
                                  : 'text-red-700'
                              }`}
                            >
                              {eva.nota}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* A11y: Notificación de soporte con contraste AAA */}
      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-black text-amber-950">Protocolo de Evaluaciones y Adecuaciones:</p>
          <p className="mt-0.5 text-slate-800 text-xs font-medium leading-relaxed">
            Si requieres formatos digitales accesibles, tiempo adicional o condiciones especiales para tus evaluaciones o entrega de Capstone, la coordinación de sede mantiene registradas tus adecuaciones aprobadas.
          </p>
        </div>
      </div>
    </section>
  );
};
