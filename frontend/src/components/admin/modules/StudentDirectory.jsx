import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  ShieldCheck,
  X,
  Eye,
  Brain,
  ClipboardList,
  Clock,
} from 'lucide-react';
import { api } from '@services/api';
import { useAuth } from '@context/AuthContext';
import {
  DEFAULT_CAMPUS,
  matchesRutQuery,
} from '@utils/studentUtils';
import { explainPredictiveRisk } from '@utils/satUtils';
import { ExplainabilityPanel } from './ExplainabilityPanel';
import { StudentDetailModal } from '@components/admin/StudentDetailModal';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';

export { StudentDetailModal };

const STUDENT_STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'activo', label: 'Activos' },
  { id: 'desercion', label: 'Deserción' },
  { id: 'titulado', label: 'Titulados' },
  { id: 'paedis', label: 'Solo PAEDIS' },
];

const CARRERA_FILTERS = [
  { id: 'INGENIERÍA EN INFORMÁTICA', label: 'Ingeniería en Informática' },
  { id: 'INGENIERÍA EN INFRAESTRUCTURA TECNOLÓGICA', label: 'Ing. en Infraestructura Tecnológica' },
  { id: 'INGENIERÍA EN INFRAEST. Y PLATAFORMAS TECN.', label: 'Ing. en Infraest. y Plataformas Tecn.' },
  { id: 'ANALISTA PROGRAMADOR COMPUTACIONAL', label: 'Analista Programador' },
];

const TRAFFIC_LIGHT_COLOR_MAP = {
  rojo: 'red',
  amarillo: 'yellow',
};

const hasDigit = (str) => {
  if (!str) return false;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return true;
  }
  return false;
};

const STAFF_ROLES = new Set([
  'coordinador_paedis',
  'admin',
  'administrador',
  'administrativo',
  'profesor',
  'director',
  'subdirector',
]);

const isStaffOrAdministrativeRole = (role) => STAFF_ROLES.has((role || '').toLowerCase());

