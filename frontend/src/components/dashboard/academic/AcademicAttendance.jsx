import React from 'react';
import {
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Calculator,
} from 'lucide-react';

/**
 * AcademicAttendance (Bloque B)
 * Muestra el registro real de asistencias por asignatura según normativa Duoc UC:
 * - Umbral mínimo reglamentario: 70%
 * - Alerta visible y accesible ante riesgo de RI (Reprobación por Inasistencia)
 * - Botón "Simular mi asistencia" que deriva al SAT (Sistema de Alerta Temprana)
 *
 * Cumplimiento WCAG 2.2 AA:
 * - Barras de progreso con role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
 * - Objetivos de interacción táctil >= 44x44px
 * - Contraste alto en estados de cumplimiento y riesgo
 */
export const AcademicAttendance = ({
  asistencias = [],
  onNavigateToSat = null,
  onNavigateToHelpCenter = null,
}) => {
  const items = Array.isArray(asistencias) ? asistencias : [];

  const handleSimular = (courseCode, courseName, courseData = {}) => {
    if (typeof onNavigateToSat === 'function') {
      onNavigateToSat(courseCode, courseName, courseData);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 text-center">
        <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-700">Sin registros de asistencia</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          Aún no se han sincronizado registros de asistencia para el período vigente desde Experiencia Vivo Duoc.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="attendance-section-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
        <div>
          <h3
            id="attendance-section-title"
            className="text-lg font-bold text-[#002B49] flex items-center gap-2"
          >
            <CheckSquare className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <span>Asistencias Oficiales por Asignatura</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            El reglamento de Duoc UC exige al menos un <strong>70%</strong> de asistencia para aprobar cada asignatura.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {typeof onNavigateToHelpCenter === 'function' && (
            <button
              type="button"
              onClick={onNavigateToHelpCenter}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Ver reglamento de asistencia en Centro de Ayuda"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Reglamento RI</span>
            </button>
          )}

          {typeof onNavigateToSat === 'function' && (
          <button
            type="button"
            onClick={() => handleSimular('ALL', 'Todas las asignaturas')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-brand-navy hover:bg-brand-navyDark text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#002B49]"
            aria-label="Abrir simulador de asistencia SAT para todas las asignaturas"
          >
            <Calculator className="w-4 h-4" aria-hidden="true" />
            <span>Simulador de Asistencia SAT</span>
          </button>
        )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => {
          const code = item.courseCode || item.codigo || '—';
          const name = item.courseName || item.nombre || 'Asignatura sin nombre';
          const total = item.totalSessions !== undefined && item.totalSessions !== null ? Number(item.totalSessions) : null;
          const attended = item.attendedSessions !== undefined && item.attendedSessions !== null ? Number(item.attendedSessions) : null;
          const percentage = item.attendancePercentage !== undefined && item.attendancePercentage !== null ? Number(item.attendancePercentage) : null;

          const hasData = percentage !== null;
          const isAtRisk = hasData && percentage < 70;
          const isOptimal = hasData && percentage >= 85;

          const progressLabel = hasData
            ? `${percentage}% de asistencia en ${name}`
            : `Asistencia pendiente en ${name}`;

          return (
            <article
              key={code}
              aria-labelledby={`course-attendance-${index}`}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                isAtRisk
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {code}
                    </span>
                    <h4
                      id={`course-attendance-${index}`}
                      className="text-base font-bold text-slate-900 mt-1.5 leading-snug truncate"
                      title={name}
                    >
                      {name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    {hasData ? (
                      <span
                        className={`text-2xl font-black ${
                          isAtRisk
                            ? 'text-rose-600'
                            : isOptimal
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {percentage}%
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">
                        Sin datos
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de progreso accesible */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>
                      {attended !== null && total !== null
                        ? `${attended} de ${total} sesiones asistidas`
                        : 'Sesiones no informadas'}
                    </span>
                    <span className="font-medium text-slate-600">Mínimo: 70%</span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={hasData ? percentage : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={progressLabel}
                    className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative"
                  >
                    {/* Línea guía del 70% */}
                    <div
                      className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-slate-400 z-10"
                      title="Umbral mínimo 70%"
                      aria-hidden="true"
                    />
                    {hasData && (
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isAtRisk
                            ? 'bg-rose-500'
                            : isOptimal
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Banner de estado de riesgo */}
                {isAtRisk && (
                  <div className="mt-3.5 p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                    <span>
                      <strong>Riesgo de RI:</strong> Tu asistencia está bajo el 70% reglamentario.
                    </span>
                  </div>
                )}
              </div>

              {/* Botón simular asistencia */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isAtRisk ? 'Verifica faltas restantes' : 'Mantén tu asistencia al día'}
                </span>

                <button
                  type="button"
                  onClick={() => handleSimular(code, name, { totalSessions: total, attendedSessions: attended, percentage, minAttendanceRequired: 70 })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg text-xs font-semibold text-[#002B49] hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
                  aria-label={`Simular asistencia para ${name}`}
                >
                  <span>Simular mi asistencia</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
export default AcademicAttendance;
