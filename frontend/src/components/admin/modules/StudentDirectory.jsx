import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronRight,
  ShieldCheck,
  X,
  Building2,
  Calendar,
  Eye,
  Brain,
} from 'lucide-react';
import { api } from '@services/api';
import { useAccessibility } from '@context/AccessibilityContext';
import { useAuth } from '@context/AuthContext';
import { useAccessibleModal } from '@hooks/useAccessibleModal';
import {
  evaluateAttendanceStatus,
  getAttendanceColorClasses,
  getSatRiskBadgeMeta,
  extractCourseAttendanceRate,
} from '@utils/satUtils';
import {
  DEFAULT_CAMPUS,
  matchesRutQuery,
  normalizeStudentProfile,
} from '@utils/studentUtils';
import { explainPredictiveRisk } from '@utils/satUtils';
import { ExplainabilityPanel } from './ExplainabilityPanel';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Table } from '@components/ui/Table';
import { Modal } from '@components/ui/Modal';

const STUDENT_STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'activo', label: 'Activos' },
  { id: 'desercion', label: 'Deserción' },
  { id: 'titulado', label: 'Titulados' },
  { id: 'paedis', label: 'Solo PAEDIS' },
];

const SEDE_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'ALAMEDA', label: 'Sede Alameda' },
  { id: 'ANTONIO VARAS', label: 'Sede Antonio Varas' },
  { id: 'PLAZA NORTE', label: 'Sede Plaza Norte' },
];

const CARRERA_FILTERS = [
  { id: 'INGENIERÍA EN INFORMÁTICA', label: 'Ingeniería en Informática' },
  { id: 'INGENIERÍA EN INFRAESTRUCTURA TECNOLÓGICA', label: 'Ing. en Infraestructura Tecnológica' },
  { id: 'INGENIERÍA EN INFRAEST. Y PLATAFORMAS TECN.', label: 'Ing. en Infraest. y Plataformas Tecn.' },
  { id: 'ANALISTA PROGRAMADOR COMPUTACIONAL', label: 'Analista Programador' },
];

const YEAR_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: '2024', label: '2024' },
  { id: '2025', label: '2025' },
  { id: '2026', label: '2026' },
];

const ACADEMIC_STATUS_BADGE_MAP = {
  activo: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  titulado: 'bg-purple-50 text-purple-900 border-purple-200',
  desercion: 'bg-rose-50 text-rose-900 border-rose-300',
};

const ATTENDANCE_STATUS_TEXT = {
  ri: '⚠️ RI (Reprobado)',
  preventive: 'Alerta Preventiva',
  normal: 'Cumple Asistencia',
  justified: 'Justificada',
};

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

