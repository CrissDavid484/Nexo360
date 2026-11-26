import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sliders,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  Plus,
  Minus,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAccessibility } from '@context/AccessibilityContext';
import { ADMIN_THEME } from '@components/admin/adminTheme';

/**
 * Retorna metadatos de semáforo según porcentaje y estado de justificación institucional.
 * Umbrales Duoc UC SAT:
 * - Verde: >= 75% (Cumple umbral mínimo RI)
 * - Amarillo: 70% a 74.9% (Alerta preventiva)
 * - Rojo: < 70% (Riesgo inminente de Reprobación por Inasistencia)
 * - Violeta: Licencia médica o excepción PAEDIS vigente
 */
function getTrafficLightMeta(pct, isJustified) {
  if (isJustified) {
    return {
      status: 'justified',
      label: 'Justificado / Protegido',
      sublabel: 'Ajuste PAEDIS o Licencia Médica Vigente (Ley N° 21.719)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      badgeDot: 'bg-purple-600',
      barColor: 'bg-purple-600',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200',
      bgTint: 'bg-purple-50/70',
      icon: HeartHandshake,
    };
  }

  const num = Number(pct);
  if (num >= 75) {
    return {
      status: 'normal',
      label: 'Verde • Cumple Umbral (≥75%)',
      sublabel: 'Asistencia Regular',
      badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      badgeDot: 'bg-emerald-600',
      barColor: 'bg-emerald-600',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200',
      bgTint: 'bg-emerald-50/70',
      icon: CheckCircle2,
    };
  }

  if (num >= 70) {
    return {
      status: 'preventive',
      label: 'Amarillo • Zona Preventiva (70% - 74.9%)',
      sublabel: 'Margen Crítico Restante',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
      badgeDot: 'bg-amber-500',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      bgTint: 'bg-amber-50/70',
      icon: AlertTriangle,
    };
  }

  return {
    status: 'ri',
    label: 'Riesgo Crítico RI (<70%)',
    sublabel: 'Causal Inminente de Reprobación por Inasistencia',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-300',
    badgeDot: 'bg-rose-600',
    barColor: 'bg-rose-600',
    textColor: 'text-rose-800',
    borderColor: 'border-rose-200',
    bgTint: 'bg-rose-50/70',
    icon: AlertOctagon,
  };
}

