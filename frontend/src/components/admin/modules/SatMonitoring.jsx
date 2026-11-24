import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Play,
  BookOpen,
  HeartHandshake,
  X,
  Search,
  FileText,
  ChevronRight,
  RotateCcw,
  FileSignature,
  Sliders,
} from 'lucide-react';
import { api } from '@services/api';
import { useAccessibility } from '@context/AccessibilityContext';
import {
  evaluateAttendanceStatus,
  getSatRiskBadgeMeta,
  extractCourseAttendanceRate,
} from '@utils/satUtils';
import { DEFAULT_CAMPUS, matchesRutQuery } from '@utils/studentUtils';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';

const SAT_RISK_BADGE_MAP = {
  LEVEL_2_CRITICAL: 'critico',
  LEVEL_1_PREVENTIVE: 'preventivo',
  NONE: 'normal',
};

function resolveStudentSatBadgeClass(riskLevel) {
  if (riskLevel === 'PAEDIS_JUSTIFIED') {
    return 'bg-purple-100 text-purple-900 border border-purple-300';
  }
  const meta = getSatRiskBadgeMeta(SAT_RISK_BADGE_MAP[riskLevel] || 'normal');
  return meta.badgeClass + ' border';
}

const SAT_LIFECYCLE_STATES = [
  { id: 'PENDING', label: 'Pendiente', stepNumber: 1, description: 'Alerta generada, contacto pendiente', badgeClass: 'bg-rose-100 text-rose-950 border border-rose-300', activeClass: 'bg-rose-50 text-rose-950 border-rose-400 ring-2 ring-rose-400' },
  { id: 'IN_PROGRESS', label: 'En gestión / Contactado', stepNumber: 2, description: 'Estudiante contactado y en seguimiento activo', badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300', activeClass: 'bg-amber-50 text-amber-950 border-amber-400 ring-2 ring-amber-400' },
  { id: 'AGREEMENT', label: 'Acuerdo o Derivación', stepNumber: 3, description: 'Compromiso académico o derivación asistencial firmada', badgeClass: 'bg-blue-100 text-blue-950 border border-blue-300', activeClass: 'bg-blue-50 text-blue-950 border-blue-400 ring-2 ring-blue-400' },
  { id: 'RESOLVED', label: 'Resuelta', stepNumber: 4, description: 'Caso resuelto o justificación curricular aprobada', badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-300', activeClass: 'bg-emerald-50 text-emerald-950 border-emerald-400 ring-2 ring-emerald-400' },
];

function getSatLifecycleMeta(status) {
  const norm = String(status || '').toUpperCase();
  return SAT_LIFECYCLE_STATES.find((s) => s.id === norm) || SAT_LIFECYCLE_STATES[0];
}

function getSatTriggerFactor(student) {
  const sat = student.satEvaluation || {};
  const courses = sat.coursesDetails || student.courseAttendance || [];

  if (sat.riskLevel === 'LEVEL_2_CRITICAL') {
    const criticalCourse = courses.find((c) => {
      const pct = Number(c.attendancePercentage ?? 100);
      const abs = Number(c.consecutiveAbsences || 0);
      return !c.paedisJustified && (pct < 75 || abs >= 3 || c.missedKeySession);
    }) || courses[0];

    const pct = criticalCourse ? Math.round(Number(criticalCourse.attendancePercentage ?? 0) * 10) / 10 : 0;
    const abs = criticalCourse ? Number(criticalCourse.consecutiveAbsences || 0) : 0;

    let triggerReason = (criticalCourse?.courseCode || 'Asignatura') + ' (' + (criticalCourse?.courseName || 'Ramo') + '): ' + pct + '% de asistencia (bajo el 75% exigido).';
    if (abs >= 3) triggerReason += ' Acumula ' + abs + ' inasistencias consecutivas.';
    if (criticalCourse?.missedKeySession) triggerReason += ' Falta a evaluación o certamen clave institucional.';

    return {
      severity: 'CRITICAL',
      title: 'Factor Disparador: Alerta Crítica (Causal Inminente de RI)',
      courseCode: criticalCourse?.courseCode || '',
      courseName: criticalCourse?.courseName || '',
      attendancePct: pct,
      description: triggerReason,
      boxClass: 'bg-rose-50 border-rose-300 text-rose-950',
      badgeClass: 'bg-rose-700 text-white',
      icon: AlertOctagon,
      iconClass: 'text-rose-700',
    };
  }

  if (sat.riskLevel === 'LEVEL_1_PREVENTIVE') {
    const prevCourse = courses.find((c) => {
      const pct = Number(c.attendancePercentage ?? 100);
      const abs = Number(c.consecutiveAbsences || 0);
      return !c.paedisJustified && ((pct >= 75 && pct <= 79) || abs === 2);
    }) || courses[0];

    const pct = prevCourse ? Math.round(Number(prevCourse.attendancePercentage ?? 0) * 10) / 10 : 0;
    const desc = (prevCourse?.courseCode || 'Asignatura') + ' (' + (prevCourse?.courseName || 'Ramo') + '): ' + pct + '% de asistencia (zona de riesgo preventivo 75% a 79%). Requiere acompañamiento temprano.';
    return {
      severity: 'PREVENTIVE',
      title: 'Factor Disparador: Alerta Preventiva (Margen Crítico Restante)',
      courseCode: prevCourse?.courseCode || '',
      courseName: prevCourse?.courseName || '',
      attendancePct: pct,
      description: desc,
      boxClass: 'bg-amber-50 border-amber-300 text-amber-950',
      badgeClass: 'bg-amber-500 text-slate-950',
      icon: AlertTriangle,
      iconClass: 'text-amber-700',
    };
  }

  if (sat.riskLevel === 'PAEDIS_JUSTIFIED') {
    return {
      severity: 'JUSTIFIED',
      title: 'Factor Disparador: Acompañamiento PAEDIS Justificado',
      courseCode: '',
      courseName: '',
      attendancePct: 0,
      description: 'Inasistencias amparadas en expediente confidencial de ajustes razonables vigentes (Ley N° 21.719).',
      boxClass: 'bg-purple-50 border-purple-300 text-purple-950',
      badgeClass: 'bg-purple-700 text-white',
      icon: HeartHandshake,
      iconClass: 'text-purple-700',
    };
  }

  return {
    severity: 'REGULAR',
    title: 'Sin Factores de Riesgo Activos',
    courseCode: '',
    courseName: '',
    attendancePct: 100,
    description: 'Todas las asignaturas monitoreadas presentan asistencia regular superior al 80% reglamentario.',
    boxClass: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    badgeClass: 'bg-emerald-700 text-white',
    icon: CheckCircle2,
    iconClass: 'text-emerald-700',
  };
}

function SatCourseRow({ course, onSelectCourseForSimulation, getVoiceProps }) {
  const rawPct = extractCourseAttendanceRate(course);
  const pct = Math.round(rawPct * 10) / 10;
  const isJustified = Boolean(course.paedisJustified);
  const { status, label } = evaluateAttendanceStatus(pct, { isJustified, mode: 'sat75' });
  const consecutiveAbs = Number(course.consecutiveAbsences || 0);

  const statusDotClass = isJustified
    ? 'bg-purple-500'
    : status === 'ri'
      ? 'bg-rose-500'
      : status === 'preventive'
        ? 'bg-amber-400'
        : 'bg-emerald-500';

  const pctTextClass = isJustified
    ? 'text-purple-800'
    : status === 'ri'
      ? 'text-rose-700'
      : status === 'preventive'
        ? 'text-amber-700'
        : 'text-emerald-700';

  const voiceMsg =
    'Asignatura ' +
    course.courseCode +
    ', ' +
    course.courseName +
    '. ' +
    label +
    ', asistencia ' +
    pct +
    ' por ciento, ' +
    consecutiveAbs +
    ' inasistencias consecutivas';

  return (
    <div
      {...getVoiceProps(voiceMsg)}
      className="px-3 py-2.5 rounded-xl border border-neutral-200/90 bg-neutral-50/70 hover:bg-neutral-50 transition-colors flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDotClass}`} aria-hidden="true" />
        <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 shrink-0">
          {course.courseCode}
        </span>
        <span className="text-xs font-semibold text-neutral-800 truncate">{course.courseName}</span>
        {isJustified && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
            Excepción
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className={`text-xs font-black block leading-tight ${pctTextClass}`}>{pct}%</span>
          <span className="text-[10px] text-neutral-500 block leading-tight">
            {course.attendedSessions}/{course.totalSessions}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelectCourseForSimulation(course)}
          {...getVoiceProps('Cargar ' + course.courseCode + ' en el simulador SAT')}
          className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-[11px] rounded-lg border border-neutral-200 inline-flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
          title={'Simular ' + course.courseCode}
        >
          <Play className="w-3 h-3 text-neutral-500" aria-hidden="true" />
          <span>Simular</span>
        </button>
      </div>
    </div>
  );
}

const FILTER_LEVEL_TABS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'LEVEL_2_CRITICAL', label: 'Crítico (Nivel 2)' },
  { id: 'LEVEL_1_PREVENTIVE', label: 'Preventivo (Nivel 1)' },
  { id: 'PAEDIS_JUSTIFIED', label: 'Justificado PAEDIS' },
  { id: 'NONE', label: 'Sin Riesgo' },
];