function StudentCard({ student, isSelected, onClick, onExplain, getVoiceProps }) {
  const studentSede = student.campus || student.sede || DEFAULT_CAMPUS;
  const isStaff = isStaffOrAdministrativeRole(student.role);
  const pred = student.prediction || explainPredictiveRisk(student);
  const fallbackTraffic = explainPredictiveRisk(student);
  const effectiveTraffic = pred.trafficLight || fallbackTraffic.trafficLight || 'green';
  const effectiveKey =
    effectiveTraffic === 'red' ? 'rojo' : effectiveTraffic === 'yellow' ? 'amarillo' : 'verde';
  const trafficColor = TRAFFIC_LIGHT_COLOR_MAP[effectiveKey] || 'green';

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
                  trafficColor === 'red' ? 'bg-rose-500' : trafficColor === 'yellow' ? 'bg-amber-400' : 'bg-emerald-500'
                }`} aria-hidden="true" />
                <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                  {effectiveTraffic === 'red' ? 'Alto' : effectiveTraffic === 'yellow' ? 'Medio' : 'Bajo'}
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
                {student.attendanceRate ?? 88.9}%
              </span>
            </div>
          </div>
        )}

        </button>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={student.academicStatus === 'desercion' ? 'error' : student.academicStatus === 'titulado' ? 'warning' : 'success'}
              size="sm"
            >
              {student.academicStatus || 'activo'}
            </Badge>
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

function StudentDetailModal({
  isOpen,
  onClose,
  student,
  onExplain,
  onStatusChange,
  onDelete,
  isAdmin,
  isCoordinator,
  isSavingStatus,
  getVoiceProps,
  announce,
}) {
  const initialFocusRef = useRef(null);
  const contentRef = useRef(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState(student?.academicStatus || 'activo');

  useEffect(() => {
    setNextStatus(student?.academicStatus || 'activo');
    setIsEditingStatus(false);
  }, [student]);

  useAccessibleModal({
    isOpen: Boolean(isOpen && student),
    onClose,
    containerRef: contentRef,
    initialFocusRef,
  });

  if (!isOpen || !student) return null;

  const isStaff = isStaffOrAdministrativeRole(student.role);
  const studentSede = student.campus || student.sede || DEFAULT_CAMPUS;

  const pred = student.prediction || explainPredictiveRisk(student);
  const fallbackTraffic = explainPredictiveRisk(student);
  const effectiveTraffic = pred.trafficLight || fallbackTraffic.trafficLight || 'green';
  const effectiveKey =
    effectiveTraffic === 'red' ? 'rojo' : effectiveTraffic === 'yellow' ? 'amarillo' : 'verde';
  const satBadgeMeta = getSatRiskBadgeMeta(effectiveKey);
  const trafficColor = TRAFFIC_LIGHT_COLOR_MAP[effectiveKey] || 'green';

  const detailCourses = student.enrolledCourses || student.courseAttendance || [];
  // selectedStudentForDetail?.enrolledCourses - patrón para optional chaining en modal

  return (
    <Modal
      ref={initialFocusRef}
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha Integral: ${student.fullName || student.nombre}`}
      size="xl"
      initialFocusRef={initialFocusRef}
      voiceLabel={`Ficha integral de ${student.fullName || student.nombre}`}
    >
      <div ref={contentRef} className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-neutral-900">{student.fullName || student.nombre}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-500">
              <span className="font-semibold">{studentSede}</span>
              <span>•</span>
              <span>{isStaff ? (student.roleLabel || student.role) : (student.career || 'Ingeniería en Informática')}</span>
              <span>•</span>
              <span>{student.email}</span>
              <span>•</span>
              <span>RUT: {student.rut || 'Sin RUT'}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge
              variant={student.academicStatus === 'desercion' ? 'error' : student.academicStatus === 'titulado' ? 'warning' : 'success'}
              size="sm"
            >
              {student.academicStatus || 'activo'}
            </Badge>
            {!isStaff && student.isPaedis && <Badge variant="warning" size="sm">♿ PAEDIS</Badge>}
            {!isStaff && (
              <span className={`min-h-[28px] px-2.5 py-1 rounded-full text-[10px] font-black border ${
                trafficColor === 'red' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                trafficColor === 'yellow' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {effectiveTraffic === 'red' ? 'Alto Riesgo' : effectiveTraffic === 'yellow' ? 'Riesgo Moderado' : 'Bajo Riesgo'}
              </span>
            )}
          </div>
        </div>

        {isStaff ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Rol Institucional</span>
              <span className="text-sm font-black text-neutral-900 block mt-1">{student.roleLabel || student.role}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Sede Asignada</span>
              <span className="text-sm font-black text-neutral-900 block mt-1">{studentSede}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Teléfono de Contacto</span>
              <span className="text-sm font-black text-neutral-900 block mt-1">{student.phone || 'Por actualizar'}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Asistencia Global</span>
                <span className="text-2xl font-black text-neutral-900 block">{student.attendanceRate ?? 88.9}%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Score Predictivo</span>
                <span className="text-2xl font-black text-neutral-900 block">{pred.score ?? 15}%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Prob. Titulación</span>
                <span className="text-2xl font-black text-neutral-900 block">{pred.graduationProbability ?? 90}%</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Nivel SAT</span>
                <span className="text-2xl font-black text-neutral-900 block">{pred.riskLevel || 'BAJO'}</span>
              </div>
            </div>

            {/* Attendance Detail Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-navy" aria-hidden="true" />
                  <h4 className="text-sm sm:text-base font-black text-neutral-900">Asistencia Detallada por Asignatura Cursada</h4>
                </div>
                <span className="text-xs font-bold text-neutral-500">{detailCourses.length} asignaturas</span>
              </div>

              {detailCourses.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-neutral-200">
                  <Table
                    columns={[
                      { field: 'nombre', header: 'Asignatura', render: (v, row) => (row.nombre || row.curso || row.sigla) + ' (' + row.sigla + ')' },
                      { field: 'seccion', header: 'Sección / Sala', render: (v, row) => 'Sec. ' + (row.seccion || '001D') + ' • ' + (row.sala || DEFAULT_CAMPUS) },
                      { field: 'asistencias', header: 'Clases Asistidas', render: (v, row) => row.clasesRegistradas ? (v ?? 0) + ' de ' + row.clasesRegistradas + ' clases' : 'Registrado' },
                      { field: 'attendancePercentage', header: '% Asistencia', render: (v, row) => {
                        const pct = row.attendancePercentage ?? row.porcentajeAsistencia ?? row.attendanceRate ?? 0;
                        return typeof pct === 'number' ? pct + '%' : String(pct) + '%';
                      } },
                      { field: 'status', header: 'Estado Normativo', render: (v, row) => {
                        const rate = extractCourseAttendanceRate(row);
                        const evalResult = evaluateAttendanceStatus(rate, { mode: 'ri70' });
                        return ATTENDANCE_STATUS_TEXT[evalResult.status] || 'Cumple Asistencia';
                      }},
                    ]}
                    data={detailCourses}
                    striped
                    hoverable
                    compact
                    emptyMessage="Sin asignaturas registradas"
                  />
                </div>
              ) : (
                <Card variant="filled" padding="md" className="text-xs text-neutral-600 space-y-1">
                  <p className="font-bold text-neutral-900">Asistencia General Estimada: {student.attendanceRate ?? 88.9}%</p>
                  <p>Las asignaturas específicas y su porcentaje de asistencia se extraen y sincronizan automáticamente en segundo plano al iniciar sesión mediante el portal Vivo Duoc.</p>
                </Card>
              )}

              {/* Predictive Traffic Light */}
              <Card variant="filled" padding="md" className="border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-amber-600" aria-hidden="true">🧠</span>
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-900">Semáforo Predictivo de Retención vs. Deserción</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-full border border-neutral-200">
                    <span title="Verde: Bajo Riesgo (> 75%)" className={`w-3.5 h-3.5 rounded-full transition-all ${trafficColor === 'green' ? 'bg-emerald-500 shadow-md ring-2 ring-emerald-300 animate-pulse' : 'bg-emerald-200 opacity-40'}`} />
                    <span title="Amarillo: Riesgo Moderado (70% - 75%)" className={`w-3.5 h-3.5 rounded-full transition-all ${trafficColor === 'yellow' ? 'bg-amber-400 shadow-md ring-2 ring-amber-200 animate-pulse' : 'bg-amber-200 opacity-40'}`} />
                    <span title="Rojo: Alto Riesgo / RI (< 70%)" className={`w-3.5 h-3.5 rounded-full transition-all ${trafficColor === 'red' ? 'bg-rose-500 shadow-md ring-2 ring-rose-300 animate-pulse' : 'bg-rose-200 opacity-40'}`} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-neutral-200/60 pt-2.5">
                  <div>
                    <span className="text-sm font-black text-neutral-900 block">{effectiveTraffic === 'red' ? 'Alto Riesgo' : effectiveTraffic === 'yellow' ? 'Riesgo Moderado' : 'Bajo Riesgo'}</span>
                    <span className="text-xs text-neutral-600 font-semibold block">Nivel: <strong>{pred.riskLevel || 'BAJO'}</strong> • Prob. Titulación: <strong>{pred.graduationProbability ?? 90}%</strong></span>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-xl self-start sm:self-auto border ${satBadgeMeta.badgeClass}`}>Score: {pred.score ?? 15}%</span>
                </div>

                {Array.isArray(pred.factors) && pred.factors.length > 0 && (
                  <ul className="space-y-1 text-xs text-neutral-600 pt-1 border-t border-neutral-200/50">
                    {pred.factors.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <span className="text-neutral-400 font-bold">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => onExplain(student)}
                  {...getVoiceProps('Abrir panel de explicabilidad completa para ' + (student.fullName || student.nombre))}
                  className="mt-2"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Ver Explicabilidad Completa (Breakdown, Factores, NBA)</span>
                </Button>
              </Card>
            </div>
          </>
        )}

        {/* Inline status editor */}
        {isEditingStatus && !isStaff && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="detail-academic-status" className="text-xs font-bold text-neutral-800">
                Nuevo estado académico:
              </label>
              <select
                id="detail-academic-status"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 rounded-xl"
              >
                <option value="activo">Activo</option>
                <option value="desercion">Deserción</option>
                <option value="titulado">Titulado</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsEditingStatus(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isSavingStatus}
                onClick={async () => {
                  await onStatusChange(student, nextStatus);
                  setIsEditingStatus(false);
                }}
              >
                Guardar Estado
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
          <div className="flex flex-wrap items-center gap-2">
            {!isStaff && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditingStatus((prev) => !prev)}
                disabled={!isAdmin && !isCoordinator}
                {...getVoiceProps('Cambiar estado académico de ' + (student.fullName || student.nombre))}
              >
                Cambiar Estado Académico
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(student)}
                {...getVoiceProps('Eliminar usuario ' + (student.fullName || student.nombre))}
              >
                {isStaff ? 'Eliminar Funcionario' : 'Eliminar Estudiante'}
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} {...getVoiceProps('Contraer ficha del usuario')}>
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cerrar Ficha</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}


