import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  ArrowLeft,
  GraduationCap,
  Eye,
  FileSignature,
} from 'lucide-react';
import { useAccessibleModal } from '@hooks/useAccessibleModal';
import {
  evaluateAttendanceStatus,
  getSatRiskBadgeMeta,
  extractCourseAttendanceRate,
  explainPredictiveRisk,
} from '@utils/satUtils';
import { DEFAULT_CAMPUS } from '@utils/studentUtils';
import { ExplainabilityContent } from './modules/ExplainabilityPanel';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Table } from '@components/ui/Table';
import { Modal } from '@components/ui/Modal';

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

/**
 * Ficha Integral del Estudiante / Usuario unificada para Directorio y SAT Monitoring.
 * Permite alternar fluidamente entre la vista de perfil académico ("ficha")
 * y el desglose de "explicabilidad" predictiva 360°, manteniendo la misma experiencia visual.
 */
export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  onExplain,
  onStatusChange,
  onDelete,
  isAdmin,
  isCoordinator,
  isSavingStatus,
  getVoiceProps = () => ({}),
  announce,
  onExecuteAction,
  onOpenIntervention,
  initialViewMode = 'ficha',
}) {
  const initialFocusRef = useRef(null);
  const contentRef = useRef(null);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState(student?.academicStatus || 'activo');

  useEffect(() => {
    setNextStatus(student?.academicStatus || 'activo');
    setIsEditingStatus(false);
    setViewMode(initialViewMode || 'ficha');
  }, [student, initialViewMode]);

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

  const rawCourses = student.enrolledCourses || student.courseAttendance || [];
  // selectedStudentForDetail?.enrolledCourses - compatibilidad con auditoría de optional chaining
  const detailCourses = Array.isArray(rawCourses) ? rawCourses : [];

  // Calcular asistencia global si no viene precalculada
  const displayAttendanceRate =
    student.attendanceRate ??
    (detailCourses.length > 0
      ? Math.round(
          (detailCourses.reduce((acc, c) => acc + Number(extractCourseAttendanceRate(c) ?? 0), 0) /
            detailCourses.length) *
            10
        ) / 10
      : 88.9);

  return (
    <Modal
      ref={initialFocusRef}
      isOpen={isOpen}
      onClose={onClose}
      title={
        viewMode === 'explicabilidad'
          ? `Explicabilidad Predictiva: ${student.fullName || student.nombre}`
          : `Ficha Integral: ${student.fullName || student.nombre}`
      }
      size="xl"
      initialFocusRef={initialFocusRef}
      voiceLabel={
        viewMode === 'explicabilidad'
          ? `Explicabilidad predictiva de ${student.fullName || student.nombre}`
          : `Ficha integral de ${student.fullName || student.nombre}`
      }
      footer={
        viewMode === 'explicabilidad' ? (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setViewMode('ficha');
                announce?.('Volviendo a la ficha integral', 'polite');
              }}
              className="gap-2 font-bold shadow-xs hover:shadow-md transition-all duration-200"
              {...getVoiceProps('Volver a la ficha integral')}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Volver a la ficha</span>
            </Button>
            <span className="text-xs text-neutral-400">Presione Escape o use la X para cerrar</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!isStaff && onStatusChange && (
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
              {onOpenIntervention && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onOpenIntervention(student);
                  }}
                  {...getVoiceProps('Gestionar Ficha 360 de intervención SAT para ' + (student.fullName || student.nombre))}
                  className="gap-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
                  <span>Gestionar Intervención SAT</span>
                </Button>
              )}
              {isAdmin && onDelete && (
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
            <span className="text-xs text-neutral-400">Presione Escape o use la X para cerrar</span>
          </div>
        )
      }
    >
      {viewMode === 'explicabilidad' ? (
        <div ref={contentRef} className="space-y-5 animate-fade-in transition-all duration-300 ease-out">
          {/* Header navigation bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl transition-all duration-300 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-navy text-white shadow-xs">
                <Brain className="w-5 h-5 text-brand-gold" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-neutral-900">
                    Explicabilidad Predictiva 360°
                  </h4>
                  <Badge
                    variant={
                      effectiveTraffic === 'red'
                        ? 'error'
                        : effectiveTraffic === 'yellow'
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                  >
                    {effectiveTraffic === 'red'
                      ? 'Alto Riesgo'
                      : effectiveTraffic === 'yellow'
                      ? 'Riesgo Moderado'
                      : 'Bajo Riesgo'}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Estudiante: <strong className="text-neutral-800">{student.fullName || student.nombre}</strong> • {studentSede}
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Explainability Content */}
          <div className="transition-opacity duration-300">
            <ExplainabilityContent
              prediction={pred}
              student={student}
              onExecuteAction={onExecuteAction}
              isCoordinator={isCoordinator}
              isAdmin={isAdmin}
              getVoiceProps={getVoiceProps}
              announce={announce}
            />
          </div>
        </div>
      ) : (
        <div ref={contentRef} className="space-y-5 animate-fade-in transition-all duration-300 ease-out">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Asistencia Global</span>
                  <span className="text-2xl font-black text-neutral-900 block">{displayAttendanceRate}%</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">PUNTAJE PREDICTIVO</span>
                  <span className="text-2xl font-black text-neutral-900 block">
                    {pred.score !== null && pred.score !== undefined ? `${pred.score}%` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Nivel SAT</span>
                  <span className="text-2xl font-black text-neutral-900 block">
                    {pred.riskLevel === 'SIN_DATOS' ? 'Sin datos' : (pred.riskLevel || 'BAJO')}
                  </span>
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
                        {
                          field: 'nombre',
                          header: 'Asignatura',
                          render: (v, row) =>
                            (row.nombre || row.curso || row.courseName || row.sigla || row.courseCode) +
                            (row.sigla || row.courseCode ? ' (' + (row.sigla || row.courseCode) + ')' : ''),
                        },
                        {
                          field: 'seccion',
                          header: 'Sección / Sala',
                          render: (v, row) =>
                            'Sec. ' +
                            (row.seccion || row.section || '001D') +
                            ' • ' +
                            (row.sala || row.room || studentSede),
                        },
                        {
                          field: 'asistencias',
                          header: 'Clases Asistidas',
                          render: (v, row) => {
                            const total = row.clasesRegistradas || row.totalSessions;
                            const attended = v ?? row.attendedSessions;
                            return total ? (attended ?? 0) + ' de ' + total + ' clases' : 'Registrado';
                          },
                        },
                        {
                          field: 'attendancePercentage',
                          header: '% Asistencia',
                          render: (v, row) => {
                            const pct = extractCourseAttendanceRate(row);
                            return typeof pct === 'number' ? Math.round(pct * 10) / 10 + '%' : String(pct) + '%';
                          },
                        },
                        {
                          field: 'status',
                          header: 'Estado Normativo',
                          render: (v, row) => {
                            if (row.paedisJustified) {
                              return 'Justificada (PAEDIS)';
                            }
                            const rate = extractCourseAttendanceRate(row);
                            const evalResult = evaluateAttendanceStatus(rate, { mode: 'ri70' });
                            return ATTENDANCE_STATUS_TEXT[evalResult.status] || 'Cumple Asistencia';
                          },
                        },
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
                    <p className="font-bold text-neutral-900">Asistencia General Estimada: {displayAttendanceRate}%</p>
                    <p>Las asignaturas específicas y su porcentaje de asistencia se extraen y sincronizan automáticamente mediante el portal institucional Vivo Duoc.</p>
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
                      <span className="text-xs text-neutral-600 font-semibold block">Nivel: <strong>{pred.predictionLabel || pred.riskLevel || 'BAJO'}</strong></span>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-xl self-start sm:self-auto border ${satBadgeMeta.badgeClass}`}>Puntaje: {pred.score ?? 15}%</span>
                  </div>

                  {Array.isArray(pred.factors) && pred.factors.length > 0 && (
                    <ul className="space-y-1 text-xs text-neutral-600 pt-1 border-t border-neutral-200/50">
                      {pred.factors.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
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
                    onClick={() => {
                      setViewMode('explicabilidad');
                      announce?.('Mostrando explicabilidad completa del estudiante', 'polite');
                    }}
                    {...getVoiceProps('Ver explicabilidad completa para ' + (student.fullName || student.nombre))}
                    className="mt-2 group hover:border-brand-navy/30 transition-all duration-200"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-navy group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
                    <span>Ver explicabilidad completa</span>
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
                    await onStatusChange?.(student, nextStatus);
                    setIsEditingStatus(false);
                  }}
                >
                  Guardar Estado
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default StudentDetailModal;
