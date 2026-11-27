import React from 'react';
import {
  GraduationCap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UserCheck,
  Building2,
  FileCheck2,
} from 'lucide-react';

/**
 * AcademicOverview (Bloque B)
 * Muestra el resumen del estado académico institucional:
 * - Carrera y Código de Carrera
 * - Sede institucional (Sede Alameda)
 * - Estado de matrícula vigente (Activo / En trámite)
 * - Período académico activo
 * - Identificador oficial de estudiante
 *
 * Cumplimiento WCAG 2.2 AA:
 * - Contraste superior a 4.5:1
 * - Marcado semántico <dl>, <dt>, <dd> y encabezados
 * - Etiquetas legibles para tecnologías de asistencia
 */
export const AcademicOverview = ({
  matricula = null,
  perfilAcademico = null,
  infoPersona = null,
  isSimulated = false,
  source = 'vivo_duoc',
}) => {
  const carrera =
    perfilAcademico?.carrera ||
    matricula?.carrera ||
    'No informada';

  const codigoCarrera =
    perfilAcademico?.codigoCarrera ||
    matricula?.codigoCarrera ||
    '—';

  const sede = matricula?.sede || 'Sede no informada';
  const periodo = matricula?.periodo || '—';
  const estadoMatricula = matricula?.estado || 'No informado';
  const codAlumno = matricula?.codAlumno || matricula?.alumnoId || '—';
  const rut = infoPersona?.rut || matricula?.rut || '—';
  const nombreCompleto = infoPersona?.nombreCompleto || null;

  const isActivo = String(estadoMatricula).toLowerCase() === 'activo';

  return (
    <article
      aria-labelledby="overview-heading"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h3
            id="overview-heading"
            className="text-lg font-bold text-[#002B49] flex items-center gap-2"
          >
            <GraduationCap className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
            <span>Ficha del Estudiante y Matrícula</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Información registrada y verificada en el portal institucional Vivo Duoc UC.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isActivo
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isActivo ? (
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>Matrícula {estadoMatricula}</span>
          </span>

          {isSimulated && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
              Modo Simulado
            </span>
          )}
        </div>
      </div>

      {nombreCompleto && (
        <div className="mt-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estudiante:
            </span>
            <span className="text-sm font-bold text-slate-800">{nombreCompleto}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">RUT: {rut}</span>
        </div>
      )}

      {/* Grid semántico de detalles */}
      <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carrera */}
        <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
            <span>Carrera</span>
          </dt>
          <dd className="text-sm sm:text-base font-bold text-[#002B49] leading-snug">
            {carrera}
          </dd>
          <span className="text-xs text-slate-500 mt-1">Cód. {codigoCarrera}</span>
        </div>

        {/* Sede */}
        <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Sede Institucional</span>
          </dt>
          <dd className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
            {sede}
          </dd>
          <span className="text-xs text-slate-500 mt-1">Región Metropolitana</span>
        </div>

        {/* Período */}
        <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>Período Académico</span>
          </dt>
          <dd className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
            Semestre {periodo}
          </dd>
          <span className="text-xs text-slate-500 mt-1">Año Académico 2026</span>
        </div>

        {/* Código Alumno */}
        <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Identificador Alumno</span>
          </dt>
          <dd className="text-sm sm:text-base font-mono font-bold text-slate-800 leading-snug">
            {codAlumno}
          </dd>
          <span className="text-xs text-slate-500 mt-1">Registro Central Duoc</span>
        </div>
      </dl>
    </article>
  );
};
export default AcademicOverview;