export const SatAttendanceSimulator = React.memo(function SatAttendanceSimulator({
  student,
  course,
  students = [],
  selectedUserId,
  selectedCourseCode,
  onSelectStudent,
  onSelectCourse,
  onRunSimulation,
  isSimulating = false,
  activeSimulationInfo = null,
}) {
  const { getVoiceProps } = useAccessibility();

  // Deltas locales para feedback táctil e instantáneo en tiempo real
  const [addedAttendances, setAddedAttendances] = useState(0);
  const [addedAbsences, setAddedAbsences] = useState(0);
  const [isJustifiedOverride, setIsJustifiedOverride] = useState(null);

  // Cada vez que cambia el estudiante o la asignatura, reiniciar los deltas locales
  useEffect(() => {
    setAddedAttendances(0);
    setAddedAbsences(0);
    setIsJustifiedOverride(null);
  }, [selectedUserId, selectedCourseCode]);

  // Datos base de la asignatura
  const baseTotal = Math.max(1, Number(course?.totalSessions || 20));
  const baseAttended = Math.max(
    0,
    Math.min(baseTotal, Number(course?.attendedSessions ?? Math.round(baseTotal * 0.75)))
  );
  const baseAbsences = Math.max(0, baseTotal - baseAttended);
  const baseConsecutiveAbsences = Number(course?.consecutiveAbsences || 0);
  const baseJustified = Boolean(course?.paedisJustified);
  const basePct = Math.round((baseAttended / baseTotal) * 1000) / 10;
  const minRequiredSessions = Math.ceil(baseTotal * 0.75);
  const maxAllowedAbsences = Math.max(0, baseTotal - minRequiredSessions);

  // Valores simulados interactivos
  const currentJustified = isJustifiedOverride !== null ? isJustifiedOverride : baseJustified;
  const simulatedAttended = Math.max(
    0,
    Math.min(baseTotal, baseAttended + addedAttendances - addedAbsences)
  );
  const simulatedAbsences = Math.max(0, baseTotal - simulatedAttended);
  const simulatedPct = Math.round((simulatedAttended / baseTotal) * 1000) / 10;
  const deltaPct = Math.round((simulatedPct - basePct) * 10) / 10;
  const deltaClasses = simulatedAttended - baseAttended;

  // Faltas consecutivas proyectadas
  const simulatedConsecutive = Math.max(
    0,
    addedAbsences > 0
      ? baseConsecutiveAbsences + addedAbsences
      : Math.max(0, baseConsecutiveAbsences - addedAttendances)
  );

  // Cálculo exacto de cuántas clases consecutivas se requieren para alcanzar el 75%
  const classesNeededFor75 = Math.max(0, minRequiredSessions - simulatedAttended);
  const baseClassesNeededFor75 = Math.max(0, minRequiredSessions - baseAttended);

  // Semáforo actual vs simulado
  const baseMeta = useMemo(() => getTrafficLightMeta(basePct, baseJustified), [basePct, baseJustified]);
  const simMeta = useMemo(
    () => getTrafficLightMeta(simulatedPct, currentJustified),
    [simulatedPct, currentJustified]
  );

  const hasLocalDelta = addedAttendances !== 0 || addedAbsences !== 0 || isJustifiedOverride !== null;

  // Manejador de restablecimiento
  const handleReset = useCallback(async () => {
    setAddedAttendances(0);
    setAddedAbsences(0);
    setIsJustifiedOverride(null);
    if (onRunSimulation) {
      await onRunSimulation('reset');
    }
  }, [onRunSimulation]);

  // Manejador de recuperación al 75%
  const handleRecoverTo75 = useCallback(async () => {
    if (baseClassesNeededFor75 > 0) {
      setAddedAttendances(baseClassesNeededFor75);
      setAddedAbsences(0);
    }
    if (onRunSimulation) {
      await onRunSimulation('recover_to_75');
    }
  }, [baseClassesNeededFor75, onRunSimulation]);

  // Manejador del toggle de justificación médica
  const handleToggleJustified = useCallback(async () => {
    const nextState = !currentJustified;
    setIsJustifiedOverride(nextState);
    if (onRunSimulation) {
      await onRunSimulation('paedis_justify');
    }
  }, [currentJustified, onRunSimulation]);

  // Manejador de incremento de asistencia
  const handleAddAttendance = useCallback(async () => {
    if (simulatedAttended >= baseTotal) return;
    setAddedAttendances((prev) => prev + 1);
    if (onRunSimulation) {
      await onRunSimulation('add_attendance');
    }
  }, [simulatedAttended, baseTotal, onRunSimulation]);

  // Manejador de decremento de asistencia
  const handleSubtractAttendance = useCallback(async () => {
    if (addedAttendances > 0) {
      setAddedAttendances((prev) => prev - 1);
    } else if (simulatedAttended > 0) {
      setAddedAbsences((prev) => prev + 1);
      if (onRunSimulation) {
        await onRunSimulation('add_absence');
      }
    }
  }, [addedAttendances, simulatedAttended, onRunSimulation]);

  // Manejador de incremento de inasistencias
  const handleAddAbsence = useCallback(async () => {
    if (simulatedAttended <= 0) return;
    setAddedAbsences((prev) => prev + 1);
    if (onRunSimulation) {
      await onRunSimulation('add_absence');
    }
  }, [simulatedAttended, onRunSimulation]);

  // Manejador de decremento de inasistencias
  const handleSubtractAbsence = useCallback(async () => {
    if (addedAbsences > 0) {
      setAddedAbsences((prev) => prev - 1);
    } else if (simulatedAttended < baseTotal) {
      setAddedAttendances((prev) => prev + 1);
      if (onRunSimulation) {
        await onRunSimulation('add_attendance');
      }
    }
  }, [addedAbsences, simulatedAttended, baseTotal, onRunSimulation]);

  const SimIcon = simMeta.icon;

  return (
    <div className="space-y-6">
      {/* Barra superior de encabezado y reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-[#002B49] border border-neutral-200">
            <Sliders className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
            <span>Simulador Interactivo de Asistencia SAT • Duoc UC</span>
          </div>
          <h3 id="sat-simulator-title" className={`${ADMIN_THEME.sectionTitle} text-lg text-neutral-900`}>
            Simulador de Cumplimiento Académico & Proyección RI
          </h3>
          <p className={`${ADMIN_THEME.moduleSubtitle} max-w-2xl`}>
            Ajusta asistencias e inasistencias en tiempo real para proyectar el riesgo de Reprobación por Inasistencia (RI) según la normativa del <strong>75% de asistencia mínima</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={isSimulating || (!hasLocalDelta && !activeSimulationInfo)}
          {...getVoiceProps('Restablecer simulación a los valores reales del estudiante')}
          className="self-start sm:self-auto shrink-0 min-h-[42px] px-4 py-2 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-300 shadow-2xs inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-neutral-600 ${isSimulating ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Restablecer a Valores Base</span>
        </button>
      </div>

      {/* Selectores de Estudiante y Asignatura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200/80">
        <div className="space-y-1.5">
          <label htmlFor="sat-simulator-student-select" className={`${ADMIN_THEME.cardLabel} block text-neutral-700`}>
            1. Estudiante Seleccionado
          </label>
          <select
            id="sat-simulator-student-select"
            value={selectedUserId || ''}
            onChange={(e) => onSelectStudent && onSelectStudent(e.target.value)}
            disabled={isSimulating}
            {...getVoiceProps('Seleccionar estudiante para simulación')}
            className={`w-full bg-white ${ADMIN_THEME.controlInput}`}
          >
            {students.map((stu) => (
              <option key={stu.id || stu._id} value={stu.id || stu._id}>
                {stu.fullName || stu.nombre} ({stu.career || 'Carrera'})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sat-simulator-course-select" className={`${ADMIN_THEME.cardLabel} block text-neutral-700`}>
            2. Asignatura a Simular
          </label>
          <select
            id="sat-simulator-course-select"
            value={selectedCourseCode || ''}
            onChange={(e) => onSelectCourse && onSelectCourse(e.target.value)}
            disabled={isSimulating || !student?.courseAttendance?.length}
            {...getVoiceProps('Seleccionar asignatura a evaluar')}
            className={`w-full bg-white ${ADMIN_THEME.controlInput}`}
          >
            {student?.courseAttendance?.map((c) => (
              <option key={c.courseCode} value={c.courseCode}>
                {c.courseCode} - {c.courseName} ({c.attendancePercentage}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NOTIFICACIÓN DE SIMULACIÓN ACTIVA */}
      {activeSimulationInfo && (
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-3 bg-[#002B49]/5 border border-[#002B49]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-[#002B49] font-medium"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
            <span>
              Simulación aplicada a <strong>{activeSimulationInfo.courseCode}</strong> ({activeSimulationInfo.studentName}): <strong>{activeSimulationInfo.action}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="font-bold underline hover:text-[#002B49]/80 cursor-pointer"
          >
            Restablecer valores originales
          </button>
        </div>
      )}

      {/* INDICADOR PRINCIPAL UNIFICADO */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${simMeta.borderColor} ${simMeta.bgTint} transition-all duration-300 shadow-xs space-y-6`}>
        {/* Encabezado del Indicador: Real vs Simulado */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Lado Izquierdo: Estado Actual */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Asistencia Actual (Real)
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${baseMeta.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${baseMeta.badgeDot}`} aria-hidden="true" />
                <span>{baseMeta.label}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-mono">
                {basePct}%
              </span>
              <span className="text-sm font-semibold text-neutral-600">
                {baseAttended} / {baseTotal} clases asistidas
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {baseAbsences} inasistencia(s) acumulada(s) • {baseConsecutiveAbsences} consecutiva(s)
            </p>
          </div>

          {/* Divisor / Flecha de Transición */}
          <div className="hidden lg:flex flex-col items-center justify-center px-4">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-2xs flex items-center justify-center">
              {deltaPct > 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              ) : deltaPct < 0 ? (
                <TrendingDown className="w-5 h-5 text-rose-600" aria-hidden="true" />
              ) : (
                <Sliders className="w-5 h-5 text-neutral-400" aria-hidden="true" />
              )}
            </div>
            {deltaPct !== 0 && (
              <span className={`text-[11px] font-black mt-1.5 px-2 py-0.5 rounded-full font-mono ${deltaPct > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
              </span>
            )}
          </div>

          {/* Lado Derecho: Estado Simulado Proyectado */}
          <div className="flex-1 space-y-2 lg:text-right">
            <div className="flex items-center gap-2 lg:justify-end">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Asistencia Simulada (Proyección)
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-2xs ${simMeta.badgeClass}`}>
                <SimIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{simMeta.label}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-3 lg:justify-end">
              <span className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${simMeta.textColor}`}>
                {simulatedPct}%
              </span>
              <span className="text-sm font-semibold text-neutral-700">
                {simulatedAttended} / {baseTotal} clases proyectadas
              </span>
            </div>

            <div className="flex items-center gap-2 lg:justify-end text-xs font-semibold">
              {deltaClasses !== 0 ? (
                <span className={deltaClasses > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {deltaClasses > 0 ? `+${deltaClasses}` : deltaClasses} clase(s) respecto al estado real
                </span>
              ) : (
                <span className="text-neutral-500">Sin variación respecto a la asistencia base</span>
              )}
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESO CON MARCADOR VISUAL DEL 75% */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>0%</span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-900 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#002B49]" aria-hidden="true" />
              <span>Umbral Institucional RI: 75%</span>
            </div>
            <span>100%</span>
          </div>

          {/* Contenedor relativo de la barra con marcador vertical */}
          <div className="relative w-full h-8 bg-neutral-200/80 rounded-full overflow-hidden p-1 shadow-inner">
            {/* Barra de progreso real (base) */}
            <div
              className="absolute left-1 top-1 bottom-1 bg-neutral-400/40 rounded-full transition-all duration-300"
              style={{ width: `calc(${Math.min(100, Math.max(0, basePct))}% - 8px)` }}
              title={`Asistencia actual: ${basePct}%`}
            />

            {/* Barra de progreso simulada interactiva */}
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${simMeta.barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, simulatedPct))}%` }}
              role="progressbar"
              aria-valuenow={simulatedPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Porcentaje simulado: ${simulatedPct}%`}
            />

            {/* Línea marcadora fija en 75% */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-neutral-900 z-10 shadow-sm pointer-events-none"
              style={{ left: '75%' }}
              title="Umbral mínimo RI (75%)"
            >
              <div className="w-3 h-3 rounded-full bg-[#FFB81C] border-2 border-neutral-900 absolute -top-1 -left-1 shadow-xs" />
            </div>
          </div>

          {/* Subtítulo explicativo del progreso */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-600 pt-1">
            <span>
              {simulatedPct >= 75 ? (
                <strong className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Cumple con el reglamento institucional (mínimo 75% de asistencia requerido para aprobar).
                </strong>
              ) : currentJustified ? (
                <strong className="text-purple-800 flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
                  Régimen de excepción activo: las inasistencias no conllevan Reprobación por Inasistencia.
                </strong>
              ) : (
                <strong className="text-rose-700 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />
                  Bajo el umbral reglamentario: requiere al menos {classesNeededFor75} clase(s) asistida(s) consecutivas para salir de RI.
                </strong>
              )}
            </span>
            <span className="font-mono font-medium">
              Faltas máx. permitidas: {maxAllowedAbsences} | Acumuladas: {simulatedAbsences}
            </span>
          </div>
        </div>

        {/* Módulos de Diagnóstico Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-neutral-200/90 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              Margen de Faltas Restante
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-mono ${simulatedAbsences > maxAllowedAbsences ? 'text-rose-700' : simulatedAbsences === maxAllowedAbsences ? 'text-amber-700' : 'text-neutral-900'}`}>
                {Math.max(0, maxAllowedAbsences - simulatedAbsences)}
              </span>
              <span className="text-xs text-neutral-600 font-medium">
                de {maxAllowedAbsences} permitidas máx.
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              {simulatedAbsences > maxAllowedAbsences
                ? `Excedido por ${simulatedAbsences - maxAllowedAbsences} inasistencia(s).`
                : 'Margen disponible antes de entrar en causal de RI.'}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-neutral-200/90 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              Inasistencias Consecutivas
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-mono ${simulatedConsecutive >= 3 ? 'text-rose-700' : simulatedConsecutive === 2 ? 'text-amber-700' : 'text-neutral-900'}`}>
                {simulatedConsecutive}
              </span>
              <span className="text-xs text-neutral-600 font-medium">
                faltas seguidas
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              {simulatedConsecutive >= 3
                ? '¡Alerta crítica! 3 o más faltas seguidas activan alerta automática.'
                : 'Bajo el límite crítico de 3 faltas consecutivas.'}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-neutral-200/90 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              Estado de Justificación
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${currentJustified ? 'text-purple-800' : 'text-neutral-800'}`}>
                {currentJustified ? 'Excepción Médica Activa' : 'Régimen Estándar'}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              {currentJustified
                ? 'Inasistencias amparadas por justificación formal o PAEDIS.'
                : 'Aplica el requisito general de 75% de asistencia obligatoria.'}
            </p>
          </div>
        </div>
      </div>

      {/* CONTROLES INTERACTIVOS DIRECTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stepper: Asistencias Adicionales */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Asistencias Adicionales</span>
              </label>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                +{addedAttendances}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Suma clases asistidas para evaluar la recuperación porcentual.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSubtractAttendance}
              disabled={isSimulating || (addedAttendances <= 0 && simulatedAttended <= 0)}
              {...getVoiceProps('Disminuir una clase asistida en la simulación')}
              className="flex-1 min-h-[42px] px-3 py-2 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 rounded-xl font-black text-sm border border-neutral-200 inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              aria-label="Disminuir asistencia"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-center min-w-[50px]">
              <span className="font-mono font-black text-sm text-neutral-900">
                {simulatedAttended}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddAttendance}
              disabled={isSimulating || simulatedAttended >= baseTotal}
              {...getVoiceProps('Añadir una clase asistida en la simulación')}
              className="flex-1 min-h-[42px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-black text-sm shadow-xs inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              aria-label="Aumentar asistencia"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper: Inasistencias Adicionales */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <span>Inasistencias Adicionales</span>
              </label>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                +{addedAbsences}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Proyecta el impacto de faltar a futuras sesiones programadas.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSubtractAbsence}
              disabled={isSimulating || (addedAbsences <= 0 && simulatedAttended >= baseTotal)}
              {...getVoiceProps('Disminuir una falta en la simulación')}
              className="flex-1 min-h-[42px] px-3 py-2 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 rounded-xl font-black text-sm border border-neutral-200 inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              aria-label="Disminuir falta"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-center min-w-[50px]">
              <span className="font-mono font-black text-sm text-neutral-900">
                {simulatedAbsences}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddAbsence}
              disabled={isSimulating || simulatedAttended <= 0}
              {...getVoiceProps('Añadir una falta en la simulación')}
              className="flex-1 min-h-[42px] px-3 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-black text-sm shadow-xs inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              aria-label="Aumentar falta"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Acción Rápida: Simular Recuperación a 75% */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
              <span>Recuperación al 75%</span>
            </span>
            <p className="text-[11px] text-neutral-500">
              Calcula y aplica exactamente las clases consecutivas necesarias para salir de RI.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleRecoverTo75}
              disabled={isSimulating || simulatedPct >= 75}
              {...getVoiceProps(
                simulatedPct >= 75
                  ? 'La asignatura ya cumple el 75 por ciento'
                  : `Simular recuperación al 75% requiriendo ${classesNeededFor75} clases consecutivas`
              )}
              className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${simulatedPct >= 75 ? 'bg-neutral-100 text-neutral-500 border border-neutral-200' : 'bg-[#002B49] hover:bg-[#002B49]/90 text-white'}`}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0 text-[#FFB81C]" aria-hidden="true" />
              <span>
                {simulatedPct >= 75
                  ? 'Cumple Umbral (≥75%)'
                  : `Recuperar a 75% (+${classesNeededFor75} ${classesNeededFor75 === 1 ? 'clase' : 'clases'})`}
              </span>
            </button>
          </div>
        </div>

        {/* Control: Licencia Médica / Excepción PAEDIS */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-purple-700" aria-hidden="true" />
              <span>Licencia Médica / PAEDIS</span>
            </span>
            <p className="text-[11px] text-neutral-500">
              Exime las inasistencias por causal médica o ajuste formal (Ley N° 21.719).
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleToggleJustified}
              disabled={isSimulating}
              {...getVoiceProps(
                currentJustified
                  ? 'Quitar justificación médica o curricular formal'
                  : 'Aplicar justificación médica o ajuste PAEDIS formal'
              )}
              className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${currentJustified ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300'}`}
            >
              <HeartHandshake className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{currentJustified ? 'Licencia Médica Activa' : 'Aplicar Licencia Médica'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SatAttendanceSimulator;