function StudentCard({ student, isSelected, onClick, onExplain, interventionsCount = 0, getVoiceProps }) {
  const studentSede = student.campus || student.sede || DEFAULT_CAMPUS;
  const isStaff = isStaffOrAdministrativeRole(student.role);
  const pred = student.prediction || explainPredictiveRisk(student);
  const fallbackTraffic = explainPredictiveRisk(student);
  const effectiveTraffic = pred.trafficLight || fallbackTraffic.trafficLight || 'neutral';
  const effectiveKey =
    effectiveTraffic === 'red' ? 'rojo' : effectiveTraffic === 'yellow' ? 'amarillo' : effectiveTraffic === 'neutral' ? 'sin_datos' : 'verde';
  const trafficColor = TRAFFIC_LIGHT_COLOR_MAP[effectiveKey] || (effectiveKey === 'sin_datos' ? 'neutral' : 'green');

  const cardClasses = `min-h-[140px] p-4 text-left rounded-2xl border transition-all cursor-pointer ${
    isSelected
      ? 'bg-brand-navy text-white border-brand-navy shadow-sm ring-2 ring-brand-gold'
      : 'bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200 shadow-2xs'
  }`;

  return (
    <article className={cardClasses}>
      <div className="flex flex-col gap-3 h-full justify-between">
        <button
          type="button"
          onClick={onClick}
          {...getVoiceProps(`Ver ficha de ${student.fullName || student.nombre}`)}
          className="w-full text-left flex-1 flex flex-col gap-3 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-black block truncate ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                {student.fullName || student.nombre}
              </span>
              {!isStaff && student.isPaedis && (
                <Badge variant="warning" size="sm">♿ PAEDIS</Badge>
              )}
              {isStaff && (
                <Badge variant="info" size="sm">{student.roleLabel || student.role}</Badge>
              )}
            </div>
            <span className={`text-xs font-semibold block truncate mt-0.5 ${isSelected ? 'text-brand-gold' : 'text-neutral-500'}`}>
              {studentSede} • {isStaff ? student.email : (student.career || 'Ingeniería en Informática')}
            </span>
          </div>
          {!isStaff && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full transition-all ${
                  trafficColor === 'red' ? 'bg-rose-500' : trafficColor === 'yellow' ? 'bg-amber-400' : trafficColor === 'neutral' ? 'bg-neutral-400' : 'bg-emerald-500'
                }`} aria-hidden="true" />
                <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                  {effectiveTraffic === 'red' ? 'Alto' : effectiveTraffic === 'yellow' ? 'Medio' : effectiveTraffic === 'neutral' ? 'Sin datos' : 'Bajo'}
                </span>
              </div>
            </div>
          )}
        </div>

        {isStaff ? (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-current/10">
            <div className="text-center min-w-0">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isSelected ? 'text-brand-gold/80' : 'text-neutral-500'}`}>Rol</span>
              <span className={`text-xs font-bold truncate block ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                {student.roleLabel || student.role || 'Administrativo'}
              </span>
            </div>
            <div className="text-center min-w-0">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isSelected ? 'text-brand-gold/80' : 'text-neutral-500'}`}>Sede</span>
              <span className={`text-xs font-bold truncate block ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                {studentSede}
              </span>
            </div>
            <div className="text-center min-w-0">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isSelected ? 'text-brand-gold/80' : 'text-neutral-500'}`}>RUT</span>
              <span className={`text-xs font-bold truncate block ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                {student.rut || '—'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-current/10">
            <div className="text-center min-w-0">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isSelected ? 'text-brand-gold/80' : 'text-neutral-500'}`}>Carrera</span>
              <span className={`text-xs font-bold truncate block ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                {student.career || 'Ingeniería en Informática'}
              </span>
            </div>
            <div className="text-center min-w-0">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isSelected ? 'text-brand-gold/80' : 'text-neutral-500'}`}>Sede</span>
              <span className={`text-xs font-bold truncate block ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                {studentSede}
              </span>
            </div>
            <div className="text-center min-w-0">
              <span className={`text-xs font-semibold uppercase tracking-wider block ${isSelected ? 'text-brand-gold/80' : 'text-neutral-500'}`}>Asist. Global</span>
              <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                {student.attendanceRate !== undefined && student.attendanceRate !== null ? `${student.attendanceRate}%` : 'Sin datos'}
              </span>
            </div>
          </div>
        )}

        </button>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant={student.academicStatus === 'desercion' ? 'error' : student.academicStatus === 'titulado' ? 'warning' : 'success'}
              size="sm"
            >
              {student.academicStatus || 'activo'}
            </Badge>
            {interventionsCount > 0 && (
              <Badge variant="info" size="sm">
                Bitácora: {interventionsCount}
              </Badge>
            )}
          </div>
          {!isStaff ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onExplain(student); }}
              {...getVoiceProps('Explicabilidad predictiva de ' + (student.fullName || student.nombre))}
              className={`text-xs ${isSelected ? '!text-brand-gold hover:!bg-white/10' : ''}`}
            >
              <Brain className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Explicar</span>
            </Button>
          ) : (
            <span className={`text-xs font-bold inline-flex items-center gap-1 ${isSelected ? 'text-brand-gold' : 'text-brand-navy'}`}>
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Ver ficha
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export const StudentDirectory = ({
  students = [],
  isLoading,
  onRefresh,
  isAdmin,
  getVoiceProps,
  announce,
}) => {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isCoordinatorRole = userRole === 'coordinador_paedis';

  const [userSegment, setUserSegment] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSede, setFilterSede] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterCareer, setFilterCareer] = useState('all');
  const [selectedStudentKey, setSelectedStudentKey] = useState(null);
  const [modalInitialView, setModalInitialView] = useState('ficha');
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [interventionsByStudent, setInterventionsByStudent] = useState({});
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(false);

  const SEDE_FILTERS = useMemo(() => {
    const sedes = new Set();
    students.forEach((s) => {
      const sede = (s.campus || s.sede || '').toUpperCase().trim();
      if (sede) sedes.add(sede);
    });
    return [{ id: 'all', label: 'Todas' }, ...Array.from(sedes).sort((a, b) => a.localeCompare(b)).map((s) => ({ id: s, label: s }))];
  }, [students]);

  const YEAR_FILTERS = useMemo(() => [{ id: 'all', label: 'Todos' }], []);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState(false);
  const [explainabilityStudent, setExplainabilityStudent] = useState(null);
  const [explainabilityPrediction, setExplainabilityPrediction] = useState(null);

  const studentUsers = useMemo(
    () => students.filter((s) => !isStaffOrAdministrativeRole(s.role)),
    [students]
  );

  const staffUsers = useMemo(
    () => students.filter((s) => isStaffOrAdministrativeRole(s.role)),
    [students]
  );

  const activeSourceList = userSegment === 'staff' ? staffUsers : studentUsers;

  const filteredStudents = useMemo(
    () =>
      activeSourceList
        .filter((s) => {
          const q = searchTerm.toLowerCase().trim();
          if (!q) return true;
          const name = (s.fullName || s.nombre || '').toLowerCase();
          const sede = (s.campus || s.sede || '').toLowerCase();
          const email = (s.email || '').toLowerCase();
          const role = (s.roleLabel || s.role || '').toLowerCase();
          const hasDigitQuery = hasDigit(searchTerm);
          return (
            name.includes(q) ||
            sede.includes(q) ||
            email.includes(q) ||
            role.includes(q) ||
            (hasDigitQuery && matchesRutQuery(s.rut, searchTerm))
          );
        })
        .filter((s) => {
          if (userSegment === 'staff') return true;
          if (filterStatus === 'paedis') {
            return Boolean(s.isPaedis) || s.role === 'estudiante_paedis';
          }
          if (filterStatus !== 'all') {
            return s.academicStatus === filterStatus;
          }
          return true;
        })
        .filter((s) => {
          if (filterSede === 'all') return true;
          const sede = (s.campus || s.sede || '').toUpperCase();
          return sede === filterSede;
        })
        .filter((s) => {
          if (userSegment === 'staff' || filterCareer === 'all') return true;
          const career = (s.career || s.carrera || '').toUpperCase();
          return career === filterCareer;
        })
        .filter((s) => {
          if (filterYear === 'all') return true;
          const studentYear = s.year || s.nivel || s.ano || '';
          return String(studentYear) === String(filterYear);
        })
        .sort((a, b) => {
          const nameA = (a.fullName || a.nombre || a.email || '').trim();
          const nameB = (b.fullName || b.nombre || b.email || '').trim();
          const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          return cmp !== 0 ? cmp : (a.rut || '').localeCompare(b.rut || '');
        }),
    [activeSourceList, userSegment, searchTerm, filterStatus, filterSede, filterCareer, filterYear]
  );

  const selectedStudent = useMemo(() => {
    if (!selectedStudentKey) return null;
    return (
      filteredStudents.find((s) => (s._id || s.id || s.email) === selectedStudentKey) ||
      activeSourceList.find((s) => (s._id || s.id || s.email) === selectedStudentKey) ||
      null
    );
  }, [selectedStudentKey, filteredStudents, activeSourceList]);

  // Cargar intervenciones persistidas desde la base de datos cuando se selecciona un estudiante
  useEffect(() => {
    if (!selectedStudentKey || !selectedStudent || isStaffOrAdministrativeRole(selectedStudent.role)) {
      return;
    }
    let mounted = true;
    const loadInterventions = async () => {
      setIsLoadingInterventions(true);
      try {
        const res = await api.getStudentInterventions(selectedStudentKey);
        if (!mounted) return;
        const list = res?.interventions || res?.data || [];
        if (res?.success && Array.isArray(list)) {
          setInterventionsByStudent((prev) => ({ ...prev, [selectedStudentKey]: list }));
        }
      } catch {
        // Silencioso si el backend aún no tiene registros o endpoint no responde
      } finally {
        if (mounted) setIsLoadingInterventions(false);
      }
    };
    void loadInterventions();
    return () => {
      mounted = false;
    };
  }, [selectedStudentKey, selectedStudent]);

  const handleStatusChange = useCallback(async (targetStudent, nextStatus) => {
    try {
      setIsSavingStatus(true);
      const id = targetStudent._id || targetStudent.id || targetStudent.email;
      const res = await api.updateStudentStatus(id, nextStatus, `Actualizado desde directorio (${nextStatus})`);
      if (res?.success) {
        setStatusFeedback({ type: 'success', text: `Estado de ${targetStudent.fullName || targetStudent.nombre} actualizado a "${nextStatus}".` });
        announce(`Estado académico actualizado a ${nextStatus}.`, 'polite');
        await onRefresh?.();
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'No se pudo actualizar el estado.' });
      }
    } catch (err) {
      setStatusFeedback({ type: 'error', text: err.message || 'Error al actualizar el estado académico.' });
    } finally {
      setIsSavingStatus(false);
    }
  }, [announce, onRefresh]);

  const handleDeleteUser = useCallback(async (targetUser) => {
    const label = targetUser.fullName || targetUser.nombre || targetUser.email;
    if (!window.confirm(`¿Eliminar permanentemente a "${label}" de la base de datos?`)) return;
    try {
      const id = targetUser._id || targetUser.id || targetUser.email;
      const res = await api.deleteStudent(id);
      if (res?.success) {
        setSelectedStudentKey(null);
        setStatusFeedback({ type: 'success', text: `Usuario "${label}" eliminado correctamente.` });
        announce(`Usuario ${label} eliminado.`, 'polite');
        await onRefresh?.();
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'Error al eliminar usuario.' });
      }
    } catch (err) {
      setStatusFeedback({ type: 'error', text: err.message || 'Error de conexión al eliminar usuario.' });
    }
  }, [announce, onRefresh]);

  const handleOpenExplainability = useCallback((student) => {
    const key = student._id || student.id || student.email;
    setSelectedStudentKey(key);
    setModalInitialView('explicabilidad');
    announce('Abriendo explicabilidad predictiva para ' + (student.fullName || student.nombre), 'polite');
  }, [announce]);

  const handleExecuteAction = useCallback(async (nba, student) => {
    const studentId = student?._id || student?.id || student?.email;
    if (!studentId) return;

    const actionTitle = nba?.title || nba?.action || 'Acompañamiento tutorial';
    const actionCategory = nba?.triggeredRule || nba?.category || 'SEGUIMIENTO_SAT';
    const notes =
      nba?.notes ||
      (nba?.action && nba?.title && nba.action !== nba.title
        ? nba.action
        : `Prioridad ${nba?.priority || 1} • SLA ${nba?.slaHours || 48}h`);

    setStatusFeedback(null);

    try {
      const res = await api.createStudentIntervention(studentId, {
        actionTitle,
        actionCategory,
        notes,
      });

      if (!res || res.success === false) {
        const errMsg = res?.message || 'No se pudo registrar la intervención en la bitácora interna.';
        setStatusFeedback({ type: 'error', text: errMsg });
        announce(errMsg, 'assertive');
        return;
      }

      const created = res.intervention || {
        _id: `int-${Date.now()}`,
        actionTitle,
        actionCategory,
        notes,
        status: 'REGISTRADA',
        externalDerivationPerformed: false,
        createdAt: new Date().toISOString(),
      };

      setInterventionsByStudent((prev) => ({
        ...prev,
        [studentId]: [created, ...(prev[studentId] || [])],
      }));

      const honestMessage =
        'Intervención registrada en bitácora interna de seguimiento (requiere gestión manual del responsable asignado).';
      setStatusFeedback({ type: 'success', text: honestMessage });
      announce(honestMessage, 'polite');
    } catch (err) {
      const errMsg = err?.message || 'Error de conexión al registrar la intervención en bitácora.';
      setStatusFeedback({ type: 'error', text: errMsg });
      announce(errMsg, 'assertive');
    }
  }, [announce]);

  const selectedInterventions = useMemo(() => {
    if (!selectedStudentKey) return [];
    if (Array.isArray(interventionsByStudent[selectedStudentKey])) {
      return interventionsByStudent[selectedStudentKey];
    }
    return Array.isArray(selectedStudent?.interventions) ? selectedStudent.interventions : [];
  }, [selectedStudentKey, interventionsByStudent, selectedStudent]);

  return (
    <>
      <section aria-labelledby="students-directory-title" className="animate-fade-in-up space-y-5">
        {statusFeedback && (
          <div
            role={statusFeedback.type === 'error' ? 'alert' : 'status'}
            aria-live={statusFeedback.type === 'error' ? 'assertive' : 'polite'}
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}
          >
            <span>{statusFeedback.text}</span>
            <button type="button" onClick={() => setStatusFeedback(null)} className="p-1 text-neutral-500 hover:text-neutral-900" aria-label="Cerrar notificación">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Header & Segment Selector */}
        <div className={`${ADMIN_THEME.cardSurface} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
          <div className="space-y-1.5">
            <h2 id="students-directory-title" className={ADMIN_THEME.moduleTitle}>
              Usuarios registrados ({filteredStudents.length})
            </h2>
            <p className={ADMIN_THEME.moduleSubtitle}>
              {userSegment === 'staff'
                ? 'Funcionarios, docentes, coordinación PAEDIS y administradores. Haz clic para ver su ficha.'
                : 'Tarjetas con información escaneable. Haz clic para abrir ficha completa en modal con asistencia, semáforo predictivo y bitácora interna.'}
            </p>
          </div>

          <div
            role="group"
            aria-label="Tipo de usuarios registrados"
            className="inline-flex items-center p-1 bg-neutral-100 border border-neutral-200 rounded-2xl gap-1 self-start lg:self-auto shrink-0"
          >
            <Button
              variant={userSegment === 'students' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setUserSegment('students'); setSelectedStudentKey(null); }}
              aria-pressed={userSegment === 'students'}
              {...getVoiceProps('Ver estudiantes registrados')}
              className="min-h-[40px] px-4 rounded-xl text-xs font-bold"
            >
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>Estudiantes ({studentUsers.length})</span>
            </Button>
            <Button
              variant={userSegment === 'staff' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setUserSegment('staff'); setSelectedStudentKey(null); }}
              aria-pressed={userSegment === 'staff'}
              {...getVoiceProps('Ver administrativos registrados')}
              className="min-h-[40px] px-4 rounded-xl text-xs font-bold"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Administrativos ({staffUsers.length})</span>
            </Button>
          </div>
        </div>

        {/* Bitácora interna de intervenciones persistidas para el estudiante seleccionado */}
        {selectedStudent && !isStaffOrAdministrativeRole(selectedStudent.role) && (
          <Card variant="outlined" padding="md" className="rounded-2xl space-y-3 bg-white border-neutral-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-navy" aria-hidden="true" />
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                  Bitácora Interna de Intervenciones • {selectedStudent.fullName || selectedStudent.nombre}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-neutral-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Gestión manual requerida (sin derivación automática externa)
              </span>
            </div>

            {isLoadingInterventions ? (
              <p className="text-xs text-neutral-500">Cargando intervenciones registradas...</p>
            ) : selectedInterventions.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No existen intervenciones registradas en bitácora interna para este estudiante.
              </p>
            ) : (
              <ul className="space-y-2">
                {selectedInterventions.map((item, idx) => (
                  <li
                    key={item._id || item.id || `${item.actionTitle}-${idx}`}
                    className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-neutral-900">{item.actionTitle}</strong>
                        <Badge variant="info" size="sm">{item.status || 'REGISTRADA'}</Badge>
                      </div>
                      {item.notes && <p className="text-neutral-600">{item.notes}</p>}
                      {(item.responsibleName || item.responsibleEmail) && (
                        <p className="text-[11px] text-neutral-500">
                          Responsable asignado: {item.responsibleName || item.responsibleEmail}
                        </p>
                      )}
                    </div>
                    {item.createdAt && (
                      <span className="text-[11px] text-neutral-500 inline-flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {new Date(item.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-4" role="group" aria-label="Filtrar usuarios">
          {userSegment === 'students' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Estado:</span>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por estado académico">
                {STUDENT_STATUS_FILTERS.map((f) => (
                  <Button
                    key={f.id}
                    variant={filterStatus === f.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(f.id)}
                    {...getVoiceProps('Filtrar estudiantes por estado: ' + f.label)}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-semibold"
                    aria-pressed={filterStatus === f.id}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <label htmlFor="student-filter-sede" className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Sede:</label>
            <select
              id="student-filter-sede"
              value={filterSede}
              onChange={(e) => setFilterSede(e.target.value)}
              {...getVoiceProps('Filtrar usuarios por sede')}
              className={`${ADMIN_THEME.controlInput} cursor-pointer`}
              aria-label="Filtrar usuarios por sede"
            >
              {SEDE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          {userSegment === 'students' && (
            <>
              <div className="flex items-center gap-1.5">
                <label htmlFor="student-filter-career" className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Carrera:</label>
                <select
                  id="student-filter-career"
                  value={filterCareer}
                  onChange={(e) => setFilterCareer(e.target.value)}
                  {...getVoiceProps('Filtrar estudiantes por carrera')}
                  className={`${ADMIN_THEME.controlInput} cursor-pointer`}
                  aria-label="Filtrar estudiantes por carrera"
                >
                  <option value="all">Todas</option>
                  {CARRERA_FILTERS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="student-filter-year" className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Año:</label>
                <select
                  id="student-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  {...getVoiceProps('Filtrar estudiantes por año')}
                  className={`${ADMIN_THEME.controlInput} cursor-pointer`}
                  aria-label="Filtrar estudiantes por año"
                >
                  {YEAR_FILTERS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={userSegment === 'staff' ? 'Buscar administrativo por nombre, correo, rol o sede...' : 'Buscar estudiante por nombre, RUT, correo o sede...'}
            aria-label="Buscar usuario por nombre, RUT o sede"
            {...getVoiceProps('Buscar usuario por nombre, RUT o sede')}
            className={`w-full pl-10 pr-4 ${ADMIN_THEME.controlInput}`}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400 font-bold space-y-2">
            <span className="animate-spin inline-block w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full" aria-hidden="true" />
            <span>Cargando usuarios registrados...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card variant="filled" padding="lg" className="text-center">
            No se encontraron {userSegment === 'staff' ? 'administrativos' : 'estudiantes'} registrados con los criterios seleccionados.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => {
              const key = student._id || student.id || student.email;
              const isSelected = selectedStudentKey === key;
              const count = interventionsByStudent[key]?.length ?? student.interventions?.length ?? 0;
              return (
                <StudentCard
                  key={key}
                  student={student}
                  isSelected={isSelected}
                  interventionsCount={count}
                  onClick={() => {
                    setSelectedStudentKey(key);
                    setModalInitialView('ficha');
                  }}
                  onExplain={handleOpenExplainability}
                  getVoiceProps={getVoiceProps}
                />
              );
            })}
          </div>
        )}

        {/* Selected User Detail Modal */}
        {selectedStudentKey && (
          <StudentDetailModal
            isOpen={true}
            onClose={() => setSelectedStudentKey(null)}
            student={selectedStudent}
            onExplain={handleOpenExplainability}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteUser}
            isAdmin={isAdmin}
            isCoordinator={isCoordinatorRole}
            isSavingStatus={isSavingStatus}
            getVoiceProps={getVoiceProps}
            announce={announce}
            onExecuteAction={handleExecuteAction}
            initialViewMode={modalInitialView}
          />
        )}

        {/* Explainability Panel */}
        <ExplainabilityPanel
          isOpen={isExplainabilityOpen}
          onClose={() => setIsExplainabilityOpen(false)}
          prediction={explainabilityPrediction}
          student={explainabilityStudent}
          onExecuteAction={handleExecuteAction}
          isCoordinator={isCoordinatorRole}
          isAdmin={isAdmin}
          getVoiceProps={getVoiceProps}
          announce={announce}
        />
      </section>
    </>
  );
};

export default StudentDirectory;