export function SatMonitoring({ announce: announceProp } = {}) {
  const { announce: contextAnnounce, getVoiceProps } = useAccessibility();
  const announce = announceProp || contextAnnounce;

  const [loading, setLoading] = useState(true);
  const [satData, setSatData] = useState({ metrics: {}, students: [] });
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [activeSimulationInfo, setActiveSimulationInfo] = useState(null);

  const [interventionForm, setInterventionForm] = useState({
    assignedTo: 'Coordinación PAEDIS Duoc UC',
    status: 'IN_PROGRESS',
    notes: '',
    slaDays: '2',
  });
  const [simulationTarget, setSimulationTarget] = useState({ userId: '', courseCode: '' });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadSatAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSatAlerts();
      if (!isMountedRef.current) return;
      if (res?.success) {
        const loadedStudents = res.students || [];
        setSatData({ metrics: res.metrics || {}, students: loadedStudents });
        const firstWithCourses = loadedStudents.find((s) => s.courseAttendance && s.courseAttendance.length > 0);
        if (firstWithCourses) {
          setSimulationTarget((prev) => prev.userId ? prev : { userId: firstWithCourses.id || firstWithCourses._id, courseCode: firstWithCourses.courseAttendance[0].courseCode });
        }
      }
    } catch (err) {
      console.error('[EarlyWarningSAT] Error al cargar alertas SAT:', err);
      if (isMountedRef.current) setStatusFeedback({ type: 'error', text: 'No fue posible cargar las alertas del SAT. Intente nuevamente.' });
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSatAlerts().catch((err) => {
      console.error('[EarlyWarningSAT] Fallo al inicializar alertas SAT:', err);
    });
  }, [loadSatAlerts]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const hasDigitQuery = /\d/.test(searchQuery);
    const riskRank = { LEVEL_2_CRITICAL: 1, LEVEL_1_PREVENTIVE: 2, PAEDIS_JUSTIFIED: 3, NONE: 4 };
    const list = (satData.students || []).filter((s) => {
      const sat = s.satEvaluation || {};
      const matchesLevel = filterLevel === 'ALL' || sat.riskLevel === filterLevel;
      const name = (s.fullName || s.nombre || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || (hasDigitQuery && matchesRutQuery(s.rut, searchQuery));
      return matchesLevel && matchesSearch;
    });
    return list.sort((a, b) => {
      const rA = riskRank[a.satEvaluation?.riskLevel] || 5;
      const rB = riskRank[b.satEvaluation?.riskLevel] || 5;
      if (rA !== rB) return rA - rB;
      const getMinAttendance = (student) => {
        const courses = Array.isArray(student.courseAttendance) ? student.courseAttendance : [];
        if (courses.length === 0) return 100;
        return Math.min(...courses.map((c) => Number(c.attendancePercentage ?? 100)));
      };
      const minA = getMinAttendance(a);
      const minB = getMinAttendance(b);
      if (minA !== minB) return minA - minB;
      const nameA = (a.fullName || a.nombre || a.email || '').trim();
      const nameB = (b.fullName || b.nombre || b.email || '').trim();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }, [satData.students, filterLevel, searchQuery]);

  const currentSimStudent = useMemo(() => {
    if (!simulationTarget.userId) return null;
    return (satData.students || []).find((s) => String(s.id || s._id) === String(simulationTarget.userId));
  }, [satData.students, simulationTarget.userId]);

  const selectedSimCourse = useMemo(() => {
    const courses = currentSimStudent?.courseAttendance || [];
    if (!courses.length) return null;
    return (
      courses.find((c) => c.courseCode === simulationTarget.courseCode) ||
      courses[0] ||
      null
    );
  }, [currentSimStudent, simulationTarget.courseCode]);

  const simMetrics = useMemo(() => {
    if (!selectedSimCourse) return null;
    const totalSessions = Math.max(1, Number(selectedSimCourse.totalSessions || 20));
    const attendedSessions = Math.max(
      0,
      Math.min(totalSessions, Number(selectedSimCourse.attendedSessions ?? totalSessions))
    );
    const currentAbsences = Math.max(0, totalSessions - attendedSessions);
    const currentPct = Math.round(extractCourseAttendanceRate(selectedSimCourse) * 10) / 10;
    const consecutiveAbsences = Number(selectedSimCourse.consecutiveAbsences || 0);
    const isJustified = Boolean(selectedSimCourse.paedisJustified);
    const minRequiredSessions = Math.ceil(totalSessions * 0.75);
    const maxAllowedAbsences = Math.max(0, totalSessions - minRequiredSessions);
    const remainingAllowedAbsences = Math.max(0, maxAllowedAbsences - currentAbsences);
    const exceededAbsences = Math.max(0, currentAbsences - maxAllowedAbsences);

    const nextAttended = Math.max(0, attendedSessions - 1);
    const nextPct = Math.round((nextAttended / totalSessions) * 1000) / 10;
    const nextRemaining = Math.max(0, maxAllowedAbsences - (currentAbsences + 1));
    const nextTriggersRi = !isJustified && (nextPct < 75 || consecutiveAbsences + 1 >= 3);
    const evalStatus = evaluateAttendanceStatus(currentPct, { isJustified, mode: 'sat75' });

    return {
      totalSessions,
      attendedSessions,
      currentAbsences,
      currentPct,
      consecutiveAbsences,
      isJustified,
      maxAllowedAbsences,
      remainingAllowedAbsences,
      exceededAbsences,
      nextPct,
      nextRemaining,
      nextTriggersRi,
      status: evalStatus.status,
      statusLabel: evalStatus.label,
    };
  }, [selectedSimCourse]);

  const handleRunSimulation = useCallback(async (actionType) => {
    if (!simulationTarget.userId || !simulationTarget.courseCode) {
      setStatusFeedback({ type: 'error', text: 'Seleccione un estudiante y una asignatura para simular.' });
      return;
    }
    try {
      setIsSimulating(true);
      const res = await api.simulateSatCourse(simulationTarget.userId, { courseCode: simulationTarget.courseCode, action: actionType });
      if (!isMountedRef.current) return;
      if (res?.success) {
        if (actionType === 'reset') {
          setActiveSimulationInfo(null);
          setStatusFeedback({ type: 'success', text: 'Asistencia de ' + simulationTarget.courseCode + ' restablecida a valores base de origen.' });
          announce('Asistencia de ' + simulationTarget.courseCode + ' restablecida exitosamente.', 'polite');
        } else {
          setActiveSimulationInfo({
            courseCode: simulationTarget.courseCode,
            action: actionType,
            studentName: currentSimStudent?.fullName || currentSimStudent?.nombre || 'Estudiante',
          });
          setStatusFeedback({ type: 'success', text: 'Proyección SAP ejecutada (' + actionType + ') para ' + simulationTarget.courseCode + '.' });
          announce('Proyección SAP ejecutada para ' + simulationTarget.courseCode, 'polite');
        }
        await loadSatAlerts();
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'Error al ejecutar simulación SAP.' });
      }
    } catch (err) {
      console.error('[EarlyWarningSAT] Error en simulación:', err);
      if (isMountedRef.current) setStatusFeedback({ type: 'error', text: 'Error de conexión al simular corte semanal.' });
    } finally {
      if (isMountedRef.current) setIsSimulating(false);
    }
  }, [simulationTarget, currentSimStudent, announce, loadSatAlerts]);

  const handleOpenInterventionModal = (student) => {
    setSelectedStudentForIntervention(student);
    const existing = student.satIntervention || {};
    setInterventionForm({
      assignedTo: existing.assignedTo || 'Coordinación PAEDIS Duoc UC',
      status: existing.status || 'IN_PROGRESS',
      notes: existing.notes || '',
      slaDays: '2',
    });
  };

  const handleSaveIntervention = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedStudentForIntervention) return;
    try {
      const days = Number.parseInt(interventionForm.slaDays || 2, 10);
      const slaDeadline = new Date(Date.now() + days * 24 * 3600 * 1000);
      const res = await api.saveSatIntervention(selectedStudentForIntervention.id || selectedStudentForIntervention._id, {
        assignedTo: interventionForm.assignedTo,
        status: interventionForm.status,
        notes: interventionForm.notes,
        slaDeadline,
      });
      if (!isMountedRef.current) return;
      if (res?.success) {
        setStatusFeedback({
          type: 'success',
          text: 'Ficha 360 registrada para ' + (selectedStudentForIntervention.fullName || 'el estudiante') + '. Estado: ' + getSatLifecycleMeta(interventionForm.status).label + '.',
        });
        announce('Intervención guardada exitosamente.', 'polite');
        setSelectedStudentForIntervention(null);
        await loadSatAlerts();
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'Error al guardar la intervención.' });
      }
    } catch (err) {
      console.error('[EarlyWarningSAT] Error guardando intervención:', err);
      if (isMountedRef.current) setStatusFeedback({ type: 'error', text: 'Error de comunicación al actualizar la Ficha 360.' });
    }
  }, [selectedStudentForIntervention, interventionForm, announce, loadSatAlerts]);

  const kpiCards = [
    { id: 'kpi-monitored', label: 'Alumnos Monitoreados', value: satData.metrics?.totalMonitored ?? 0, icon: BookOpen, color: 'text-neutral-900', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', subtitle: 'Carga académica inscrita activa' },
    { id: 'kpi-critical', label: 'Nivel 2: Crítico (<75% / 3 Faltas)', value: satData.metrics?.criticalCount ?? 0, icon: AlertOctagon, color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-100', subtitle: 'En causal inminente de RI • Duoc UC - ' + DEFAULT_CAMPUS },
    { id: 'kpi-preventive', label: 'Nivel 1: Preventivo (75-79%)', value: satData.metrics?.preventiveCount ?? 0, icon: AlertTriangle, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-100', subtitle: 'Margen mínimo de faltas restante' },
    { id: 'kpi-justified', label: 'Excepción / PAEDIS Justificado', value: satData.metrics?.paedisJustifiedCount ?? 0, icon: ShieldCheck, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-100', subtitle: 'Ajuste médico o curricular formal' },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-clip">
      <section aria-labelledby="sat-header-title" className={`${ADMIN_THEME.cardSurface} space-y-3`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" aria-hidden="true" />
              <span>Sistema de Alerta Temprana (SAT) • Duoc UC - Sede Alameda</span>
            </div>
            <h2 id="sat-header-title" className={ADMIN_THEME.moduleTitle}>
              Monitoreo Determinista de Asistencia & Ficha de Intervención de Ciclo Cerrado
            </h2>
            <p className={`${ADMIN_THEME.moduleSubtitle} max-w-3xl`}>
              Cumplimiento normativo en <strong>Duoc UC - Sede Alameda</strong> (mínimo <strong>75% de asistencia por asignatura</strong> para evitar Reprobación por Inasistencia - RI) con trazabilidad de ciclo cerrado e integración a ajustes PAEDIS.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadSatAlerts().catch((err) => {
                console.error('[EarlyWarningSAT] Error actualizando alertas SAT:', err);
              });
            }}
            disabled={loading}
            {...getVoiceProps('Actualizar datos del Sistema de Alerta Temprana')}
            className="self-start md:self-auto min-h-[42px] px-4 py-2 font-semibold text-xs rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Actualizar Datos</span>
          </Button>
        </div>
      </section>

      {statusFeedback && (
        <div
          role="status"
          aria-live="polite"
          {...getVoiceProps(statusFeedback.text)}
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-2xs transition-all ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}
        >
          <div className="flex items-center gap-2.5">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" aria-hidden="true" />
            )}
            <span>{statusFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            {...getVoiceProps('Cerrar notificación')}
            className="text-neutral-500 hover:text-neutral-900 p-2 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <section aria-labelledby="sat-kpis-title" className="space-y-3">
        <h3 id="sat-kpis-title" className="sr-only">Métricas Clave del Sistema de Alerta Temprana</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.id}
                variant="interactive"
                padding="md"
                className="rounded-2xl p-5 sm:p-6 flex items-center justify-between"
                {...getVoiceProps(kpi.label + ': ' + kpi.value + '. ' + kpi.subtitle)}
              >
                <div className="space-y-1">
                  <span className={`${ADMIN_THEME.cardLabel} block`}>{kpi.label}</span>
                  <span className={`${ADMIN_THEME.kpiValue} block ${kpi.color}`}>{kpi.value}</span>
                  <span className={`${ADMIN_THEME.metaText} block`}>{kpi.subtitle}</span>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${kpi.bgColor} border ${kpi.borderColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} aria-hidden="true" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="sat-simulator-title" className={`${ADMIN_THEME.cardSurface} space-y-5`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
              <Sliders className="w-3.5 h-3.5 text-neutral-500" aria-hidden="true" />
              <span>Modo Simulación / Proyección (No Oficial)</span>
            </div>
            <h3 id="sat-simulator-title" className={`${ADMIN_THEME.sectionTitle} mt-1`}>
              Simulador Interactivo de Asistencia SAT
            </h3>
            <p className={`${ADMIN_THEME.moduleSubtitle} max-w-3xl`}>
              Evalúa en vivo el margen de <strong>faltas permitidas</strong> (umbral mínimo 75% RI) y compara el impacto de una <strong>inasistencia</strong> frente a una <strong>licencia o justificativo médico</strong>. No altera el libro de clases oficial.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              handleRunSimulation('reset').catch((err) => {
                console.error('[EarlyWarningSAT] Error restableciendo simulación:', err);
              });
            }}
            disabled={isSimulating || !selectedSimCourse}
            {...getVoiceProps('Restablecer asistencia de la asignatura seleccionada a valores base')}
            className="self-start md:self-auto shrink-0 min-h-[42px] px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-xl border border-neutral-300 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Selectores de Estudiante y Asignatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="sat-sim-student-select" className={`${ADMIN_THEME.cardLabel} block`}>
              1. Estudiante
            </label>
            <select
              id="sat-sim-student-select"
              value={simulationTarget.userId}
              onChange={(e) => {
                const uid = e.target.value;
                const stu = (satData.students || []).find((s) => String(s.id || s._id) === String(uid));
                const firstCourse = stu?.courseAttendance?.[0]?.courseCode || '';
                setSimulationTarget({ userId: uid, courseCode: firstCourse });
              }}
              {...getVoiceProps('Seleccionar estudiante para simular asistencia SAT')}
              className={`w-full ${ADMIN_THEME.controlInput}`}
            >
              {(satData.students || []).map((stu) => (
                <option key={stu.id || stu._id} value={stu.id || stu._id}>
                  {stu.fullName || stu.nombre} ({stu.career})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="sat-sim-course-select" className={`${ADMIN_THEME.cardLabel} block`}>
              2. Asignatura
            </label>
            <select
              id="sat-sim-course-select"
              value={simulationTarget.courseCode}
              onChange={(e) => setSimulationTarget({ ...simulationTarget, courseCode: e.target.value })}
              disabled={!currentSimStudent || !currentSimStudent.courseAttendance?.length}
              {...getVoiceProps('Seleccionar asignatura a evaluar en el simulador SAT')}
              className={`w-full ${ADMIN_THEME.controlInput}`}
            >
              {currentSimStudent?.courseAttendance?.map((c) => (
                <option key={c.courseCode} value={c.courseCode}>
                  {c.courseCode} - {c.courseName} ({c.attendancePercentage}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estado en vivo de la asignatura seleccionada */}
        {simMetrics && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Asistencia Actual
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${simMetrics.isJustified ? 'text-purple-800' : simMetrics.status === 'ri' ? 'text-rose-700' : simMetrics.status === 'preventive' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {simMetrics.currentPct}%
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    ({simMetrics.attendedSessions}/{simMetrics.totalSessions} clases)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {simMetrics.statusLabel}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Faltas Permitidas (Umbral 75%)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${simMetrics.remainingAllowedAbsences === 0 ? 'text-rose-700' : simMetrics.remainingAllowedAbsences === 1 ? 'text-amber-700' : 'text-slate-900'}`}>
                    {simMetrics.remainingAllowedAbsences}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    restantes de {simMetrics.maxAllowedAbsences} máx.
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {simMetrics.currentAbsences} falta(s) acumulada(s) • {simMetrics.consecutiveAbsences} consecutiva(s)
                  {simMetrics.exceededAbsences > 0 ? ` (excedido en ${simMetrics.exceededAbsences})` : ''}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Licencia / Excepción Médica
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${simMetrics.isJustified ? 'text-purple-800' : 'text-slate-800'}`}>
                    {simMetrics.isJustified ? 'Excepción Activa' : 'Sin Excepción'}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {simMetrics.isJustified
                    ? 'Inasistencias amparadas por justificativo médico o PAEDIS (no aplica RI).'
                    : 'Aplica regla reglamentaria estándar de 75% mínimo.'}
                </span>
              </div>
            </div>

            {activeSimulationInfo && (
              <div
                role="status"
                aria-live="polite"
                className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-800 font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-brand-navy shrink-0" aria-hidden="true" />
                  <span>
                    Proyección activa en <strong>{activeSimulationInfo.courseCode}</strong> ({activeSimulationInfo.studentName}) — acción aplicada: <strong>{activeSimulationInfo.action}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleRunSimulation('reset').catch((err) => {
                      console.error('[EarlyWarningSAT] Error restableciendo simulación:', err);
                    });
                  }}
                  disabled={isSimulating}
                  className="text-xs font-bold text-brand-navy hover:underline cursor-pointer"
                >
                  Restablecer valores base
                </button>
              </div>
            )}

            {/* Comparativa Interactiva: Falta vs Licencia / Justificativo Médico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                    <h4 className="text-xs sm:text-sm font-black text-neutral-900">
                      Falta (Inasistencia)
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Descuenta 1 clase asistida y suma 1 inasistencia consecutiva. Con +1 falta, la asistencia bajaría a{' '}
                    <strong>{simMetrics.nextPct}%</strong> ({simMetrics.nextRemaining} faltas permitidas restantes)
                    {simMetrics.nextTriggersRi ? ' — activaría Alerta Crítica (RI).' : '.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleRunSimulation('add_absence').catch((err) => {
                        console.error('[EarlyWarningSAT] Error ejecutando simulación:', err);
                      });
                    }}
                    disabled={isSimulating}
                    {...getVoiceProps('Simular más una falta por inasistencia')}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                  >
                    +1 Falta (Inasistencia)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRunSimulation('drop_below_75').catch((err) => {
                        console.error('[EarlyWarningSAT] Error ejecutando simulación:', err);
                      });
                    }}
                    disabled={isSimulating}
                    {...getVoiceProps('Simular caída bajo 75 por ciento, causal de reprobación por inasistencia')}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                  >
                    Simular Baja &lt;75% (RI)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-purple-700 shrink-0" aria-hidden="true" />
                    <h4 className="text-xs sm:text-sm font-black text-neutral-900">
                      Licencia / Justificativo Médico (Excepción)
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Ampara las inasistencias mediante licencia médica o ajuste PAEDIS vigente. Mantiene la trazabilidad de asistencia pero suspende la causal de Reprobación por Inasistencia (RI).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleRunSimulation('paedis_justify').catch((err) => {
                        console.error('[EarlyWarningSAT] Error ejecutando simulación:', err);
                      });
                    }}
                    disabled={isSimulating}
                    {...getVoiceProps(simMetrics.isJustified ? 'Quitar licencia o justificativo médico' : 'Aplicar licencia o justificativo médico')}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                  >
                    {simMetrics.isJustified ? 'Quitar Licencia / Excepción' : 'Aplicar Licencia / Justificativo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="sat-directory-title" className={`${ADMIN_THEME.cardSurface} space-y-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h3 id="sat-directory-title" className={ADMIN_THEME.sectionTitle}>
              Desglose de Asistencia por Asignatura ({filteredStudents.length} estudiantes)
            </h3>
            <p className={ADMIN_THEME.moduleSubtitle}>
              Ordenado por severidad reglamentaria (Rojo → Amarillo → Verde) con factor disparador explícito y ciclo cerrado.
            </p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto flex-nowrap sm:flex-wrap pb-1" role="group" aria-label="Filtrar por nivel SAT">
            {FILTER_LEVEL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterLevel(tab.id)}
                {...getVoiceProps('Filtrar alertas SAT por ' + tab.label)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap focus-visible:ring-4 focus-visible:ring-amber-400 ${filterLevel === tab.id ? 'bg-brand-navy text-white border-brand-navy' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <label htmlFor="sat-search-input" className="sr-only">
            Buscar estudiante por nombre, correo o RUT
          </label>
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="sat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, correo institucional o RUT..."
            {...getVoiceProps('Buscar estudiante por nombre, correo institucional o RUT')}
            className={`w-full pl-10 pr-4 ${ADMIN_THEME.controlInput}`}
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 font-bold space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin" aria-hidden="true" />
              <span>Cargando matriz de asistencia SAT...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 font-bold bg-neutral-50 rounded-2xl border border-neutral-200">
              No se encontraron estudiantes en este nivel o filtro de búsqueda.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const sat = student.satEvaluation || {};
              const courses = sat.coursesDetails || student.courseAttendance || [];
              const intervention = student.satIntervention || {};
              const isCritical = sat.riskLevel === 'LEVEL_2_CRITICAL';
              const isPreventive = sat.riskLevel === 'LEVEL_1_PREVENTIVE';
              const studentName = student.fullName || student.nombre;
              const studentCampus = student.campus || DEFAULT_CAMPUS;
              const badgeClass = resolveStudentSatBadgeClass(sat.riskLevel);
              const trigger = getSatTriggerFactor(student);
              const lifecycleMeta = getSatLifecycleMeta(intervention.status);
              const TriggerIcon = trigger.icon;
              const voiceMsg = 'Alerta SAT de ' + studentName + ', ' + student.career + ', ' + studentCampus + '. Estado: ' + (sat.riskLabel || 'Sin Riesgo') + '. ' + trigger.description;

              return (
                <article
                  key={student.id || student._id}
                  {...getVoiceProps(voiceMsg)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white shadow-2xs space-y-3 ${isCritical ? 'border-rose-200' : isPreventive ? 'border-amber-200' : 'border-neutral-200'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-neutral-900 text-sm sm:text-base">{studentName}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                          {sat.riskLabel || 'Sin Riesgo'}
                        </span>
                        {student.isPaedis && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                            PAEDIS
                          </span>
                        )}
                        {intervention.status && intervention.status !== 'PENDING' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                            {lifecycleMeta.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {student.career} • {studentCampus}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenInterventionModal(student)}
                      {...getVoiceProps('Abrir Ficha 360 de intervención para ' + studentName)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-navy hover:bg-brand-navyDark text-white font-bold text-xs rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold self-start sm:self-auto shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                      <span>Ficha 360</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-neutral-600 pt-1">
                    <TriggerIcon className={`w-4 h-4 shrink-0 mt-0.5 ${trigger.iconClass}`} aria-hidden="true" />
                    <span className="leading-snug">{trigger.description}</span>
                  </div>

                  {courses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {courses.map((course) => (
                        <SatCourseRow
                          key={course.courseCode}
                          course={course}
                          getVoiceProps={getVoiceProps}
                          onSelectCourseForSimulation={(c) => {
                            setSimulationTarget({ userId: student.id || student._id, courseCode: c.courseCode });
                            const msg = 'Asignatura ' + c.courseCode + ' cargada en el Simulador SAT';
                            announce(msg, 'polite');
                            const simEl = document.getElementById('sat-simulator-title');
                            if (simEl) simEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Modal Ficha 360 de Intervención */}
      <Modal
        isOpen={Boolean(selectedStudentForIntervention)}
        onClose={() => setSelectedStudentForIntervention(null)}
        title={
          selectedStudentForIntervention
            ? `Ficha 360 de Intervención: ${selectedStudentForIntervention.fullName || selectedStudentForIntervention.nombre}`
            : 'Ficha 360 de Intervención'
        }
        size="lg"
      >
        {selectedStudentForIntervention && (
          <form onSubmit={handleSaveIntervention} className="space-y-4 text-xs sm:text-sm">
            <p className="text-xs text-neutral-500">
              {selectedStudentForIntervention.email} • {selectedStudentForIntervention.career}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="sat-int-status" className="text-xs font-bold text-neutral-700">
                  Etapa del Ciclo Cerrado SAT
                </label>
                <select
                  id="sat-int-status"
                  value={interventionForm.status}
                  onChange={(e) => setInterventionForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-semibold text-neutral-900"
                >
                  {SAT_LIFECYCLE_STATES.map((s) => (
                    <option key={s.id} value={s.id}>
                      Etapa {s.stepNumber}: {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="sat-int-sla" className="text-xs font-bold text-neutral-700">
                  Plazo SLA (días)
                </label>
                <select
                  id="sat-int-sla"
                  value={interventionForm.slaDays}
                  onChange={(e) => setInterventionForm((prev) => ({ ...prev, slaDays: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-semibold text-neutral-900"
                >
                  <option value="1">1 día (Urgente)</option>
                  <option value="2">2 días (Estándar SAT)</option>
                  <option value="5">5 días (Seguimiento)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="sat-int-assigned" className="text-xs font-bold text-neutral-700">
                  Responsable de Gestión
                </label>
                <input
                  id="sat-int-assigned"
                  type="text"
                  value={interventionForm.assignedTo}
                  onChange={(e) => setInterventionForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-semibold text-neutral-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="sat-int-notes" className="text-xs font-bold text-neutral-700">
                Bitácora de Acuerdos y Derivación
              </label>
              <textarea
                id="sat-int-notes"
                rows={3}
                value={interventionForm.notes}
                onChange={(e) => setInterventionForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Registra contacto, compromisos académicos o derivación..."
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium text-neutral-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button variant="secondary" size="sm" onClick={() => setSelectedStudentForIntervention(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <FileSignature className="w-4 h-4" aria-hidden="true" />
                <span>Guardar Ficha 360</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default SatMonitoring;