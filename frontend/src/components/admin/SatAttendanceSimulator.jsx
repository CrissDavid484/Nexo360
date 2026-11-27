import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Info,
  CalendarPlus,
  History,
} from 'lucide-react';
import { useAccessibility } from '@context/AccessibilityContext';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { calculateBidirectionalSimulation, DUOC_ATTENDANCE_THRESHOLDS } from '@utils/satUtils';

function getTrafficLightMeta(pct, isJustified, minRequired = DUOC_ATTENDANCE_THRESHOLDS.RI_CRITICAL) {
  if (isJustified) {
    return {
      status: 'justified',
      label: 'Justificación Simulada (Hipotética)',
      sublabel: 'Escenario hipotético PAEDIS / Licencia (no otorga excepción oficial)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      badgeDot: 'bg-purple-600',
      barColor: 'bg-purple-600',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200',
      bgTint: 'bg-purple-50/70',
      icon: HeartHandshake,
    };
  }

  if (pct === null || pct === undefined || !Number.isFinite(Number(pct))) {
    return {
      status: 'no_data',
      label: 'Sin Registros (0 clases)',
      sublabel: 'Aún no se registran sesiones dictadas',
      badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      badgeDot: 'bg-neutral-500',
      barColor: 'bg-neutral-400',
      textColor: 'text-neutral-700',
      borderColor: 'border-neutral-200',
      bgTint: 'bg-neutral-50/70',
      icon: Info,
    };
  }

  const num = Number(pct);
  const regularMin = minRequired + 5;
  if (num >= regularMin) {
    return {
      status: 'normal',
      label: `Verde • Asistencia Regular (≥${regularMin}%)`,
      sublabel: 'Cumple normativa institucional',
      badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      badgeDot: 'bg-emerald-600',
      barColor: 'bg-emerald-600',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200',
      bgTint: 'bg-emerald-50/70',
      icon: CheckCircle2,
    };
  }

  if (num >= minRequired) {
    return {
      status: 'preventive',
      label: `Amarillo • Zona Preventiva (${minRequired}% - ${(regularMin - 0.1).toFixed(1)}%)`,
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
    label: `Riesgo Crítico RI (<${minRequired}%)`,
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

function buildBaselineSnapshot(course) {
  if (!course) return null;
  const rawTotal = course.completedSessions ?? course.totalSessions;
  const totalSessions = rawTotal === undefined || rawTotal === null ? 0 : Math.max(0, Number(rawTotal));
  const attendedSessions =
    totalSessions === 0
      ? 0
      : Math.max(0, Math.min(totalSessions, Number(course.attendedSessions ?? 0)));
  return {
    courseCode: course.courseCode,
    totalSessions,
    attendedSessions,
    consecutiveAbsences: Number(course.consecutiveAbsences || 0),
    paedisJustified: Boolean(course.paedisJustified),
    missedKeySession: Boolean(course.missedKeySession),
    minAttendanceRequired:
      Number.isFinite(Number(course.minAttendanceRequired)) && Number(course.minAttendanceRequired) > 0
        ? Number(course.minAttendanceRequired)
        : DUOC_ATTENDANCE_THRESHOLDS.RI_CRITICAL,
    scheduledSessions:
      course.scheduledSessions !== undefined && course.scheduledSessions !== null
        ? Number(course.scheduledSessions)
        : null,
    pendingSessions:
      course.pendingSessions !== undefined && course.pendingSessions !== null
        ? Number(course.pendingSessions)
        : null,
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

  const baselineMapRef = useRef(new Map());
  const selectionKey = `${selectedUserId || ''}::${selectedCourseCode || course?.courseCode || ''}`;

  // Capturar el baseline exacto la primera vez que se selecciona un estudiante/asignatura
  if (course && !baselineMapRef.current.has(selectionKey)) {
    baselineMapRef.current.set(selectionKey, buildBaselineSnapshot(course));
  }

  const baseline = baselineMapRef.current.get(selectionKey) || buildBaselineSnapshot(course);

  // Separación explícita: proyección futura vs corrección de registro pasado
  const [futureAttendedDelta, setFutureAttendedDelta] = useState(0);
  const [futureMissedDelta, setFutureMissedDelta] = useState(0);
  const [pastCorrectionDelta, setPastCorrectionDelta] = useState(0);
  const [isJustifiedOverride, setIsJustifiedOverride] = useState(null);

  useEffect(() => {
    setFutureAttendedDelta(0);
    setFutureMissedDelta(0);
    setPastCorrectionDelta(0);
    setIsJustifiedOverride(null);
  }, [selectionKey]);

  const baseTotal = baseline?.totalSessions ?? 0;
  const baseAttended = baseline?.attendedSessions ?? 0;
  const baseAbsences = Math.max(0, baseTotal - baseAttended);
  const baseConsecutiveAbsences = baseline?.consecutiveAbsences ?? 0;
  const baseJustified = baseline?.paedisJustified ?? false;
  const minRequiredThreshold = baseline?.minAttendanceRequired ?? DUOC_ATTENDANCE_THRESHOLDS.RI_CRITICAL;

  const basePct = baseTotal === 0 ? null : Math.round((baseAttended / baseTotal) * 1000) / 10;

  // Cálculo simulado combinando corrección de registro pasado (sobre baseTotal) + clases futuras (+1 a total y/o attended)
  const correctedPastAttended =
    baseTotal === 0 ? 0 : Math.max(0, Math.min(baseTotal, baseAttended + pastCorrectionDelta));
  const simulatedTotal = baseTotal + futureAttendedDelta + futureMissedDelta;
  const simulatedAttended = Math.max(
    0,
    Math.min(simulatedTotal, correctedPastAttended + futureAttendedDelta)
  );
  const simulatedAbsences = Math.max(0, simulatedTotal - simulatedAttended);
  const simulatedPct =
    simulatedTotal === 0 ? null : Math.round((simulatedAttended / simulatedTotal) * 1000) / 10;

  const deltaPct =
    basePct !== null && simulatedPct !== null
      ? Math.round((simulatedPct - basePct) * 10) / 10
      : null;

  const currentJustified = isJustifiedOverride !== null ? isJustifiedOverride : baseJustified;

  const simulatedConsecutive = Math.max(
    0,
    futureMissedDelta > 0 || pastCorrectionDelta < 0
      ? baseConsecutiveAbsences + futureMissedDelta + Math.max(0, -pastCorrectionDelta)
      : Math.max(0, baseConsecutiveAbsences - futureAttendedDelta - Math.max(0, pastCorrectionDelta))
  );

  // Evaluar factibilidad real de recuperación desde el estado simulado actual
  const basePending =
    baseline?.pendingSessions !== undefined && baseline?.pendingSessions !== null
      ? baseline.pendingSessions
      : baseline?.scheduledSessions !== null && baseline?.scheduledSessions !== undefined
        ? Math.max(0, baseline.scheduledSessions - baseTotal)
        : null;

  const remainingPendingSessions =
    basePending === null
      ? null
      : Math.max(0, basePending - (futureAttendedDelta + futureMissedDelta));

  const simAnalysis = useMemo(() => {
    return calculateBidirectionalSimulation({
      totalSessions: simulatedTotal,
      attendedSessions: simulatedAttended,
      consecutiveAbsences: simulatedConsecutive,
      paedisJustified: currentJustified,
      minAttendanceRequired: minRequiredThreshold,
      pendingSessions: remainingPendingSessions,
    });
  }, [
    simulatedTotal,
    simulatedAttended,
    simulatedConsecutive,
    currentJustified,
    minRequiredThreshold,
    remainingPendingSessions,
  ]);

  const minRequiredSessions = simAnalysis?.recovery?.minRequiredSessions ?? Math.ceil(simulatedTotal * (minRequiredThreshold / 100));
  const maxAllowedAbsences = Math.max(0, simulatedTotal - minRequiredSessions);
  const classesNeededForMin = simAnalysis?.recovery?.futureClassesNeeded ?? 0;
  const recoveryPossible = simAnalysis?.recoveryPossible ?? false;
  const canAddFutureSession = remainingPendingSessions === null || remainingPendingSessions > 0;

  const baseMeta = useMemo(
    () => getTrafficLightMeta(basePct, baseJustified, minRequiredThreshold),
    [basePct, baseJustified, minRequiredThreshold]
  );
  const simMeta = useMemo(
    () => getTrafficLightMeta(simulatedPct, currentJustified, minRequiredThreshold),
    [simulatedPct, currentJustified, minRequiredThreshold]
  );

  const hasLocalDelta =
    futureAttendedDelta !== 0 ||
    futureMissedDelta !== 0 ||
    pastCorrectionDelta !== 0 ||
    isJustifiedOverride !== null;

  const handleReset = useCallback(async () => {
    setFutureAttendedDelta(0);
    setFutureMissedDelta(0);
    setPastCorrectionDelta(0);
    setIsJustifiedOverride(null);
    if (onRunSimulation) {
      await onRunSimulation('reset');
    }
  }, [onRunSimulation]);

  // Proyectar próxima clase (+1 clase futura asistida -> (attended+1)/(total+1))
  const handleFutureAttend = useCallback(async () => {
    if (!canAddFutureSession) return;
    setFutureAttendedDelta((prev) => prev + 1);
    if (onRunSimulation) {
      await onRunSimulation('future_class_attend');
    }
  }, [canAddFutureSession, onRunSimulation]);

  // Proyectar próxima clase inasistida -> attended/(total+1)
  const handleFutureMiss = useCallback(async () => {
    if (!canAddFutureSession) return;
    setFutureMissedDelta((prev) => prev + 1);
    if (onRunSimulation) {
      await onRunSimulation('future_class_miss');
    }
  }, [canAddFutureSession, onRunSimulation]);

  // Corregir registro pasado (+1 asistencia sin cambiar total)
  const handlePastCorrectionPositive = useCallback(async () => {
    if (baseTotal === 0 || correctedPastAttended >= baseTotal) return;
    setPastCorrectionDelta((prev) => prev + 1);
    if (onRunSimulation) {
      await onRunSimulation('correct_past_attendance');
    }
  }, [baseTotal, correctedPastAttended, onRunSimulation]);

  // Corregir registro pasado (-1 asistencia / +1 falta sin cambiar total)
  const handlePastCorrectionNegative = useCallback(async () => {
    if (baseTotal === 0 || correctedPastAttended <= 0) return;
    setPastCorrectionDelta((prev) => prev - 1);
    if (onRunSimulation) {
      await onRunSimulation('add_absence');
    }
  }, [baseTotal, correctedPastAttended, onRunSimulation]);

  // Simular recuperación mediante clases futuras consecutivas (solo si recoveryPossible)
  const handleRecoverToMin = useCallback(async () => {
    if (!recoveryPossible || !Number.isFinite(classesNeededForMin) || classesNeededForMin <= 0) return;
    setFutureAttendedDelta((prev) => prev + classesNeededForMin);
    if (onRunSimulation) {
      await onRunSimulation('recover_to_70');
    }
  }, [recoveryPossible, classesNeededForMin, onRunSimulation]);

  // Simulación hipotética de excepción médica/PAEDIS (no otorga excepción oficial)
  const handleToggleJustified = useCallback(async () => {
    const nextState = !currentJustified;
    setIsJustifiedOverride(nextState);
    if (onRunSimulation) {
      await onRunSimulation('paedis_justify');
    }
  }, [currentJustified, onRunSimulation]);

  const SimIcon = simMeta.icon;

  return (
    <div className="space-y-6">
      {/* Aviso explícito de alcance informativo */}
      <div
        role="note"
        aria-label="Aviso de alcance de la simulación"
        {...getVoiceProps(
          'Simulador informativo: las proyecciones y correcciones simuladas no modifican la asistencia oficial en Vivo Duoc ni otorgan excepciones oficiales.'
        )}
        className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 border-l-4 border-l-[#FFB81C] text-xs text-neutral-900 flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-[#002B49] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong>Simulador informativo (sin efectos oficiales):</strong> las proyecciones y simulaciones no modifican la asistencia oficial en Vivo Duoc/SAP ni otorgan excepciones o justificaciones formales.
        </p>
      </div>

      {/* Barra superior de encabezado y reset exacto */}
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
            Distingue entre <strong>proyección de próximas clases futuras (+1 sesión al total)</strong> y <strong>corrección hipotética de registro pasado</strong> según el umbral mínimo de <strong>{minRequiredThreshold}% (RI &lt;{minRequiredThreshold}%)</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={isSimulating || (!hasLocalDelta && !activeSimulationInfo)}
          {...getVoiceProps('Restablecer valores exactos del estudiante')}
          className="self-start sm:self-auto shrink-0 min-h-[42px] px-4 py-2 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-300 shadow-2xs inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-neutral-600 ${isSimulating ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Restablecer valores exactos</span>
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
                {c.courseCode} - {c.courseName} ({c.attendancePercentage ?? 'Sin datos'}%)
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
            Restablecer valores exactos
          </button>
        </div>
      )}

      {/* INDICADOR PRINCIPAL UNIFICADO */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${simMeta.borderColor} ${simMeta.bgTint} transition-colors duration-300 shadow-xs space-y-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Línea Base Exacta
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${baseMeta.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${baseMeta.badgeDot}`} aria-hidden="true" />
                <span>{baseMeta.label}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-mono">
                {basePct === null ? 'Sin datos' : `${basePct}%`}
              </span>
              <span className="text-sm font-semibold text-neutral-600">
                {baseAttended} / {baseTotal} clases registradas
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {baseAbsences} inasistencia(s) acumulada(s) • {baseConsecutiveAbsences} consecutiva(s)
              {remainingPendingSessions !== null && ` • ${remainingPendingSessions} sesión(es) pendiente(s)`}
            </p>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center px-4">
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-2xs flex items-center justify-center">
              {deltaPct !== null && deltaPct > 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              ) : deltaPct !== null && deltaPct < 0 ? (
                <TrendingDown className="w-5 h-5 text-rose-600" aria-hidden="true" />
              ) : (
                <Sliders className="w-5 h-5 text-neutral-400" aria-hidden="true" />
              )}
            </div>
            {deltaPct !== null && deltaPct !== 0 && (
              <span className={`text-[11px] font-black mt-1.5 px-2 py-0.5 rounded-full font-mono ${deltaPct > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-2 lg:text-right">
            <div className="flex items-center gap-2 lg:justify-end flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Escenario Simulado
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-2xs ${simMeta.badgeClass}`}>
                <SimIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{simMeta.label}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-3 lg:justify-end">
              <span className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${simMeta.textColor}`}>
                {simulatedPct === null ? 'Sin datos' : `${simulatedPct}%`}
              </span>
              <span className="text-sm font-semibold text-neutral-700">
                {simulatedAttended} / {simulatedTotal} clases proyectadas
              </span>
            </div>

            <div className="flex items-center gap-2 lg:justify-end text-xs font-semibold">
              {hasLocalDelta ? (
                <span className="text-[#002B49]">
                  {futureAttendedDelta > 0 && `+${futureAttendedDelta} futura(s) asistida(s) `}
                  {futureMissedDelta > 0 && `+${futureMissedDelta} futura(s) inasistida(s) `}
                  {pastCorrectionDelta !== 0 && `(${pastCorrectionDelta > 0 ? `+${pastCorrectionDelta}` : pastCorrectionDelta} corrección pasada)`}
                </span>
              ) : (
                <span className="text-neutral-500">Sin variación respecto a la línea base exacta</span>
              )}
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESO CON MARCADOR VISUAL DEL UMBRAL RI */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>0%</span>
            <div className="flex items-center gap-1.5 font-bold text-neutral-900 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#002B49]" aria-hidden="true" />
              <span>Umbral Institucional RI: {minRequiredThreshold}%</span>
            </div>
            <span>100%</span>
          </div>

          <div className="relative w-full h-8 bg-neutral-200/80 rounded-full overflow-hidden p-1 shadow-inner">
            {basePct !== null && (
              <div
                className="absolute left-1 top-1 bottom-1 bg-neutral-400/40 rounded-full transition-all duration-300"
                style={{ width: `calc(${Math.min(100, Math.max(0, basePct))}% - 8px)` }}
                title={`Línea base exacta: ${basePct}%`}
              />
            )}

            <div
              className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${simMeta.barColor}`}
              style={{ width: `${simulatedPct === null ? 0 : Math.min(100, Math.max(0, simulatedPct))}%` }}
              role="progressbar"
              aria-valuenow={simulatedPct ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={simulatedPct === null ? 'Sin registros de asistencia' : `Porcentaje simulado: ${simulatedPct}%`}
            />

            <div
              className="absolute top-0 bottom-0 w-1 bg-neutral-900 z-10 shadow-sm pointer-events-none"
              style={{ left: `${minRequiredThreshold}%` }}
              title={`Umbral mínimo RI (${minRequiredThreshold}%)`}
            >
              <div className="w-3 h-3 rounded-full bg-[#FFB81C] border-2 border-neutral-900 absolute -top-1 -left-1 shadow-xs" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-600 pt-1">
            <span>
              {simulatedPct === null ? (
                <strong className="text-neutral-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                  Sin clases registradas aún (0/0). Proyecta la próxima clase para simular.
                </strong>
              ) : simulatedPct >= minRequiredThreshold ? (
                <strong className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Cumple el mínimo reglamentario ({minRequiredThreshold}% para evitar RI).
                </strong>
              ) : currentJustified ? (
                <strong className="text-purple-800 flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
                  Simulación hipotética de excepción activa (no constituye excepción oficial).
                </strong>
              ) : !recoveryPossible ? (
                <strong className="text-rose-700 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />
                  Recuperación imposible con las sesiones pendientes disponibles.
                </strong>
              ) : (
                <strong className="text-rose-700 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />
                  Bajo el umbral RI ({minRequiredThreshold}%): requiere +{classesNeededForMin} clase(s) futura(s) consecutiva(s) para alcanzar {minRequiredThreshold}%.
                </strong>
              )}
            </span>
            <span className="font-mono font-medium">
              Faltas máx. sobre total actual: {maxAllowedAbsences} | Acumuladas: {simulatedAbsences}
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
                ? 'Alerta crítica: 3 o más faltas seguidas activan alerta automática.'
                : 'Bajo el límite crítico de 3 faltas consecutivas.'}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-neutral-200/90 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              Régimen Evaluado
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${currentJustified ? 'text-purple-800' : 'text-neutral-800'}`}>
                {currentJustified ? 'Excepción Simulada' : `Estándar (${minRequiredThreshold}% RI)`}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              {currentJustified
                ? 'Simulación hipotética: no otorga excepción oficial.'
                : `Aplica el requisito mínimo de ${minRequiredThreshold}% de asistencia (RI <${minRequiredThreshold}%).`}
            </p>
          </div>
        </div>
      </div>

      {/* CONTROLES SEPARADOS: PROYECCIÓN FUTURA VS CORRECCIÓN PASADA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Proyectar próxima clase (+1 clase futura) */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <CalendarPlus className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Proyectar próxima clase (+1 clase futura)</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Suma +1 sesión al denominador total: asistir ({simulatedAttended + 1}/{simulatedTotal + 1}) o faltar ({simulatedAttended}/{simulatedTotal + 1}).
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleFutureAttend}
              disabled={isSimulating || !canAddFutureSession}
              {...getVoiceProps('Proyectar próxima clase asistida, más 1 clase futura')}
              className="w-full min-h-[40px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Asistir (+1 futura)</span>
            </button>
            <button
              type="button"
              onClick={handleFutureMiss}
              disabled={isSimulating || !canAddFutureSession}
              {...getVoiceProps('Proyectar próxima clase inasistida, más 1 clase futura')}
              className="w-full min-h-[40px] px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Faltar (+1 futura)</span>
            </button>
          </div>
        </div>

        {/* 2. Corregir registro pasado (mantiene total de sesiones) */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                <span>Corregir registro pasado</span>
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                {pastCorrectionDelta >= 0 ? `+${pastCorrectionDelta}` : pastCorrectionDelta}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Ajusta asistencias pasadas sobre las {baseTotal} sesiones ya dictadas sin alterar el total.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handlePastCorrectionNegative}
              disabled={isSimulating || baseTotal === 0 || correctedPastAttended <= 0}
              {...getVoiceProps('Corregir registro pasado restando 1 asistencia')}
              className="flex-1 min-h-[42px] px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-black text-sm border border-neutral-200 inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] cursor-pointer"
              aria-label="Corregir registro pasado (-1 asistencia)"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <div className="px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-center min-w-[50px]">
              <span className="font-mono font-black text-sm text-neutral-900">
                {correctedPastAttended}
              </span>
            </div>
            <button
              type="button"
              onClick={handlePastCorrectionPositive}
              disabled={isSimulating || baseTotal === 0 || correctedPastAttended >= baseTotal}
              {...getVoiceProps('Corregir registro pasado sumando 1 asistencia')}
              className="flex-1 min-h-[42px] px-3 py-2 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl font-black text-sm shadow-xs inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] cursor-pointer"
              aria-label="Corregir registro pasado (+1 asistencia)"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 3. Recuperación al umbral mínimo (deshabilitada si es imposible) */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
              <span>Recuperación a ≥{minRequiredThreshold}%</span>
            </span>
            <p className="text-[11px] text-neutral-500">
              {!recoveryPossible
                ? 'Las sesiones pendientes no alcanzan para superar el umbral mínimo.'
                : `Proyecta las clases futuras consecutivas necesarias para alcanzar ${minRequiredThreshold}%.`}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleRecoverToMin}
              disabled={
                isSimulating ||
                !recoveryPossible ||
                (simulatedPct !== null && simulatedPct >= minRequiredThreshold) ||
                !Number.isFinite(classesNeededForMin) ||
                classesNeededForMin <= 0
              }
              {...getVoiceProps(
                !recoveryPossible
                  ? 'Recuperación imposible con las sesiones pendientes'
                  : simulatedPct !== null && simulatedPct >= minRequiredThreshold
                    ? `La asignatura ya cumple el ${minRequiredThreshold} por ciento reglamentario`
                    : `Proyectar recuperación a ${minRequiredThreshold}% con ${classesNeededForMin} clases futuras`
              )}
              className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                !recoveryPossible || (simulatedPct !== null && simulatedPct >= minRequiredThreshold)
                  ? 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                  : 'bg-[#002B49] hover:bg-[#002B49]/90 text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0 text-[#FFB81C]" aria-hidden="true" />
              <span>
                {!recoveryPossible
                  ? 'Recuperación imposible'
                  : simulatedPct !== null && simulatedPct >= minRequiredThreshold
                    ? `Cumple Umbral (≥${minRequiredThreshold}%)`
                    : `Recuperar a ${minRequiredThreshold}% (+${classesNeededForMin} ${classesNeededForMin === 1 ? 'clase' : 'clases'})`}
              </span>
            </button>
          </div>
        </div>

        {/* 4. Simulación hipotética de excepción */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-purple-700" aria-hidden="true" />
              <span>Excepción Hipotética</span>
            </span>
            <p className="text-[11px] text-neutral-500">
              Simula cómo se vería el estado con licencia o ajuste PAEDIS (no otorga excepción oficial).
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleToggleJustified}
              disabled={isSimulating}
              {...getVoiceProps(
                currentJustified
                  ? 'Quitar simulación hipotética de excepción'
                  : 'Simular excepción hipotética de licencia o ajuste PAEDIS'
              )}
              className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                currentJustified
                  ? 'bg-purple-700 hover:bg-purple-800 text-white'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300'
              }`}
            >
              <HeartHandshake className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{currentJustified ? 'Quitar Simulación' : 'Simular Excepción'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SatAttendanceSimulator;
