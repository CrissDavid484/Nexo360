import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Play,
  Sparkles,
  BookOpen,
  HeartHandshake,
  X,
  Search,
  FileText,
  ChevronRight,
  Clock,
  RotateCcw,
  PhoneCall,
  FileSignature,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import {
  evaluateAttendanceStatus,
  getAttendanceColorClasses,
  getSatRiskBadgeMeta,
  extractCourseAttendanceRate,
} from '../../utils/satUtils';
import { DEFAULT_CAMPUS, matchesRutQuery } from '../../utils/studentUtils';

const SAT_ROW_SURFACE = {
  justified: 'bg-purple-50 border-purple-200',
  ri: 'bg-rose-50 border-rose-200',
  preventive: 'bg-amber-50 border-amber-200',
  normal: 'bg-emerald-50 border-emerald-200',
};

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
  return `${meta.badgeClass} border`;
}

/**
 * Estados del Flujo de Ciclo Cerrado SAT
 */
const SAT_LIFECYCLE_STATES = [
  {
    id: 'PENDING',
    label: 'Pendiente',
    stepNumber: 1,
    description: 'Alerta generada, contacto pendiente',
    badgeClass: 'bg-rose-100 text-rose-950 border border-rose-300',
    activeClass: 'bg-rose-50 text-rose-950 border-rose-400 ring-2 ring-rose-400',
  },
  {
    id: 'IN_PROGRESS',
    label: 'En gestión / Contactado',
    stepNumber: 2,
    description: 'Estudiante contactado y en seguimiento activo',
    badgeClass: 'bg-amber-100 text-amber-950 border border-amber-300',
    activeClass: 'bg-amber-50 text-amber-950 border-amber-400 ring-2 ring-amber-400',
  },
  {
    id: 'AGREEMENT',
    label: 'Acuerdo o Derivación',
    stepNumber: 3,
    description: 'Compromiso académico o derivación asistencial firmada',
    badgeClass: 'bg-blue-100 text-blue-950 border border-blue-300',
    activeClass: 'bg-blue-50 text-blue-950 border-blue-400 ring-2 ring-blue-400',
  },
  {
    id: 'RESOLVED',
    label: 'Resuelta',
    stepNumber: 4,
    description: 'Caso resuelto o justificación curricular aprobada',
    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    activeClass: 'bg-emerald-50 text-emerald-950 border-emerald-400 ring-2 ring-emerald-400',
  },
];

function getSatLifecycleMeta(status) {
  const norm = String(status || '').toUpperCase();
  return SAT_LIFECYCLE_STATES.find((s) => s.id === norm) || SAT_LIFECYCLE_STATES[0];
}

function getLifecycleStepIndex(status) {
  const norm = String(status || '').toUpperCase();
  const idx = SAT_LIFECYCLE_STATES.findIndex((s) => s.id === norm);
  return idx >= 0 ? idx : 0;
}

/**
 * Calcula con precisión el factor disparador/causa de la alerta
 * para no depender únicamente del color (WCAG 1.4.1).
 */
