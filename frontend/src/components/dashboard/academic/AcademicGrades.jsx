import React, { useState } from 'react';
import {
  GraduationCap,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * AcademicGrades (Bloque B)
 * Muestra las calificaciones oficiales del estudiante diferenciando estrictamente:
 * - 0.0 (calificación numérica válida reprobatoria) vs
 * - null / undefined ("Sin calificar" / "Pendiente de publicación")
 *
 * Cumplimiento de integridad institucional:
 * - Cero notas falsas, inventadas o estimadas
 * - Desglose de evaluaciones parciales y exámenes con ponderación
 * - Cumplimiento WCAG 2.2 AA (tablas accesibles con caption y scope)
 */
export const AcademicGrades = ({ notas = [] }) => {
  const [expandedCourses, setExpandedCourses] = useState({});

  const toggleCourse = (code) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const carrerasList = Array.isArray(notas) ? notas : [];

  // Extraer todas las asignaturas de todas las carreras si vienen anidadas
  const asignaturas = [];
  carrerasList.forEach((carreraObj) => {
    if (Array.isArray(carreraObj?.asignaturas)) {
      carreraObj.asignaturas.forEach((asig) => {
        asignaturas.push({
          ...asig,
          carreraNombre: carreraObj.carrera || 'Carrera Principal',
        });
      });
    } else if (carreraObj?.codigo) {
      // Formato plano directo
      asignaturas.push(carreraObj);
    }
  });

  const formatGrade = (val) => {
    if (val === 0 || val === '0' || val === 0.0) {
      return '0.0';
    }
    if (val === null || val === undefined || val === '') {
      return '—';
    }
    const num = Number(val);
    if (Number.isNaN(num)) return '—';
    return num.toFixed(1);
  };

  const getGradeBadge = (val) => {
    if (val === null || val === undefined || val === '') {
      return {
        text: 'Pendiente',
        classes: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    }
    const num = Number(val);
    if (num >= 4.0) {
      return {
        text: 'Aprobado',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    return {
      text: 'Bajo 4.0',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  };

  if (asignaturas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 text-center">
        <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-700">Sin calificaciones registradas</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          No hay notas publicadas para este período académico en Experiencia Vivo Duoc.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="grades-section-title" className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
        <h3
          id="grades-section-title"
          className="text-lg font-bold text-[#002B49] flex items-center gap-2"
        >
          <GraduationCap className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <span>Calificaciones y Evaluaciones Oficiales</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Escala de 1.0 a 7.0 (nota mínima de aprobación: 4.0). Las notas marcadas con <strong>"—"</strong> corresponden a evaluaciones aún no rendidas o pendientes de publicación por el docente.
        </p>
      </div>

      <div className="space-y-4">
        {asignaturas.map((asig, index) => {
          const code = asig.codigo || '—';
          const name = asig.nombre || 'Asignatura sin nombre';
          const promedio = asig.promedio;
          const parciales = Array.isArray(asig.parciales) ? asig.parciales : [];
          const examenes = Array.isArray(asig.examenes) ? asig.examenes : [];
          const isExpanded = Boolean(expandedCourses[code]);

          const gradeBadge = getGradeBadge(promedio);

          return (
            <article
              key={code}
              aria-labelledby={`course-grade-${index}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {code}
                    </span>
                    <span className="text-xs text-slate-500">
                      Semestre {asig.periodo || '2026-1'}
                    </span>
                  </div>
                  <h4
                    id={`course-grade-${index}`}
                    className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate"
                  >
                    {name}
                  </h4>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Promedio</span>
                    <span className="text-2xl font-black text-[#002B49]">
                      {formatGrade(promedio)}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${gradeBadge.classes}`}
                  >
                    {gradeBadge.text}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleCourse(code)}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
                    aria-expanded={isExpanded}
                    aria-controls={`details-${code}`}
                    aria-label={`Ver desglose de evaluaciones de ${name}`}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Desglose colapsable accesible */}
              {isExpanded && (
                <div
                  id={`details-${code}`}
                  className="bg-slate-50/60 p-4 sm:p-5 border-t border-slate-100 space-y-4"
                >
                  {/* Evaluaciones parciales */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Evaluaciones Parciales
                    </h5>
                    {parciales.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white rounded-xl overflow-hidden border border-slate-200/80">
                          <caption className="sr-only">Desglose de evaluaciones parciales</caption>
                          <thead className="bg-slate-100/80 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                              <th scope="col" className="p-3">Evaluación</th>
                              <th scope="col" className="p-3 text-center">Pond.</th>
                              <th scope="col" className="p-3 text-center">Nota</th>
                              <th scope="col" className="p-3 text-center">Prom. Curso</th>
                              <th scope="col" className="p-3 text-right">Fecha Act.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parciales.map((p, pIdx) => {
                              const pGrade = formatGrade(p.nota);
                              return (
                                <tr key={pIdx} className="hover:bg-slate-50/70">
                                  <td className="p-3 font-medium text-slate-800">{p.nombre}</td>
                                  <td className="p-3 text-center font-mono text-slate-600">
                                    {p.ponderacion !== undefined ? `${p.ponderacion}%` : '—'}
                                  </td>
                                  <td className="p-3 text-center font-bold">
                                    <span
                                      className={
                                        pGrade !== '—' && Number(pGrade) >= 4.0
                                          ? 'text-emerald-700 font-bold'
                                          : pGrade !== '—'
                                          ? 'text-rose-700 font-bold'
                                          : 'text-slate-400'
                                      }
                                    >
                                      {pGrade}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center text-slate-500">
                                    {p.promedioCurso ? formatGrade(p.promedioCurso) : '—'}
                                  </td>
                                  <td className="p-3 text-right text-xs text-slate-500 font-mono">
                                    {p.fechaActualizacion || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No hay evaluaciones parciales registradas.</p>
                    )}
                  </div>

                  {/* Exámenes */}
                  {examenes.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Exámenes
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white rounded-xl overflow-hidden border border-slate-200/80">
                          <caption className="sr-only">Desglose de exámenes</caption>
                          <thead className="bg-slate-100/80 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                              <th scope="col" className="p-3">Examen</th>
                              <th scope="col" className="p-3 text-center">Pond.</th>
                              <th scope="col" className="p-3 text-center">Nota</th>
                              <th scope="col" className="p-3 text-center">Prom. Curso</th>
                              <th scope="col" className="p-3 text-right">Fecha Act.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {examenes.map((e, eIdx) => {
                              const eGrade = formatGrade(e.nota);
                              return (
                                <tr key={eIdx} className="hover:bg-slate-50/70">
                                  <td className="p-3 font-medium text-slate-800">{e.nombre}</td>
                                  <td className="p-3 text-center font-mono text-slate-600">
                                    {e.ponderacion !== undefined ? `${e.ponderacion}%` : '—'}
                                  </td>
                                  <td className="p-3 text-center font-bold">
                                    <span
                                      className={
                                        eGrade !== '—' && Number(eGrade) >= 4.0
                                          ? 'text-emerald-700 font-bold'
                                          : eGrade !== '—'
                                          ? 'text-rose-700 font-bold'
                                          : 'text-slate-400'
                                      }
                                    >
                                      {eGrade}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center text-slate-500">
                                    {e.promedioCurso ? formatGrade(e.promedioCurso) : '—'}
                                  </td>
                                  <td className="p-3 text-right text-xs text-slate-500 font-mono">
                                    {e.fechaActualizacion || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
export default AcademicGrades;
