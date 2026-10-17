import React from 'react';
import { VIVO_HORARIOS } from '../../data/vivoDuocData';
import { MapPin, User, Clock, CheckCircle2 } from 'lucide-react';

export const HorariosView = () => {
  return (
    <div className="space-y-6">
      {/* Título y descripción oficial (Screenshot 3) */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight">
          Horarios
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Para que no te pierdas ninguna clase y llegues a tiempo, en esta sección podrás ver el lugar y hora de las clases de esta semana.
        </p>
      </div>

      {/* Lista de Tarjetas por Día de la Semana */}
      <div className="space-y-6">
        {VIVO_HORARIOS.map((diaItem) => (
          <div
            key={diaItem.dia}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
          >
            {/* Cabecera azul marino con el nombre del día */}
            <div className="bg-[#002B49] text-white px-6 py-3">
              <h2 className="text-base sm:text-lg font-bold tracking-wide">
                {diaItem.dia}
              </h2>
            </div>

            {/* Contenido del día */}
            <div className="p-6">
              {/* Subtítulo de carrera oficial */}
              <div className="text-xs font-black tracking-wider text-slate-800 uppercase mb-3">
                {diaItem.carrera}
              </div>

              {/* Separador punteado oficial */}
              <div className="border-t border-dashed border-slate-300 my-3" />

              {/* Lista de asignaturas o mensaje vacío */}
              {diaItem.items.length === 0 ? (
                <div className="py-6 text-center text-slate-500 font-medium text-sm sm:text-base">
                  {diaItem.emptyMessage}
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {diaItem.items.map((ramo, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#002B49] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-base">
                            {ramo.ramo}
                          </span>
                          <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2 py-0.5 rounded">
                            {ramo.seccion}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-[#002B49]">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {ramo.horario}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {ramo.sala}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {ramo.docente}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Acceso Universal Verificado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