function getSatTriggerFactor(student) {
  const sat = student.satEvaluation || {};
  const courses = sat.coursesDetails || student.courseAttendance || [];

  if (sat.riskLevel === 'LEVEL_2_CRITICAL') {
    const criticalCourse =
      courses.find((c) => {
        const pct = Number(c.attendancePercentage ?? 100);
        const abs = Number(c.consecutiveAbsences || 0);
        return !c.paedisJustified && (pct < 75 || abs >= 3 || c.missedKeySession);
      }) || courses[0];

    const pct = criticalCourse
      ? Math.round(Number(criticalCourse.attendancePercentage ?? 0) * 10) / 10
      : 0;
    const abs = criticalCourse ? Number(criticalCourse.consecutiveAbsences || 0) : 0;

    let triggerReason = `${criticalCourse?.courseCode || 'Asignatura'} (${criticalCourse?.courseName || 'Ramo'}): ${pct}% de asistencia (bajo el 75% exigido).`;
    if (abs >= 3) {
      triggerReason += ` Acumula ${abs} inasistencias consecutivas.`;
    }
    if (criticalCourse?.missedKeySession) {
      triggerReason += ' Falta a evaluación o certamen clave institucional.';
    }

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
    const prevCourse =
      courses.find((c) => {
        const pct = Number(c.attendancePercentage ?? 100);
        const abs = Number(c.consecutiveAbsences || 0);
        return !c.paedisJustified && ((pct >= 75 && pct <= 79) || abs === 2);
      }) || courses[0];

    const pct = prevCourse
      ? Math.round(Number(prevCourse.attendancePercentage ?? 0) * 10) / 10
      : 0;

    return {
      severity: 'PREVENTIVE',
      title: 'Factor Disparador: Alerta Preventiva (Margen Crítico Restante)',
      courseCode: prevCourse?.courseCode || '',
      courseName: prevCourse?.courseName || '',
      attendancePct: pct,
      description: `${prevCourse?.courseCode || 'Asignatura'} (${prevCourse?.courseName || 'Ramo'}): ${pct}% de asistencia (zona de riesgo preventivo 75% a 79%). Requiere acompañamiento temprano.`,
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
      description:
        'Inasistencias amparadas en expediente confidencial de ajustes razonables vigentes (Ley N° 21.719).',
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
    description:
      'Todas las asignaturas monitoreadas presentan asistencia regular superior al 80% reglamentario.',
    boxClass: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    badgeClass: 'bg-emerald-700 text-white',
    icon: CheckCircle2,
    iconClass: 'text-emerald-700',
  };
}

/**
 * Fila modular accesible para renderizar cada asignatura monitoreada en el SAT
 */
function SatCourseRow({ course, onSelectCourseForSimulation, getVoiceProps }) {
  const rawPct = extractCourseAttendanceRate(course);
  const pct = Math.round(rawPct * 10) / 10;
  const isJustified = Boolean(course.paedisJustified);
  const { status, label } = evaluateAttendanceStatus(pct, { isJustified, mode: 'sat75' });
  const color = getAttendanceColorClasses(pct, isJustified, 'sat75');
  const surfaceClass = SAT_ROW_SURFACE[status] || SAT_ROW_SURFACE.normal;
  const consecutiveAbs = Number(course.consecutiveAbsences || 0);

  return (
    <div
      {...getVoiceProps(
        `Asignatura ${course.courseCode}, ${course.courseName}. ${label}, asistencia ${pct} por ciento, ${consecutiveAbs} inasistencias consecutivas`
      )}
      className={`p-3.5 rounded-2xl border transition-all ${surfaceClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-black text-xs px-2 py-0.5 rounded bg-white/90 border border-slate-300 text-slate-800 font-mono">
            {course.courseCode}
          </span>
          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
            {course.courseName}
          </span>

          {/* Etiquetas textuales no dependientes de color */}
          {status === 'ri' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-700 text-white">
              <AlertOctagon className="w-3 h-3" aria-hidden="true" />
              Causal de RI (&lt;75%)
            </span>
          )}
          {status === 'preventive' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 font-black">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              Preventivo (75-79%)
            </span>
          )}
          {status === 'normal' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              Regular (≥80%)
            </span>
          )}
          {isJustified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-200 text-purple-950 border border-purple-300">
              <HeartHandshake className="w-3 h-3" aria-hidden="true" />
              Justificado PAEDIS
            </span>
          )}
          {course.missedKeySession && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-950 border border-rose-300">
              Falta a Certamen
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <span>
            Asistencia: <strong>{pct}%</strong> ({course.attendedSessions}/{course.totalSessions} clases)
          </span>
          <span>
            Inasistencias consecutivas:{' '}
            <strong className={consecutiveAbs >= 3 ? 'text-rose-700 font-black' : ''}>
              {consecutiveAbs}
            </strong>
          </span>
          {course.lateCount > 0 && (
            <span>
              Atrasos: <strong>{course.lateCount}</strong>
            </span>
          )}
        </div>

        {/* Barra de Progreso Accesible */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Asistencia de ${course.courseName}: ${pct}%`}
          className="w-full bg-slate-200/90 h-2 rounded-full overflow-hidden mt-1.5"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isJustified ? 'bg-purple-600' : color.barClass
            }`}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelectCourseForSimulation(course)}
        {...getVoiceProps(`Cargar ${course.courseCode} en el simulador de proyección SAP`)}
        className="shrink-0 min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 shadow-2xs transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400"
        title={`Cargar ${course.courseCode} en el Entorno de Simulación SAP (no oficial)`}
      >
        <Play className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
        <span>Proyectar en Simulador</span>
      </button>
    </div>
  );
}

const SIMULATION_ACTIONS = [
  {
    id: 'act-add-absence',
    label: '+1 Falta Consecutiva',
    action: 'add_absence',
    btnClass: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'act-drop-ri',
    label: 'Simular Baja <75% (RI)',
    action: 'drop_below_75',
    btnClass: 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'act-justify',
    label: 'Excepción PAEDIS',
    action: 'paedis_justify',
    btnClass: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300',
  },
];

const FILTER_LEVEL_TABS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'LEVEL_2_CRITICAL', label: 'Crítico (Nivel 2)' },
  { id: 'LEVEL_1_PREVENTIVE', label: 'Preventivo (Nivel 1)' },
  { id: 'PAEDIS_JUSTIFIED', label: 'Justificado PAEDIS' },
  { id: 'NONE', label: 'Sin Riesgo' },
];

/**
 * Componente Principal del Sistema de Alerta Temprana (SAT)
 */
export function EarlyWarningSatSection({ announce: announceProp } = {}) {
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
    tutorPaedisAsignado: 'No',
  });

  const [simulationTarget, setSimulationTarget] = useState({
    userId: '',
    courseCode: '',
  });

  const isMountedRef = useRef(true);
  const interventionModalRef = useRef(null);
  const interventionCloseBtnRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useAccessibleModal({
    isOpen: Boolean(selectedStudentForIntervention),
    onClose: () => setSelectedStudentForIntervention(null),
    containerRef: interventionModalRef,
    initialFocusRef: interventionCloseBtnRef,
  });

  const loadSatAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSatAlerts();
      if (!isMountedRef.current) return;

      if (res?.success) {
        const loadedStudents = res.students || [];
        setSatData({
          metrics: res.metrics || {},
          students: loadedStudents,
        });

        const firstWithCourses = loadedStudents.find(
          (s) => s.courseAttendance && s.courseAttendance.length > 0
        );
        if (firstWithCourses) {
          setSimulationTarget((prev) =>
            prev.userId
              ? prev
              : {
                  userId: firstWithCourses.id || firstWithCourses._id,
                  courseCode: firstWithCourses.courseAttendance[0].courseCode,
                }
          );
        }
      }
    } catch (err) {
      console.error('[EarlyWarningSAT] Error al cargar alertas SAT:', err);
      if (isMountedRef.current) {
        setStatusFeedback({
          type: 'error',
          text: 'No fue posible cargar las alertas del SAT. Intente nuevamente.',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSatAlerts().catch((err) => {
      console.error('[EarlyWarningSAT] Fallo al inicializar alertas SAT:', err);
    });
  }, [loadSatAlerts]);

  /**
   * Ordenación estricta por severidad (Rojo -> Amarillo -> Púrpura -> Verde)
   * y luego por menor porcentaje de asistencia.
   */
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const hasDigitQuery = /\d/.test(searchQuery);

    const riskRank = {
      LEVEL_2_CRITICAL: 1,
      LEVEL_1_PREVENTIVE: 2,
      PAEDIS_JUSTIFIED: 3,
      NONE: 4,
    };

    const list = (satData.students || []).filter((s) => {
      const sat = s.satEvaluation || {};
      const matchesLevel = filterLevel === 'ALL' || sat.riskLevel === filterLevel;

      const name = (s.fullName || s.nombre || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        (hasDigitQuery && matchesRutQuery(s.rut, searchQuery));

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
    return (satData.students || []).find(
      (s) => String(s.id || s._id) === String(simulationTarget.userId)
    );
  }, [satData.students, simulationTarget.userId]);

  const handleRunSimulation = async (actionType) => {
    if (!simulationTarget.userId || !simulationTarget.courseCode) {
      setStatusFeedback({
        type: 'error',
        text: 'Seleccione un estudiante y una asignatura para simular.',
      });
      return;
    }

    try {
      setIsSimulating(true);
      const res = await api.simulateSatCourse(simulationTarget.userId, {
        courseCode: simulationTarget.courseCode,
        action: actionType,
      });

      if (!isMountedRef.current) return;

      if (res?.success) {
        if (actionType === 'reset') {
          setActiveSimulationInfo(null);
          setStatusFeedback({
            type: 'success',
            text: `Asistencia de ${simulationTarget.courseCode} restablecida a valores base de origen.`,
          });
          announce(`Asistencia de ${simulationTarget.courseCode} restablecida exitosamente.`, 'polite');
        } else {
          setActiveSimulationInfo({
            courseCode: simulationTarget.courseCode,
            action: actionType,
            studentName: currentSimStudent?.fullName || currentSimStudent?.nombre || 'Estudiante',
          });
          setStatusFeedback({
            type: 'success',
            text: `Proyección SAP ejecutada (${actionType}) para ${simulationTarget.courseCode}.`,
          });
          announce(`Proyección SAP ejecutada para ${simulationTarget.courseCode}`, 'polite');
        }
        await loadSatAlerts();
      } else {
        setStatusFeedback({
          type: 'error',
          text: res?.message || 'Error al ejecutar simulación SAP.',
        });
      }
    } catch (err) {
      console.error('[EarlyWarningSAT] Error en simulación:', err);
      if (isMountedRef.current) {
        setStatusFeedback({
          type: 'error',
          text: 'Error de conexión al simular corte semanal.',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSimulating(false);
      }
    }
  };

  const handleOpenInterventionModal = (student) => {
    setSelectedStudentForIntervention(student);
    const existing = student.satIntervention || {};
    const hasTutor =
      existing.tutorPaedisAsignado ||
      student.tutorPaedisAsignado ||
      (student.isPaedis ? 'Sí' : 'No');

    setInterventionForm({
      assignedTo: existing.assignedTo || 'Coordinación PAEDIS Duoc UC',
      status: existing.status || 'IN_PROGRESS',
      notes: existing.notes || '',
      slaDays: '2',
      tutorPaedisAsignado: hasTutor === 'Sí' || hasTutor === true ? 'Sí' : 'No',
    });
  };

  const handleSaveIntervention = async (e) => {
    e.preventDefault();
    if (!selectedStudentForIntervention) return;

    try {
      const days = Number.parseInt(interventionForm.slaDays || 2, 10);
      const slaDeadline = new Date(Date.now() + days * 24 * 3600 * 1000);

      const res = await api.saveSatIntervention(
        selectedStudentForIntervention.id || selectedStudentForIntervention._id,
        {
          assignedTo: interventionForm.assignedTo,
          status: interventionForm.status,
          notes: interventionForm.notes,
          slaDeadline,
          tutorPaedisAsignado: interventionForm.tutorPaedisAsignado,
        }
      );

      if (!isMountedRef.current) return;

      if (res?.success) {
        setStatusFeedback({
          type: 'success',
          text: `Ficha 360 registrada para ${selectedStudentForIntervention.fullName || 'el estudiante'}. Estado: ${getSatLifecycleMeta(interventionForm.status).label}.`,
        });
        announce('Intervención guardada exitosamente.', 'polite');
        setSelectedStudentForIntervention(null);
        await loadSatAlerts();
      } else {
        setStatusFeedback({
          type: 'error',
          text: res?.message || 'Error al guardar la intervención.',
        });
      }
    } catch (err) {
      console.error('[EarlyWarningSAT] Error guardando intervención:', err);
      if (isMountedRef.current) {
        setStatusFeedback({
          type: 'error',
          text: 'Error de comunicación al actualizar la Ficha 360.',
        });
      }
    }
  };

  const kpiCards = [
    {
      id: 'kpi-monitored',
      label: 'Alumnos Monitoreados',
      value: satData.metrics?.totalMonitored ?? 0,
      icon: BookOpen,
      color: 'text-slate-900',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      subtitle: 'Carga académica inscrita activa',
    },
    {
      id: 'kpi-critical',
      label: 'Nivel 2: Crítico (<75% / 3 Faltas)',
      value: satData.metrics?.criticalCount ?? 0,
      icon: AlertOctagon,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      subtitle: `En causal inminente de RI • Duoc UC - ${DEFAULT_CAMPUS}`,
    },
    {
      id: 'kpi-preventive',
      label: 'Nivel 1: Preventivo (75-79%)',
      value: satData.metrics?.preventiveCount ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      subtitle: 'Margen mínimo de faltas restante',
    },
    {
      id: 'kpi-justified',
      label: 'Excepción / PAEDIS Justificado',
      value: satData.metrics?.paedisJustifiedCount ?? 0,
      icon: ShieldCheck,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      subtitle: 'Ajuste médico o curricular formal',
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-clip">
      {/* 1. CABECERA INSTITUCIONAL */}
      <section
        aria-labelledby="sat-header-title"
        className="bg-[#002B49] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/20 space-y-3 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-[#002B49]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sistema de Alerta Temprana (SAT) • Duoc UC - Sede Alameda</span>
            </div>
            <h2 id="sat-header-title" className="text-xl sm:text-2xl font-black tracking-tight">
              Monitoreo Determinista de Asistencia &amp; Ficha de Intervención de Ciclo Cerrado
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed">
              Cumplimiento normativo en <strong>Duoc UC - Sede Alameda</strong> (mínimo <strong>75% de asistencia por asignatura</strong> para evitar Reprobación por Inasistencia - RI) con trazabilidad de ciclo cerrado e integración a ajustes PAEDIS.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadSatAlerts().catch((err) => {
                console.error('[EarlyWarningSAT] Error actualizando alertas SAT:', err);
              });
            }}
            disabled={loading}
            {...getVoiceProps('Actualizar datos del Sistema de Alerta Temprana')}
            className="self-start md:self-auto min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Actualizar Datos</span>
          </button>
        </div>
      </section>

      {/* ALERTA DE FEEDBACK */}
      {statusFeedback && (
        <div
          role="status"
          aria-live="polite"
          {...getVoiceProps(statusFeedback.text)}
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-2xs transition-all ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
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
            className="text-slate-500 hover:text-slate-900 p-2 rounded-lg focus-visible:ring-4 focus-visible:ring-amber-400 min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. TARJETAS KPI RESUMEN */}
      <section aria-labelledby="sat-kpis-title" className="space-y-3">
        <h3 id="sat-kpis-title" className="sr-only">
          Métricas Clave del Sistema de Alerta Temprana
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.id}
                {...getVoiceProps(`${kpi.label}: ${kpi.value}. ${kpi.subtitle}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {kpi.label}
                  </span>
                  <span className={`text-3xl font-black block tracking-tight ${kpi.color}`}>
                    {kpi.value}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 block">
                    {kpi.subtitle}
                  </span>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl ${kpi.bgColor} border ${kpi.borderColor} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${kpi.color}`} aria-hidden="true" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. ENTORNO DE SIMULACIÓN Y PROYECCIÓN SAP (AISLADO / NO OFICIAL) */}
      <section
        aria-labelledby="sat-simulator-title"
        className="bg-amber-50/70 p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-xs space-y-4 relative overflow-hidden"
      >
        <div className="border-b border-amber-200/90 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-200 border border-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-800" aria-hidden="true" />
              <span>Modo Simulación / Proyección (No Oficial)</span>
            </div>
            <h3 id="sat-simulator-title" className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Simulador de Escenarios de Asistencia y Corte Semanal SAP
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 max-w-3xl leading-relaxed">
              Entorno aislado para proyectar escenarios de inasistencias y verificar los protocolos automáticos del motor SAT. <strong>No modifica los registros curriculares oficiales</strong> del libro de clases.
            </p>
          </div>

          {/* Acciones de control y restablecimiento */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                handleRunSimulation('reset').catch((err) => {
                  console.error('[EarlyWarningSAT] Error restableciendo simulación:', err);
                });
              }}
              disabled={isSimulating}
              {...getVoiceProps('Restablecer asistencia a valores base de origen')}
              className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>Restablecer Asistencia</span>
            </button>
            <button
              type="button"
              onClick={() => {
                loadSatAlerts().catch((err) => {
                  console.error('[EarlyWarningSAT] Error recargando alertas:', err);
                });
              }}
              disabled={loading}
              {...getVoiceProps('Salir de la simulación y recargar datos oficiales')}
              className="min-h-[44px] px-3.5 py-2 bg-[#002B49] hover:bg-[#003b66] text-white text-xs font-bold rounded-xl shadow-2xs inline-flex items-center gap-1.5 cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Salir de Simulación</span>
            </button>
          </div>
        </div>

        {activeSimulationInfo && (
          <div className="p-3 bg-amber-100/90 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-950 font-bold">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-amber-800" aria-hidden="true" />
              <span>
                Simulación activa en curso: <strong>{activeSimulationInfo.courseCode}</strong> para{' '}
                <strong>{activeSimulationInfo.studentName}</strong> (acción: {activeSimulationInfo.action}).
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              *Proyección temporal en memoria
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <label htmlFor="sat-sim-student-select" className="text-xs font-bold text-slate-800">
              1. Seleccionar Estudiante:
            </label>
            <select
              id="sat-sim-student-select"
              value={simulationTarget.userId}
              onChange={(e) => {
                const uid = e.target.value;
                const stu = (satData.students || []).find(
                  (s) => String(s.id || s._id) === String(uid)
                );
                const firstCourse = stu?.courseAttendance?.[0]?.courseCode || '';
                setSimulationTarget({ userId: uid, courseCode: firstCourse });
              }}
              {...getVoiceProps('Seleccionar estudiante para simular corte semanal SAP')}
              className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 transition-all"
            >
              {(satData.students || []).map((stu) => (
                <option key={stu.id || stu._id} value={stu.id || stu._id}>
                  {stu.fullName || stu.nombre} ({stu.career})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="sat-sim-course-select" className="text-xs font-bold text-slate-800">
              2. Asignatura a Evaluar:
            </label>
            <select
              id="sat-sim-course-select"
              value={simulationTarget.courseCode}
              onChange={(e) =>
                setSimulationTarget({ ...simulationTarget, courseCode: e.target.value })
              }
              disabled={!currentSimStudent || !currentSimStudent.courseAttendance?.length}
              {...getVoiceProps('Seleccionar asignatura a evaluar en simulador SAP')}
              className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 transition-all"
            >
              {currentSimStudent?.courseAttendance?.map((c) => (
                <option key={c.courseCode} value={c.courseCode}>
                  {c.courseCode} - {c.courseName} ({c.attendancePercentage}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {SIMULATION_ACTIONS.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  handleRunSimulation(btn.action).catch((err) => {
                    console.error('[EarlyWarningSAT] Error ejecutando simulación:', err);
                  });
                }}
                disabled={isSimulating}
                {...getVoiceProps(`Simular acción SAP: ${btn.label}`)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400 ${btn.btnClass}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TABLA DE MONITOREO Y LISTADO DE ESTUDIANTES */}
      <section
        aria-labelledby="sat-directory-title"
        className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 id="sat-directory-title" className="text-xl font-black text-slate-900">
              Desglose de Asistencia por Asignatura ({filteredStudents.length} estudiantes)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Ordenado por severidad reglamentaria (Rojo → Amarillo → Verde) con factor disparador explícito y ciclo cerrado.
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 overflow-x-auto w-full flex-nowrap sm:flex-wrap pb-1"
            role="group"
            aria-label="Filtrar por nivel SAT"
          >
            {FILTER_LEVEL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterLevel(tab.id)}
                {...getVoiceProps(`Filtrar alertas SAT por ${tab.label}`)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap focus-visible:ring-4 focus-visible:ring-amber-400 ${
                  filterLevel === tab.id
                    ? 'bg-[#002B49] text-white border-[#002B49]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador Rápido */}
        <div className="relative">
          <label htmlFor="sat-search-input" className="sr-only">
            Buscar estudiante por nombre, correo o RUT
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            id="sat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, correo institucional o RUT..."
            {...getVoiceProps('Buscar estudiante por nombre, correo institucional o RUT')}
            className="w-full min-h-[44px] pl-10 pr-4 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-xs sm:text-sm font-medium transition-all"
          />
        </div>

        {/* Lista de Fichas de Estudiantes */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin" aria-hidden="true" />
              <span>Cargando matriz de asistencia SAT...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
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
              const currentStepIdx = getLifecycleStepIndex(intervention.status);
              const TriggerIcon = trigger.icon;

              const hasTutorPaedis =
                student.tutorPaedisAsignado === 'Sí' ||
                intervention.tutorPaedisAsignado === 'Sí' ||
                student.isPaedis;

              return (
                <article
                  key={student.id || student._id}
                  {...getVoiceProps(
                    `Alerta SAT de ${studentName}, ${student.career}, ${studentCampus}. Estado: ${
                      sat.riskLabel || 'Sin Riesgo'
                    }. Factor disparador: ${trigger.title}. ${trigger.description}`
                  )}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all bg-white shadow-2xs space-y-4 ${
                    isCritical
                      ? 'border-rose-300'
                      : isPreventive
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Encabezado del estudiante */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900 text-base">{studentName}</span>
                        <span className="text-xs text-slate-500 font-mono">({student.rut})</span>
                        {student.isPaedis && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
                            Estudiante PAEDIS
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeClass}`}
                        >
                          {sat.riskLabel || 'Sin Riesgo'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                            hasTutorPaedis
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Tutor PAEDIS: <strong>{hasTutorPaedis ? 'Sí' : 'No'}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {student.career} • {studentCampus} • {student.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenInterventionModal(student)}
                      {...getVoiceProps(`Abrir Ficha 360 de intervención para ${studentName}`)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 bg-[#002B49] hover:bg-[#003b66] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400 self-start sm:self-auto shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                      <span>Ficha 360 de Intervención</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* BLOQUE ACCESIBLE DE FACTOR DISPARADOR (No solo color) */}
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${trigger.boxClass}`}
                    role="note"
                    aria-label={trigger.title}
                  >
                    <TriggerIcon className={`w-5 h-5 shrink-0 mt-0.5 ${trigger.iconClass}`} aria-hidden="true" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black uppercase tracking-wider text-[11px] block">
                          {trigger.title}
                        </span>
                      </div>
                      <p className="font-medium leading-relaxed">
                        {trigger.description}
                      </p>
                    </div>
                  </div>

                  {/* FLUJO DE SEGUIMIENTO DE CICLO CERRADO SAT */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-600" aria-hidden="true" />
                        <span className="font-black text-slate-800">
                          Flujo de Ciclo Cerrado SAT:
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase ${lifecycleMeta.badgeClass}`}>
                          {lifecycleMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        <span>
                          Responsable: <strong>{intervention.assignedTo || 'Coordinación PAEDIS Duoc UC'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Stepper visual y accesible */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1" role="list" aria-label="Progreso de la intervención">
                      {SAT_LIFECYCLE_STATES.map((state, idx) => {
                        const isCurrent = (intervention.status || 'PENDING') === state.id;
                        const isPast = currentStepIdx >= idx;
                        return (
                          <div
                            key={state.id}
                            role="listitem"
                            {...getVoiceProps(
                              `Etapa ${idx + 1} de 4: ${state.label}. ${
                                isCurrent ? 'Etapa actual' : isPast ? 'Completada' : 'Pendiente'
                              }`
                            )}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? `${state.activeClass} font-black`
                                : isPast
                                ? 'bg-white border-slate-300 text-slate-800 font-bold'
                                : 'bg-slate-100/60 border-slate-200 text-slate-400 font-medium'
                            }`}
                          >
                            <span className="text-[10px] block opacity-75">Etapa {idx + 1}</span>
                            <span className="text-xs truncate block">{state.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {intervention.notes && (
                      <div className="pt-1.5 border-t border-slate-200/80 text-xs text-slate-600">
                        <span className="font-bold text-slate-700">Bitácora de Acuerdos: </span>
                        <span className="italic">&ldquo;{intervention.notes}&rdquo;</span>
                      </div>
                    )}
                  </div>

                  {/* Asignaturas Monitoreadas */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Asignaturas del Periodo Monitoreadas ({courses.length}):
                    </span>
                    {courses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Sin cursos registrados.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {courses.map((course) => (
                          <SatCourseRow
                            key={course.courseCode}
                            course={course}
                            getVoiceProps={getVoiceProps}
                            onSelectCourseForSimulation={(c) => {
                              setSimulationTarget({
                                userId: student.id || student._id,
                                courseCode: c.courseCode,
                              });
                              announce(`Asignatura ${c.courseCode} cargada en el Entorno de Simulación SAP`, 'polite');
                              const simEl = document.getElementById('sat-simulator-title');
                              if (simEl) {
                                simEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* 5. MODAL DE FICHA 360 DE INTERVENCIÓN SAT */}
      {selectedStudentForIntervention && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-sat-intervention-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div
            ref={interventionModalRef}
            className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                  Protocolo de Acompañamiento SAT / PAEDIS • Duoc UC - Sede Alameda
                </span>
                <h4 id="modal-sat-intervention-title" className="text-xl font-black text-slate-900">
                  Ficha 360:{' '}
                  {selectedStudentForIntervention.fullName || selectedStudentForIntervention.nombre}
                </h4>
              </div>
              <button
                ref={interventionCloseBtnRef}
                type="button"
                onClick={() => setSelectedStudentForIntervention(null)}
                {...getVoiceProps('Cerrar Ficha 360')}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:ring-4 focus-visible:ring-amber-400 cursor-pointer inline-flex items-center justify-center"
                aria-label="Cerrar Ficha 360"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del estudiante */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">RUT Institucional:</span>
                  <strong className="text-slate-900 font-mono">
                    {selectedStudentForIntervention.rut}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Carrera:</span>
                  <strong className="text-slate-900">{selectedStudentForIntervention.career}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Teléfono de Contacto:</span>
                  <strong className="text-slate-900">{selectedStudentForIntervention.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tutor PAEDIS Asignado:</span>
                  <strong className="text-slate-900">
                    {interventionForm.tutorPaedisAsignado || 'No'}
                  </strong>
                </div>
              </div>

              {selectedStudentForIntervention.isPaedis && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[11px] font-black uppercase text-purple-900 block">
                    Ajustes Razonables PAEDIS Vigentes:
                  </span>
                  <p className="text-slate-700">
                    {selectedStudentForIntervention.diagnosticoDeclarado ||
                      'Ajustes metodológicos y de evaluación aprobados'}
                  </p>
                </div>
              )}
            </div>

            {/* Formulario de Intervención */}
            <form
              onSubmit={(e) => {
                handleSaveIntervention(e).catch((err) => {
                  console.error('[EarlyWarningSAT] Error enviando Ficha 360:', err);
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label htmlFor="sat-assignee" className="text-xs font-bold text-slate-700">
                    Responsable Asignado:
                  </label>
                  <select
                    id="sat-assignee"
                    value={interventionForm.assignedTo}
                    onChange={(e) =>
                      setInterventionForm({ ...interventionForm, assignedTo: e.target.value })
                    }
                    {...getVoiceProps('Seleccionar responsable asignado para la intervención')}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#002B49] transition-all"
                  >
                    <option value="Coordinación PAEDIS Duoc UC">
                      Coordinación PAEDIS Duoc UC
                    </option>
                    <option value="Equipo Tutor PAEDIS Sede Alameda">
                      Equipo Tutor PAEDIS Sede Alameda
                    </option>
                    <option value="Consejería Académica Sede Alameda">
                      Consejería Académica Sede Alameda
                    </option>
                    <option value="Dirección de Carrera">Dirección de Carrera</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sat-tutor-paedis" className="text-xs font-bold text-slate-700">
                    Tutor PAEDIS Asignado:
                  </label>
                  <select
                    id="sat-tutor-paedis"
                    value={interventionForm.tutorPaedisAsignado}
                    onChange={(e) =>
                      setInterventionForm({
                        ...interventionForm,
                        tutorPaedisAsignado: e.target.value,
                      })
                    }
                    {...getVoiceProps('Indicar si tiene tutor PAEDIS asignado: Sí o No')}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#002B49] transition-all"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sat-status-select" className="text-xs font-bold text-slate-700">
                    Estado de Ciclo Cerrado:
                  </label>
                  <select
                    id="sat-status-select"
                    value={interventionForm.status}
                    onChange={(e) =>
                      setInterventionForm({ ...interventionForm, status: e.target.value })
                    }
                    {...getVoiceProps('Seleccionar estado de la intervención SAT')}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#002B49] transition-all"
                  >
                    <option value="PENDING">1. Pendiente (Alerta inicial generada)</option>
                    <option value="IN_PROGRESS">2. En gestión / Contactado</option>
                    <option value="AGREEMENT">3. Acuerdo o Derivación</option>
                    <option value="RESOLVED">4. Resuelta (Caso regularizado / justificado)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="sat-sla-deadline"
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Plazo de Respuesta SLA:</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Estándar institucional: 48 horas
                  </span>
                </label>
                <select
                  id="sat-sla-deadline"
                  value={interventionForm.slaDays}
                  onChange={(e) =>
                    setInterventionForm({ ...interventionForm, slaDays: e.target.value })
                  }
                  {...getVoiceProps('Seleccionar plazo de respuesta SLA')}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#002B49] transition-all"
                >
                  <option value="1">24 Horas (Urgente - Alerta Crítica Nivel 2)</option>
                  <option value="2">48 Horas (Estándar UAP / PAEDIS)</option>
                  <option value="3">72 Horas (Preventivo Nivel 1)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="sat-intervention-notes"
                  className="text-xs font-bold text-slate-700"
                >
                  Bitácora de Contacto y Acuerdos:
                </label>
                <textarea
                  id="sat-intervention-notes"
                  rows={3}
                  value={interventionForm.notes}
                  onChange={(e) =>
                    setInterventionForm({ ...interventionForm, notes: e.target.value })
                  }
                  {...getVoiceProps('Bitácora de contacto y acuerdos')}
                  placeholder="Detalla las gestiones realizadas: llamada telefónica, coordinación con docentes, aplicación de ajustes PAEDIS..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#002B49] transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForIntervention(null)}
                  {...getVoiceProps('Cancelar edición de Ficha 360')}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  {...getVoiceProps('Guardar Ficha 360 de intervención')}
                  className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#003b66] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400 inline-flex items-center gap-2"
                >
                  <FileSignature className="w-4 h-4 text-amber-300" aria-hidden="true" />
                  <span>Guardar Ficha 360</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
