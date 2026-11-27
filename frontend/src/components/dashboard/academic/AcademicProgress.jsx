import React from 'react';
import {
  Compass,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Info,
} from 'lucide-react';

/**
 * AcademicProgress (Bloque B)
 * Muestra el avance curricular oficial del estudiante:
 * - Créditos totales, aprobados, inscritos y pendientes
 * - Porcentaje de avance de la carrera
 * - Asignaturas aprobadas vs totales de la malla
 * - Estado de avance esperado (al día vs rezago)
 *
 * Cumplimiento WCAG 2.2 AA
 */
export const AcademicProgress = ({ perfilAcademico = null }) => {
  if (!perfilAcademico) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 text-center">
        <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-700">Avance curricular no disponible</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          La información de progreso y créditos está pendiente de consolidación en Experiencia Vivo Duoc.
        </p>
      </div>
    );
  }

  const creditosTotales = perfilAcademico.creditosTotales || 0;
  const avanceCreditos = perfilAcademico.avanceCreditos || {};
  const creditosAprobados = avanceCreditos.aprobados || 0;
  const creditosInscritos = avanceCreditos.inscritos || 0;
  const creditosPendientes = avanceCreditos.pendientes || 0;
  const porcentajeAvance = avanceCreditos.porcentaje || `${Math.round((creditosAprobados / (creditosTotales || 1)) * 100)}%`;
  const porcentajeNum = Number.parseInt(String(porcentajeAvance).replace('%', ''), 10) || 0;

  const asignaturas = perfilAcademico.asignaturas || {};
  const totalAsig = asignaturas.total || 0;
  const aprobadasAsig = asignaturas.aprobadas || 0;
  const reprobadasAsig = asignaturas.reprobadas || 0;
  const inscritasAsig = asignaturas.inscritas || 0;

  const avanceEsperado = perfilAcademico.avanceEsperado || {};
  const isAlDia = avanceEsperado.alDia !== false;

  return (
    <article aria-labelledby="progress-section-title" className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3
            id="progress-section-title"
            className="text-lg font-bold text-[#002B49] flex items-center gap-2"
          >
            <Compass className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            <span>Progreso Curricular y Malla</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cumplimiento del plan de estudios oficial registrado en Duoc UC.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isAlDia
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAlDia ? 'Trayectoria al Día' : 'En Regularización'}</span>
        </span>
      </div>

      {/* Tarjeta de porcentaje global */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Avance Total del Plan de Estudios
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#002B49]">
              {porcentajeAvance}
            </span>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600">
            <span className="block font-medium">
              {creditosAprobados} de {creditosTotales} créditos aprobados
            </span>
            <span className="text-slate-400">
              {creditosInscritos} créditos inscritos este semestre
            </span>
          </div>
        </div>

        {/* Barra de progreso accesible */}
        <div
          role="progressbar"
          aria-valuenow={porcentajeNum}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso curricular: ${porcentajeAvance}`}
          className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, porcentajeNum))}%` }}
          />
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-center">
          <div className="p-3 bg-slate-50 rounded-xl">
            <dt className="text-xs text-slate-500 font-medium">Créditos Totales</dt>
            <dd className="text-lg font-bold text-slate-800 mt-0.5">{creditosTotales}</dd>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <dt className="text-xs text-emerald-700 font-medium">Aprobados</dt>
            <dd className="text-lg font-bold text-emerald-800 mt-0.5">{creditosAprobados}</dd>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <dt className="text-xs text-blue-700 font-medium">Inscritos</dt>
            <dd className="text-lg font-bold text-blue-800 mt-0.5">{creditosInscritos}</dd>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <dt className="text-xs text-slate-500 font-medium">Pendientes</dt>
            <dd className="text-lg font-bold text-slate-800 mt-0.5">{creditosPendientes}</dd>
          </div>
        </dl>
      </div>

      {/* Desglose de asignaturas de la malla */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
          <span>Estado de Asignaturas de la Malla</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Total del Plan</span>
              <span className="text-xl font-bold text-slate-800">{totalAsig} asignaturas</span>
            </div>
            <Award className="w-7 h-7 text-slate-300" aria-hidden="true" />
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-700 block">Aprobadas</span>
              <span className="text-xl font-bold text-emerald-800">{aprobadasAsig} asignaturas</span>
            </div>
            <CheckCircle2 className="w-7 h-7 text-emerald-400" aria-hidden="true" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Reprobadas</span>
              <span className="text-xl font-bold text-slate-800">{reprobadasAsig} asignaturas</span>
            </div>
            <Clock className="w-7 h-7 text-slate-300" aria-hidden="true" />
          </div>
        </div>
      </div>
    </article>
  );
};
export default AcademicProgress;
