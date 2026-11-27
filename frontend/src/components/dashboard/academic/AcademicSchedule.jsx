import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ListFilter,
  Grid3X3,
  List,
} from 'lucide-react';

const DAYS_MAP = {
  1: { name: 'Lunes', short: 'Lun' },
  2: { name: 'Martes', short: 'Mar' },
  3: { name: 'Miércoles', short: 'Mié' },
  4: { name: 'Jueves', short: 'Jue' },
  5: { name: 'Viernes', short: 'Vie' },
  6: { name: 'Sábado', short: 'Sáb' },
  7: { name: 'Domingo', short: 'Dom' },
};

/**
 * AcademicSchedule (Bloque B)
 * Horario de clases oficial:
 * - Vista semanal accesible (días 1 a 6)
 * - Alternativa en formato de lista secuencial para lectores de pantalla
 * - Información completa de bloque: sala, sede, docente, hora de inicio y fin
 *
 * Cumplimiento WCAG 2.2 AA
 */
export const AcademicSchedule = ({ horario = [] }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedDay, setSelectedDay] = useState(null); // null = todos

  const horarioArr = Array.isArray(horario) ? horario : [];

  // Extraer días con ramos
  const daysData = {};
  for (let i = 1; i <= 6; i++) {
    daysData[i] = [];
  }

  horarioArr.forEach((hObj) => {
    if (Array.isArray(hObj.dias)) {
      hObj.dias.forEach((d) => {
        if (daysData[d.dia] && Array.isArray(d.ramos)) {
          daysData[d.dia].push(...d.ramos);
        }
      });
    }
  });

  // Ordenar ramos por horaInicio
  Object.keys(daysData).forEach((d) => {
    daysData[d].sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));
  });

  const totalClasses = Object.values(daysData).reduce((acc, curr) => acc + curr.length, 0);

  if (totalClasses === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 text-center">
        <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-700">Sin horario registrado</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          No hay bloques horarios asignados para tu período académico activo.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="schedule-section-title" className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3
            id="schedule-section-title"
            className="text-lg font-bold text-[#002B49] flex items-center gap-2"
          >
            <Calendar className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span>Horario de Clases Semanal</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cronograma oficial de bloques y salas asignadas en Duoc UC.
          </p>
        </div>

        {/* Selector de modo de vista (Semanal vs Lista) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
              viewMode === 'grid'
                ? 'bg-white text-[#002B49] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-pressed={viewMode === 'grid'}
          >
            <Grid3X3 className="w-4 h-4" aria-hidden="true" />
            <span>Vista Semanal</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
              viewMode === 'list'
                ? 'bg-white text-[#002B49] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" aria-hidden="true" />
            <span>Vista Lista</span>
          </button>
        </div>
      </div>

      {/* VISTA SEMANAL (GRID DE DÍAS) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((dayNum) => {
            const dayInfo = DAYS_MAP[dayNum];
            const ramos = daysData[dayNum] || [];

            return (
              <div
                key={dayNum}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h4 className="text-sm font-bold text-slate-800">{dayInfo.name}</h4>
                  <span className="text-xs text-slate-500">
                    {ramos.length === 1 ? '1 clase' : `${ramos.length} clases`}
                  </span>
                </div>

                {ramos.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    Sin clases agendadas
                  </div>
                ) : (
                  <ul className="space-y-3 flex-1" aria-label={`Clases del día ${dayInfo.name}`}>
                    {ramos.map((r, rIdx) => (
                      <li
                        key={rIdx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1 font-semibold text-slate-800">
                          <span className="truncate" title={r.nombre}>{r.nombre}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                            {r.sigla || r.seccion}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
                          <span>{r.horaInicio} - {r.horaFin}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                            <span>{r.sala || 'Por asignar'}</span>
                          </span>
                          <span className="truncate max-w-[120px]" title={r.profesor}>
                            {r.profesor || 'Docente'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA LISTA (ACCESIBLE Y SECUENCIAL) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-800">
            Listado Cronológico Semanal de Clases
          </h4>
          <ol className="divide-y divide-slate-100" aria-label="Cronograma secuencial de clases">
            {[1, 2, 3, 4, 5, 6].map((dayNum) => {
              const dayInfo = DAYS_MAP[dayNum];
              const ramos = daysData[dayNum] || [];
              if (ramos.length === 0) return null;

              return (
                <li key={dayNum} className="py-4 first:pt-0 last:pb-0">
                  <h5 className="text-sm font-bold text-[#002B49] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    <span>{dayInfo.name}</span>
                  </h5>

                  <ul className="space-y-2 pl-2">
                    {ramos.map((r, rIdx) => (
                      <li
                        key={rIdx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 text-sm block">
                            {r.nombre}
                          </span>
                          <span className="text-slate-500">
                            Sigla: {r.sigla || '—'} · Sección: {r.seccion || '—'} · Docente: {r.profesor || 'No informado'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-slate-600 shrink-0">
                          <span className="inline-flex items-center gap-1 font-mono font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                            {r.horaInicio} - {r.horaFin}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                            {r.sala || 'Por asignar'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
};
export default AcademicSchedule;
