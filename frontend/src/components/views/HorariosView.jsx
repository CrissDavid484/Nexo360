import React from 'react';
import { VIVO_HORARIOS } from '../../data/vivoDuocData';
import { MapPin, User, Clock, CheckCircle2 } from 'lucide-react';

export const HorariosView = () => {
  return (
    // A11y: Elemento semántico <section> con encabezado accesible
    <section aria-labelledby="horarios-heading" className="space-y-6">
      {/* Título y descripción oficial */}
      <div className="border-b border-slate-200 pb-4">
        <h2 id="horarios-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Mis Horarios de Clases Semanales
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed font-medium">
          Revisa las salas, bloques horarios y docentes asignados a tus clases de esta semana en Duoc UC.
        </p>
      </div>

      {/* Lista de Tarjetas por Día de la Semana */}
      <div className="space-y-6">
        {VIVO_HORARIOS.map((diaItem) => (
          <article
            key={diaItem.dia}
            className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm"
          >
            {/* Cabecera azul marino con el nombre del día */}
            <header className="bg-[#002B49] text-white px-6 py-3.5 border-b-2 border-[#FFB81C]">
              {/* A11y: Encabezado <h3> para cada día en la jerarquía */}
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                {diaItem.dia}
              </h3>
            </header>

            {/* Contenido del día */}
            <div className="p-6">
              {/* Subtítulo de carrera oficial */}
              <div className="text-xs font-black tracking-wider text-slate-800 uppercase mb-3">
                {diaItem.carrera}
              </div>

              {/* Separador */}
              <div className="border-t-2 border-dashed border-slate-200 my-3" />

              {/* Lista de asignaturas o mensaje vacío */}
              {diaItem.items.length === 0 ? (
                <div className="py-6 text-center text-slate-700 font-bold text-sm sm:text-base">
                  {diaItem.emptyMessage}
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {diaItem.items.map((ramo, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-[#002B49] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          {/* A11y: <h4> semántico para cada curso dentro del día */}
                          <h4 className="font-black text-slate-950 text-base sm:text-lg">
                            {ramo.ramo}
                          </h4>
                          <span className="bg-amber-100 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full border border-amber-300">
                            {ramo.seccion}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 text-[#002B49]">
                            <Clock className="w-4 h-4 shrink-0 text-[#002B49]" aria-hidden="true" />
                            <span>{ramo.horario}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-800">
                            <MapPin className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                            <span>{ramo.sala}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-800">
                            <User className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                            <span>{ramo.docente}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-950 border-2 border-emerald-400 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                          <span>Acceso Universal Verificado</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