export const StudentDirectory = ({
  students = [],
  metrics,
  isLoading,
  onRefresh,
  isCoordinator,
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
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // SEDE_FILTERS dinámico desde usuarios reales de MongoDB
  const SEDE_FILTERS = useMemo(() => {
    const sedes = new Set();
    students.forEach((s) => {
      const sede = (s.campus || s.sede || '').toUpperCase().trim();
      if (sede) sedes.add(sede);
    });
    return [{ id: 'all', label: 'Todas' }, ...Array.from(sedes).sort().map((s) => ({ id: s, label: s }))];
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
          return true;
        })
        .sort((a, b) => {
          const nameA = (a.fullName || a.nombre || a.email || '').trim();
          const nameB = (b.fullName || b.nombre || b.email || '').trim();
          const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          return cmp !== 0 ? cmp : (a.rut || '').localeCompare(b.rut || '');
        }),
    [activeSourceList, userSegment, searchTerm, filterStatus, filterSede, filterCareer, filterYear]
  );

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
    const pred = student.prediction || explainPredictiveRisk(student);
    setExplainabilityStudent(student);
    setExplainabilityPrediction(pred);
    setIsExplainabilityOpen(true);
    announce('Abriendo panel de explicabilidad para ' + (student.fullName || student.nombre), 'polite');
  }, [announce]);

  const handleExecuteAction = useCallback((nba, student) => {
    announce('Ejecutando acción recomendada para ' + (student.fullName || student.nombre), 'polite');
  }, [announce]);

  return (
    <>
      <section aria-labelledby="students-directory-title" className="animate-fade-in-up space-y-5">
        {statusFeedback && (
          <div role="status" aria-live="polite" className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}>
            <span>{statusFeedback.text}</span>
            <button type="button" onClick={() => setStatusFeedback(null)} className="p-1 text-neutral-500 hover:text-neutral-900" aria-label="Cerrar notificación">
              <X className="w-4 h-4" />
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
                : 'Tarjetas con información escaneable. Haz clic para abrir ficha completa en modal con asistencia, semáforo predictivo y explicabilidad.'}
            </p>
          </div>

          {/* Selector visible Estudiantes / Administrativos */}
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-4" role="group" aria-label="Filtrar usuarios">
          {userSegment === 'students' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <label className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Estado:</label>
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

          {/* Sede - Select */}
          <div className="flex items-center gap-1.5">
            <label className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Sede:</label>
            <select
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
                <label className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Carrera:</label>
                <select
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
                <label className={`${ADMIN_THEME.cardLabel} hidden sm:block`}>Año:</label>
                <select
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
              return (
                <StudentCard
                  key={key}
                  student={student}
                  isSelected={isSelected}
                  onClick={() => setSelectedStudentKey(key)}
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
            student={filteredStudents.find((s) => (s._id || s.id || s.email) === selectedStudentKey) || activeSourceList.find((s) => (s._id || s.id || s.email) === selectedStudentKey)}
            onExplain={handleOpenExplainability}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteUser}
            isAdmin={isAdmin}
            isCoordinator={isCoordinatorRole}
            isSavingStatus={isSavingStatus}
            getVoiceProps={getVoiceProps}
            announce={announce}
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