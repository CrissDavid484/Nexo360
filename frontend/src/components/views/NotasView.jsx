import React, { useState } from 'react';
import { VIVO_NOTAS } from '../../data/vivoDuocData';
import { ChevronDown, ChevronUp, ShieldCheck, AlertCircle } from 'lucide-react';

export const NotasView = () => {
  const [expandedCourse, setExpandedCourse] = useState('capstone');

  const toggleCourse = (id) => {
    setExpandedCourse((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Título y descripción oficial (Screenshot 4) */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight">
          Notas
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Para que sepas donde tienes que estudiar más, en esta sección podrás revisar el status de tus notas por cada uno de los ramos que tomaste este semestre.
        </p>
      </div>

      {/* Tarjeta de Calificaciones */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Cabecera azul marino con nombre de la carrera */}
        <div className="bg-[#002B49] text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase">
            INGENIERIA EN INFORMATICA
          </h2>
          <span className="text-xs text-amber-300 font-semibold hidden sm:inline">
            Semestre Otoño/Primavera 2026
          </span>
        </div>

        {/* Lista de asignaturas */}
        <div className="divide-y divide-slate-100">
          {VIVO_NOTAS.map((ramo) => {
            const isExpanded = expandedCourse === ramo.id;

            return (
              <div key={ramo.id} className="transition-colors">
                {/* Fila principal del curso (Screenshot 4: CAPSTONE ... Nota final --) */}
                <div
                  onClick={() => toggleCourse(ramo.id)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-50"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCourse(ramo.id);
                    }
                  }}
                  aria-expanded={isExpanded}
                  aria-label={`Ver evaluaciones de ${ramo.curso}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 text-sm sm:text-base tracking-wide">
                      {ramo.curso}
                    </span>
                    {ramo.paedisBonus && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                        <ShieldCheck className="w-3 h-3 text-amber-600" aria-hidden="true" />
                        Ajuste PAEDIS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Nota final</span>
                      <span className="text-base sm:text-lg font-black text-slate-800">
                        {ramo.notaFinal}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Desglose de evaluaciones al expandir */}
                {isExpanded && ramo.evaluaciones && (
                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Detalle de Evaluaciones Parciales
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {ramo.evaluaciones.map((eva, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between shadow-2xs"
                        >
                          <div>
                            <span className="text-xs text-slate-500 font-medium block">
                              {eva.ponderacion}
                            </span>
                            <span className="text-xs font-bold text-slate-800 block mt-0.5 line-clamp-1">
                              {eva.nombre}
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-1.5">
                            <span className="text-[11px] text-slate-400 font-medium">Calificación:</span>
                            <span
                              className={`text-sm font-black ${
                                eva.nota === '--'
                                  ? 'text-slate-400'
                                  : Number(eva.nota) >= 4.0
                                  ? 'text-emerald-700'
                                  : 'text-red-600'
                              }`}
                            >
                              {eva.nota}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Aviso Accesible de Acompañamiento en Evaluaciones */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-bold">Protocolo de Evaluaciones Inclusivas PAEDIS:</p>
          <p className="mt-0.5 text-amber-800 text-xs">
            Si presentas alguna dificultad técnica, física o sensorial durante tus certámenes o entrega de Capstone, la coordinación PAEDIS Alameda puede coordinar adecuaciones o entrega en formatos digitales accesibles.
          </p>
        </div>
      </div>
    </div>
  );
};
