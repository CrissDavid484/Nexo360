import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  BookOpen,
  HeartHandshake,
  Download,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { api } from '@services/api';
import { useAccessibility } from '@context/AccessibilityContext';
import { useAccessibleModal } from '@hooks/useAccessibleModal';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { DEFAULT_CAMPUS } from '@utils/studentUtils';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Modal } from '@components/ui/Modal';

const BARRIER_OPTIONS = [
  'Visual / Sensorial',
  'Auditiva / LSCh',
  'Física / Motora',
  'Neurodivergencia',
  'Psicosocial / Cognitiva',
];

const ACCREDITATION_OPTIONS = [
  'Credencial RND SENADIS / COMPIN',
  'Certificado Médico Especialista',
  'Informe Psicopedagógico / Escolar',
  'En Proceso de Acreditación',
];

const CASE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pendiente-ficha', label: 'Ficha Pendiente' },
  { id: 'sin-ajustes', label: 'Sin Ajustes' },
  { id: 'riesgo', label: 'Riesgo <70%' },
];

const DOCENTE_SHEET_STATES = {
  BORRADOR: {
    code: 'BORRADOR',
    label: 'Borrador',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-300',
  },
  APROBADA: {
    code: 'APROBADA',
    label: 'Aprobada',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  PREPARADA: {
    code: 'PREPARADA',
    label: 'Preparada (.txt)',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  PENDIENTE_ENVIO: {
    code: 'PENDIENTE_ENVIO',
    label: 'Pendiente de Envío',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
  },
  ENVIADA: {
    code: 'ENVIADA',
    label: 'Enviada',
    badgeClass: 'bg-cyan-100 text-cyan-950 border-cyan-300',
  },
  ENTREGADA: {
    code: 'ENTREGADA',
    label: 'Entregada',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
  },
  ACUSADA: {
    code: 'ACUSADA',
    label: 'Acusada',
    badgeClass: 'bg-emerald-200 text-emerald-950 border-emerald-400',
  },
};

const NOTIFIED_SHEET_STATES = new Set(['ENVIADA', 'ENTREGADA', 'ACUSADA']);

function resolveSheetState(student) {
  const raw = String(student?.fichaDocenteEstado || '').toUpperCase().trim();
  if (DOCENTE_SHEET_STATES[raw]) return raw;
  return student?.fichaDocenteNotificada ? 'ENVIADA' : 'BORRADOR';
}

function isSheetNotifiedState(state) {
  return NOTIFIED_SHEET_STATES.has(String(state || '').toUpperCase());
}

const ADJUSTMENT_PRESETS = [
  {
    tipo: 'Tiempo extendido +50%',
    descripcion: '50% de tiempo adicional en certámenes y evaluaciones teóricas o prácticas.',
  },
  {
    tipo: 'Tiempo extendido +25%',
    descripcion: '25% de tiempo adicional en pruebas escritas y controles parciales.',
  },
  {
    tipo: 'Intérprete de Señas (LSCh)',
    descripcion: 'Acompañamiento de Intérprete de Lengua de Señas Chilena en aula y evaluaciones.',
  },
  {
    tipo: 'Servicio TransVoz / Transcripción',
    descripcion: 'Transcripción simultánea y subtitulado en vivo mediante servicio institucional.',
  },
  {
    tipo: 'Material para lector de pantalla',
    descripcion: 'Entrega anticipada de guías y PDF accesibles compatibles con NVDA / JAWS.',
  },
  {
    tipo: 'Lectura clara y resumida',
    descripcion: 'Enunciados directos por viñetas, sin dobles sentidos y con apoyos visuales concisos.',
  },
  {
    tipo: 'Puesto preferente / Accesibilidad motora',
    descripcion: 'Ubicación preferencial en primera fila, mobiliario ergonómico y acceso universal.',
  },
];

function resolveStudentKey(student) {
  return student?.id || student?._id || student?.email || '';
}

function isPaedisStudentRecord(student) {
  const isFlaggedPaedis = student?.isPaedis === true || student?.role === 'estudiante_paedis';
  const isStudentRole =
    student?.role?.startsWith('estudiante') ||
    student?.role === 'tutor_par';
  return isFlaggedPaedis && isStudentRole;
}

function inferBarrierCategory(student) {
  if (student?.barreraPaedis) {
    if (/tea|neuro/i.test(student.barreraPaedis)) return 'Neurodivergencia';
    return student.barreraPaedis;
  }
  const diag = String(student?.diagnosticoDeclarado || '').toLowerCase();
  if (/audit|sord|hipoac|lsch/.test(diag)) return 'Auditiva / LSCh';
  if (/motor|físic|fisic|silla|movil/.test(diag)) return 'Física / Motora';
  if (/tea|espectro|neuro|tdah|asperger/.test(diag)) return 'Neurodivergencia';
  if (/psicosoc|cognit|ansiedad|aprend/.test(diag)) return 'Psicosocial / Cognitiva';
  return 'Visual / Sensorial';
}

function matchesPaedisCaseFilter(student, caseFilter, query) {
  const sheetState = resolveSheetState(student);
  if (caseFilter === 'sin-ajustes' && (student.ajustesAprobados?.length || 0) > 0) return false;
  if (caseFilter === 'pendiente-ficha' && isSheetNotifiedState(sheetState)) return false;
  if (caseFilter === 'riesgo' && Number(student.attendanceRate ?? 100) >= 70) return false;

  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fields = [student.fullName || student.nombre, student.rut, student.email, student.career];
  return fields.some((val) => String(val || '').toLowerCase().includes(q));
}

function extractSourceCourses(student) {
  const enrolled = Array.isArray(student?.enrolledCourses) ? student.enrolledCourses : [];
  if (enrolled.length > 0) return enrolled;

  const attendance = Array.isArray(student?.courseAttendance) ? student.courseAttendance : [];
  return attendance.map((c) => ({
    sigla: c.courseCode,
    nombre: c.courseName,
    profesor: 'Docente Titular',
  }));
}

function mergeCourseAcknowledgments(student) {
  const rawAcks = Array.isArray(student?.acusesDocentes) ? student.acusesDocentes : [];
  const existingMap = new Map(rawAcks.map((ack) => [String(ack.sigla || '').toUpperCase(), ack]));
  const seen = new Set();
  const merged = [];

  for (const course of extractSourceCourses(student)) {
    const sigla = String(course.sigla || course.courseCode || '').trim().toUpperCase();
    const nombre = String(course.nombre || course.courseName || '').trim();
    if (!sigla || seen.has(sigla)) continue;
    seen.add(sigla);

    const match = existingMap.get(sigla);
    merged.push({
      sigla,
      nombre: nombre || match?.nombre || sigla,
      profesor: course.profesor || match?.profesor || 'Docente Titular',
      confirmado: Boolean(match?.confirmado),
      fechaAcuse: match?.fechaAcuse || null,
    });
  }

  for (const [sigla, ack] of existingMap) {
    if (!seen.has(sigla)) {
      merged.push(ack);
      seen.add(sigla);
    }
  }

  return merged;
}

function updateSimulatorRiskCounters(student, counters) {
  const isRisk = Number(student.attendanceRate ?? 100) < 70;
  if (student.hasUsedSimulator) {
    counters.simAdopted++;
    if (isRisk) counters.simAtRisk++;
  } else if (isRisk) {
    counters.noSimAtRisk++;
  }
}

function computePaedisAnalytics(paedisStudents) {
  const total = paedisStudents.length;
  const barrierCounts = {
    'Visual / Sensorial': 0,
    'Auditiva / LSCh': 0,
    'Física / Motora': 0,
    'Neurodivergencia': 0,
    'Psicosocial / Cognitiva': 0,
  };
  const riskCounters = { simAdopted: 0, simAtRisk: 0, noSimAtRisk: 0 };
  let withAdjustments = 0;
  let notifiedCount = 0;

  for (const s of paedisStudents) {
    const barrier = inferBarrierCategory(s);
    barrierCounts[barrier] = (barrierCounts[barrier] || 0) + 1;
    if (Array.isArray(s.ajustesAprobados) && s.ajustesAprobados.length > 0) withAdjustments++;
    if (isSheetNotifiedState(resolveSheetState(s))) notifiedCount++;

    updateSimulatorRiskCounters(s, riskCounters);
  }

  return {
    total,
    barrierCounts,
    withAdjustments,
    notifiedCount,
    coveragePct: total > 0 ? Math.round((withAdjustments / total) * 100) : 0,
    simAdopted: riskCounters.simAdopted,
    simAtRisk: riskCounters.simAtRisk,
    noSimAtRisk: riskCounters.noSimAtRisk,
  };
}

function buildDocenteConfidentialText(
  student,
  adjustments = [],
  acknowledgments = [],
  semester = '2026-1',
  sheetState = 'BORRADOR'
) {
  const effectiveSemester = student?.vigenciaSemestrePaedis || semester;
  const adjustmentLines =
    adjustments.length > 0
      ? adjustments.map(
          (adj, idx) =>
            `${idx + 1}. [${adj.tipo}] (Vigencia: ${adj.semestreVigencia || effectiveSemester})\n   ${adj.descripcion}`
        )
      : ['  - Sin ajustes curriculares específicos registrados.'];

  const ackLines =
    acknowledgments.length > 0
      ? acknowledgments.map(
          (ack) =>
            `  - [${ack.sigla}] ${ack.nombre} | Docente: ${ack.profesor} | Estado: ${
              ack.confirmado ? 'Acuse Confirmado' : 'Pendiente de Entrega Manual'
            }`
        )
      : ['  - Ficha general aplicable a la carga académica vigente del periodo.'];

  return [
    '====================================================================',
    'FICHA DOCENTE CONFIDENCIAL DE AJUSTES RAZONABLES - PAEDIS DUOC UC',
    `Sede: ${student?.campus || DEFAULT_CAMPUS} | Periodo Académico: ${effectiveSemester} | Estado: ${sheetState}`,
    'Normativa: Cumplimiento Ley N° 21.719 (Protección de Datos Personales)',
    '====================================================================',
    `Estudiante: ${student?.fullName || student?.nombre || ''}`,
    `RUT: ${student?.rut || 'No informado'} | Correo: ${student?.email || ''}`,
    `Carrera: ${student?.career || student?.carrera || ''}`,
    '',
    '[CAPA 2: AJUSTES OPERATIVOS DE AULA Y EVALUACIÓN]',
    '[AVISO DE PRIVACIDAD LEY N° 21.719]',
    'Este documento NO contiene diagnósticos clínicos, notas de salud ni antecedentes',
    'médicos protegidos por confidencialidad. Contiene exclusivamente las adecuaciones',
    'pedagógicas y evaluativas acordadas para el periodo vigente.',
    '',
    '[MODALIDAD DE ENTREGA: PREPARACIÓN Y EXPORTACIÓN MANUAL]',
    'La generación o descarga de este archivo deja la ficha en estado PREPARADA',
    'o PENDIENTE_ENVIO; el envío o entrega debe registrarse manualmente con evidencia.',
    '',
    'AJUSTES RAZONABLES APROBADOS:',
    ...adjustmentLines,
    '',
    'TRAZABILIDAD DOCENTE POR ASIGNATURA INSCRITA:',
    ...ackLines,
    '====================================================================',
  ].join('\n');
}

function PaedisAnalyticsHeader({ analytics, getVoiceProps }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <Card
        variant="interactive"
        padding="md"
        {...getVoiceProps(
          `Total estudiantes PAEDIS: ${analytics.total}. Cobertura de ajustes: ${analytics.coveragePct} por ciento.`
        )}
        className="bg-white rounded-2xl border border-neutral-300 border-t-4 border-t-brand-navy p-4 shadow-xs space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            Estudiantes PAEDIS Activos
          </span>
          <HeartHandshake className="w-4 h-4 text-brand-navy" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-neutral-900">{analytics.total}</span>
          <span className="text-xs font-semibold text-neutral-600">estudiantes activos</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px] text-neutral-700 pt-1 border-t border-neutral-100">
          <span>Visual: <strong>{analytics.barrierCounts['Visual / Sensorial'] || 0}</strong></span>
          <span>Auditiva: <strong>{analytics.barrierCounts['Auditiva / LSCh'] || 0}</strong></span>
          <span>Motora: <strong>{analytics.barrierCounts['Física / Motora'] || 0}</strong></span>
          <span>Neurodivergencia: <strong>{analytics.barrierCounts['Neurodivergencia'] || 0}</strong></span>
        </div>
      </Card>

      <Card
        variant="interactive"
        padding="md"
        {...getVoiceProps(
          `Cobertura de ajustes razonables: ${analytics.coveragePct} por ciento. ${analytics.notifiedCount} fichas docentes enviadas o entregadas.`
        )}
        className="bg-white rounded-2xl border border-neutral-300 border-t-4 border-t-emerald-600 p-4 shadow-xs space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            Tasa de Cobertura de Ajustes
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-950">{analytics.coveragePct}%</span>
          <span className="text-xs font-semibold text-neutral-600">
            ({analytics.withAdjustments}/{analytics.total}) con ajustes
          </span>
        </div>
        <p className="text-[11px] text-neutral-600 pt-1 border-t border-neutral-100">
          {analytics.notifiedCount} ficha(s) docente(s) en estado Enviada, Entregada o Acusada.
        </p>
      </Card>

      <Card
        variant="interactive"
        padding="md"
        {...getVoiceProps(
          `Adopción del simulador: ${analytics.simAdopted} de ${analytics.total} estudiantes lo han utilizado.`
        )}
        className="bg-white rounded-2xl border border-neutral-300 border-t-4 border-t-amber-500 p-4 shadow-xs space-y-2 sm:col-span-2 lg:col-span-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            Simulador Toma de Ramos
          </span>
          <BookOpen className="w-4 h-4 text-amber-800" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-950">{analytics.simAdopted}</span>
          <span className="text-xs font-semibold text-neutral-600">de {analytics.total} usan el simulador</span>
        </div>
        <p className="text-[11px] text-neutral-600 pt-1 border-t border-neutral-100">
          {analytics.simAtRisk > 0
            ? `${analytics.simAtRisk} estudiante(s) en alerta temprana utilizan la herramienta.`
            : 'Fomenta la inscripción oportuna y sin choques de horario.'}
        </p>
      </Card>
    </div>
  );
}

function PaedisStudentList({
  students,
  selectedKey,
  onSelectStudent,
  getVoiceProps,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-neutral-700 px-1">
        <span>Estudiantes PAEDIS</span>
        <span className="text-neutral-500 font-semibold">{students.length} registrados</span>
      </div>

      <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
        {students.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-600 bg-white rounded-2xl border border-neutral-300">
            No se encontraron estudiantes para este filtro.
          </div>
        ) : (
          students.map((s) => {
            const key = resolveStudentKey(s);
            const isSelected = key === selectedKey;
            const barrier = inferBarrierCategory(s);
            const adjustmentsCount = Array.isArray(s.ajustesAprobados) ? s.ajustesAprobados.length : 0;
            const sheetState = resolveSheetState(s);
            const stateMeta = DOCENTE_SHEET_STATES[sheetState] || DOCENTE_SHEET_STATES.BORRADOR;
            const semester = s.vigenciaSemestrePaedis || '2026-1';

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectStudent(s)}
                aria-pressed={isSelected}
                {...getVoiceProps(
                  `Estudiante ${s.fullName || s.nombre}, barrera ${barrier}, ${adjustmentsCount} ajustes, ficha ${stateMeta.label}, periodo ${semester}`
                )}
                className={`w-full min-h-[44px] text-left block p-3.5 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold ${
                  isSelected
                    ? 'bg-brand-navy text-white border-brand-navy shadow-sm ring-2 ring-brand-gold'
                    : 'bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                    {s.fullName || s.nombre}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/20 text-brand-gold'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    {semester}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isSelected ? 'text-amber-300' : 'text-neutral-600'
                    }`}
                  >
                    {barrier}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      isSelected ? 'bg-white/15 text-white border-white/30' : stateMeta.badgeClass
                    }`}
                  >
                    {stateMeta.label}
                  </span>
                </div>

                <div className={`text-xs truncate mt-1 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {s.career || s.carrera} • {adjustmentsCount} ajuste(s)
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function PaedisAdjustmentsManager({
  adjustments,
  currentSemester,
  newAdjustment,
  onNewAdjustmentChange,
  onAddPreset,
  onAddCustom,
  onRemoveAdjustment,
  getVoiceProps,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          Ajustes Razonables Aprobados ({adjustments.length}) • Periodo {currentSemester}
        </h4>
        <span className="text-[11px] text-neutral-500">
          Aprobación rápida por botón o medida pedagógica personalizada
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ADJUSTMENT_PRESETS.map((preset) => (
          <Button
            key={preset.tipo}
            variant="outline"
            size="sm"
            onClick={() => onAddPreset(preset)}
            {...getVoiceProps(`Agregar ajuste rápido: ${preset.tipo}`)}
            className="min-h-[44px] px-3 py-1.5 bg-blue-50 hover:bg-brand-navy text-brand-navy hover:text-white border border-blue-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{preset.tipo}</span>
          </Button>
        ))}
      </div>

      {adjustments.length === 0 ? (
        <p className="text-xs text-neutral-500 italic bg-neutral-50 p-3 rounded-xl border border-neutral-200">
          Sin ajustes aprobados para este periodo. Selecciona un ajuste rápido o registra una medida abajo.
        </p>
      ) : (
        <ul className="space-y-2">
          {adjustments.map((adj) => (
            <li
              key={`${adj.tipo}-${adj.descripcion}`}
              className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-3"
            >
              <div className="space-y-1 text-xs min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-brand-navy">{adj.tipo}</strong>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    Vigencia: {adj.semestreVigencia || currentSemester}
                  </span>
                </div>
                <p className="text-neutral-700 leading-relaxed">{adj.descripcion}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveAdjustment(adj)}
                {...getVoiceProps(`Revocar ajuste ${adj.tipo}`)}
                className="min-h-[42px] px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Revocar</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAddCustom} className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
        <Input
          type="text"
          value={newAdjustment.tipo}
          onChange={(e) => onNewAdjustmentChange({ ...newAdjustment, tipo: e.target.value })}
          placeholder="Nombre del ajuste (ej. Pausas sensoriales)"
          aria-label="Nombre del ajuste personalizado"
          className="sm:col-span-4 min-h-[44px] px-3 py-2 border border-neutral-300 rounded-xl text-xs text-neutral-900"
        />
        <Input
          type="text"
          value={newAdjustment.descripcion}
          onChange={(e) => onNewAdjustmentChange({ ...newAdjustment, descripcion: e.target.value })}
          placeholder="Descripción pedagógica para el docente en aula..."
          aria-label="Descripción del ajuste personalizado"
          className="sm:col-span-6 min-h-[44px] px-3 py-2 border border-neutral-300 rounded-xl text-xs text-neutral-900"
        />
        <Button
          type="submit"
          {...getVoiceProps('Agregar ajuste razonable personalizado')}
          className="sm:col-span-2 min-h-[44px] px-4 py-2 bg-brand-navy hover:bg-brand-navyDark text-white font-bold text-xs rounded-xl inline-flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Añadir</span>
        </Button>
      </form>
    </div>
  );
}

function DocenteSheetModal({
  isOpen,
  onClose,
  student,
  adjustments,
  acknowledgments,
  sheetState,
  sheetHistory,
  onToggleAck,
  onTransitionSheetState,
  isSaving,
  announce,
  getVoiceProps,
}) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  const [targetState, setTargetState] = useState(sheetState || 'BORRADOR');
  const [medioEntrega, setMedioEntrega] = useState('Entrega manual / Correo institucional');
  const [evidencia, setEvidencia] = useState('');
  const [transitionError, setTransitionError] = useState('');

  useEffect(() => {
    setTargetState(sheetState || 'BORRADOR');
    setTransitionError('');
  }, [sheetState, isOpen]);

  useAccessibleModal({
    isOpen,
    onClose,
    containerRef: modalRef,
    initialFocusRef: closeBtnRef,
  });

  useOnClickOutside(modalRef, onClose, { enabled: isOpen });

  if (!isOpen || !student) return null;

  const currentSemester = student.vigenciaSemestrePaedis || '2026-1';
  const currentMeta = DOCENTE_SHEET_STATES[sheetState] || DOCENTE_SHEET_STATES.BORRADOR;

  const handleDownloadTxt = async () => {
    const content = buildDocenteConfidentialText(
      student,
      adjustments,
      acknowledgments,
      currentSemester,
      sheetState
    );
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Ficha_Docente_PAEDIS_${(student.rut || 'estudiante').replace(/[^0-9kK]/g, '')}_${currentSemester}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);

    // Descargar .txt pasa a PREPARADA (o mantiene PENDIENTE_ENVIO); NUNCA marca ENVIADA/ENTREGADA/notificada automáticamente
    const nextDownloadState = sheetState === 'PENDIENTE_ENVIO' ? 'PENDIENTE_ENVIO' : 'PREPARADA';
    announce('Ficha Docente descargada en .txt. Estado registrado como PREPARADA para entrega manual.', 'polite');
    await onTransitionSheetState?.(nextDownloadState, {
      medioEntrega: 'Descarga archivo .txt',
      evidencia: 'Documento generado y descargado localmente (pendiente de envío o entrega manual).',
    });
  };

  const handleSubmitTransition = async (e) => {
    e.preventDefault();
    setTransitionError('');

    if (isSheetNotifiedState(targetState) && !evidencia.trim()) {
      const msg = 'Para marcar como ENVIADA, ENTREGADA o ACUSADA debes ingresar una nota de entrega manual o evidencia.';
      setTransitionError(msg);
      announce(msg, 'assertive');
      return;
    }

    const ok = await onTransitionSheetState?.(targetState, {
      medioEntrega: medioEntrega.trim() || 'Gestión manual PAEDIS',
      evidencia: evidencia.trim(),
    });
    if (ok) {
      setEvidencia('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha Docente Confidencial • ${currentSemester}`}
      size="xl"
      initialFocusRef={closeBtnRef}
    >
      <div className="space-y-5">
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>Privacidad Clínica Resguardada (Ley N° 21.719):</strong> Esta ficha omite
              el diagnóstico clínico declarado y las notas privadas de entrevista (Capa 1),
              exhibiendo solo las adecuaciones pedagógicas aplicables en aula y certámenes (Capa 2).
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${currentMeta.badgeClass}`}>
            Estado actual: {currentMeta.label} ({currentMeta.code})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
          <div>
            <span className="text-neutral-500 font-semibold block">Estudiante</span>
            <strong className="text-neutral-900">{student.fullName || student.nombre}</strong>
          </div>
          <div>
            <span className="text-neutral-500 font-semibold block">RUT • Sede</span>
            <strong className="text-neutral-900">
              {student.rut || 'Sin RUT'} • {student.campus || DEFAULT_CAMPUS}
            </strong>
          </div>
          <div>
            <span className="text-neutral-500 font-semibold block">Periodo de Vigencia</span>
            <strong className="text-brand-navy font-black">Semestre {currentSemester}</strong>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Adecuaciones Pedagógicas Aprobadas ({adjustments.length})
          </h4>
          {adjustments.length === 0 ? (
            <p className="text-xs text-neutral-500 italic bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              No hay ajustes razonables aprobados todavía para este periodo.
            </p>
          ) : (
            <ul className="space-y-2">
              {adjustments.map((adj) => (
                <li
                  key={`${adj.tipo}-${adj.descripcion}`}
                  className="p-3.5 rounded-xl bg-white border border-neutral-200 text-xs flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong className="text-neutral-900 block">{adj.tipo}</strong>
                    <span className="text-neutral-700 block mt-0.5">{adj.descripcion}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Trazabilidad de Acuse de Recibo Docente por Asignatura
          </h4>
          {acknowledgments.length === 0 ? (
            <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              Sin asignaturas inscritas sincronizadas aún para trazabilidad individual; la Ficha Docente
              cubre toda la carga académica vigente del periodo.
            </p>
          ) : (
            <Card variant="outlined" padding="md">
              <div className="border border-neutral-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                  <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                    <tr>
                      <th scope="col" className="p-2.5">Sigla</th>
                      <th scope="col" className="p-2.5">Asignatura / Docente</th>
                      <th scope="col" className="p-2.5 text-right">Acuse Docente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {acknowledgments.map((ack) => (
                      <tr key={ack.sigla}>
                        <td className="p-2.5 font-mono font-bold text-brand-navy">{ack.sigla}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-neutral-900 block">{ack.nombre}</span>
                          <span className="text-[11px] text-neutral-500">{ack.profesor}</span>
                        </td>
                        <td className="p-2.5 text-right">
                          <Button
                            type="button"
                            onClick={() => onToggleAck(ack.sigla)}
                            aria-pressed={ack.confirmado}
                            {...getVoiceProps(
                              `Acuse docente de ${ack.nombre}, ${ack.confirmado ? 'confirmado' : 'pendiente'}`
                            )}
                            className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              ack.confirmado
                                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                                : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                            }`}
                          >
                            {ack.confirmado ? 'Acuse Confirmado ✓' : 'Marcar Acuse'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Transición explícita de estado con evidencia / nota de entrega manual */}
        <form onSubmit={handleSubmitTransition} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Registro de Estado y Entrega Manual de Ficha Docente
            </h4>
            <span className="text-[11px] text-neutral-600">
              Descargar el archivo .txt solo marca PREPARADA (no enviada).
            </span>
          </div>

          {transitionError && (
            <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold">
              {transitionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sheet-state-select" className="block text-xs font-bold text-neutral-700 mb-1">
                Estado de la Ficha
              </label>
              <select
                id="sheet-state-select"
                value={targetState}
                onChange={(e) => {
                  setTargetState(e.target.value);
                  setTransitionError('');
                }}
                disabled={isSaving}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-900"
              >
                {Object.values(DOCENTE_SHEET_STATES).map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code} — {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sheet-delivery-method" className="block text-xs font-bold text-neutral-700 mb-1">
                Medio de Entrega
              </label>
              <Input
                id="sheet-delivery-method"
                type="text"
                disabled={isSaving}
                value={medioEntrega}
                onChange={(e) => setMedioEntrega(e.target.value)}
                placeholder="Ej. Entrega presencial / Correo institucional manual"
                className="w-full min-h-[40px] px-3 py-1.5 border border-neutral-300 rounded-xl text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sheet-delivery-evidence" className="block text-xs font-bold text-neutral-700 mb-1">
              Nota de Entrega Manual / Evidencia {isSheetNotifiedState(targetState) ? '(Obligatoria para Enviada/Entregada/Acusada)' : '(Opcional)'}
            </label>
            <Input
              id="sheet-delivery-evidence"
              type="text"
              disabled={isSaving}
              value={evidencia}
              onChange={(e) => {
                setEvidencia(e.target.value);
                setTransitionError('');
              }}
              placeholder="Ej. Entregada a docente titular en reunión de coordinación / Folio de recepción..."
              className="w-full min-h-[40px] px-3 py-1.5 border border-neutral-300 rounded-xl text-xs bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={handleDownloadTxt}
              {...getVoiceProps('Descargar Ficha Docente Confidencial en formato texto seguro')}
              className="min-h-[44px] px-4 py-2 inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Descargar Ficha (.txt)</span>
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              loading={isSaving}
              {...getVoiceProps('Registrar transición de estado de Ficha Docente')}
              className="min-h-[44px] px-5 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-brand-gold" aria-hidden="true" />
              <span>{isSaving ? 'Guardando...' : 'Registrar Estado de Ficha'}</span>
            </Button>
          </div>
        </form>

        {Array.isArray(sheetHistory) && sheetHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Historial de Estados de la Ficha ({sheetHistory.length})
            </h4>
            <ul className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
              {sheetHistory.map((h, idx) => (
                <li key={`${h.estado}-${h.fecha}-${idx}`} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong className="text-brand-navy">{h.estado}</strong>
                    {h.medioEntrega && <span className="text-neutral-600"> • {h.medioEntrega}</span>}
                    {h.evidencia && <p className="text-neutral-600 mt-0.5">{h.evidencia}</p>}
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    {h.actorEmail || ''} {h.fecha ? `• ${new Date(h.fecha).toLocaleString('es-CL')}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

export const PaedisManagement = ({
  students = [],
  onStudentUpdated,
  announce: announceProp,
}) => {
  const { announce: contextAnnounce, getVoiceProps } = useAccessibility();
  const announce = announceProp || contextAnnounce;

  const paedisStudents = useMemo(
    () => (Array.isArray(students) ? students.filter(isPaedisStudentRecord) : []),
    [students]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [caseFilter, setCaseFilter] = useState('all');
  const [selectedKey, setSelectedKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [isDocenteModalOpen, setIsDocenteModalOpen] = useState(false);

  const [formState, setFormState] = useState({
    barreraPaedis: 'Visual / Sensorial',
    acreditacionPaedis: 'Credencial RND SENADIS / COMPIN',
    diagnosticoDeclarado: '',
    notasConfidencialesPaedis: '',
    voiceReaderByDefault: false,
    clearReadingByDefault: false,
    highContrastByDefault: false,
    dyslexicFontByDefault: false,
    vigenciaSemestrePaedis: '2026-1',
    ajustesAprobados: [],
    acusesDocentes: [],
    fichaDocenteEstado: 'BORRADOR',
    fichaDocenteHistorial: [],
  });

  const [newAdjustment, setNewAdjustment] = useState({ tipo: '', descripcion: '' });

  const filteredStudents = useMemo(
    () => paedisStudents.filter((s) => matchesPaedisCaseFilter(s, caseFilter, searchQuery)),
    [paedisStudents, searchQuery, caseFilter]
  );

  const selectedStudent = useMemo(
    () =>
      paedisStudents.find((s) => resolveStudentKey(s) === selectedKey) ||
      filteredStudents[0] ||
      paedisStudents[0] ||
      null,
    [paedisStudents, filteredStudents, selectedKey]
  );

  useEffect(() => {
    if (!selectedStudent) return;
    const key = resolveStudentKey(selectedStudent);
    const isVisual =
      inferBarrierCategory(selectedStudent) === 'Visual / Sensorial' ||
      /visual|ciego|no vidente|baja visi[oó]n/i.test(selectedStudent.diagnosticoDeclarado || '');

    setFormState({
      barreraPaedis: inferBarrierCategory(selectedStudent),
      acreditacionPaedis: selectedStudent.acreditacionPaedis || 'Credencial RND SENADIS / COMPIN',
      diagnosticoDeclarado: selectedStudent.diagnosticoDeclarado || '',
      notasConfidencialesPaedis: selectedStudent.notasConfidencialesPaedis || '',
      voiceReaderByDefault:
        typeof selectedStudent.accessibilityPreferences?.voiceReader === 'boolean'
          ? selectedStudent.accessibilityPreferences.voiceReader
          : isVisual,
      clearReadingByDefault: Boolean(selectedStudent.accessibilityPreferences?.clearReadingMode),
      highContrastByDefault: Boolean(selectedStudent.accessibilityPreferences?.highContrast),
      dyslexicFontByDefault: Boolean(selectedStudent.accessibilityPreferences?.dyslexicFont),
      vigenciaSemestrePaedis: selectedStudent.vigenciaSemestrePaedis || '2026-1',
      ajustesAprobados: Array.isArray(selectedStudent.ajustesAprobados)
        ? selectedStudent.ajustesAprobados
        : [],
      acusesDocentes: mergeCourseAcknowledgments(selectedStudent),
      fichaDocenteEstado: resolveSheetState(selectedStudent),
      fichaDocenteHistorial: Array.isArray(selectedStudent.fichaDocenteHistorial)
        ? selectedStudent.fichaDocenteHistorial
        : [],
    });
    setStatusFeedback(null);

    let active = true;
    api.getPaedisRecord(key).then((res) => {
      if (!active || !res?.success || !res?.record) return;
      const rec = res.record;
      setFormState((prev) => ({
        ...prev,
        barreraPaedis: rec.barreraPaedis || prev.barreraPaedis,
        acreditacionPaedis: rec.acreditacionPaedis || prev.acreditacionPaedis,
        diagnosticoDeclarado: rec.diagnosticoDeclarado ?? prev.diagnosticoDeclarado,
        notasConfidencialesPaedis: rec.notasConfidenciales ?? prev.notasConfidencialesPaedis,
        vigenciaSemestrePaedis: rec.vigenciaSemestrePaedis || prev.vigenciaSemestrePaedis,
        ajustesAprobados: Array.isArray(rec.ajustesAprobados) && rec.ajustesAprobados.length > 0 ? rec.ajustesAprobados : prev.ajustesAprobados,
        fichaDocenteEstado: rec.fichaDocenteEstado || prev.fichaDocenteEstado,
        fichaDocenteHistorial: Array.isArray(rec.fichaDocenteHistorial) ? rec.fichaDocenteHistorial : prev.fichaDocenteHistorial,
      }));
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [selectedStudent]);

  const analytics = useMemo(() => computePaedisAnalytics(paedisStudents), [paedisStudents]);

  const appendAdjustment = (tipo, descripcion) => {
    const duplicate = formState.ajustesAprobados.some(
      (a) => a.tipo.toLowerCase() === tipo.toLowerCase() && a.descripcion.toLowerCase() === descripcion.toLowerCase()
    );
    if (duplicate) {
      announce(`El ajuste ${tipo} ya está aprobado para este estudiante.`, 'polite');
      return false;
    }
    setFormState((prev) => ({
      ...prev,
      ajustesAprobados: [
        ...prev.ajustesAprobados,
        {
          tipo,
          descripcion,
          fechaAprobacion: new Date().toISOString(),
          semestreVigencia: prev.vigenciaSemestrePaedis || '2026-1',
        },
      ],
    }));
    announce(`Ajuste agregado: ${tipo}`, 'polite');
    return true;
  };

  const handleAddCustomAdjustment = (e) => {
    e.preventDefault();
    const tipo = newAdjustment.tipo.trim();
    const descripcion = newAdjustment.descripcion.trim();
    if (!tipo || !descripcion) return;
    if (appendAdjustment(tipo, descripcion)) {
      setNewAdjustment({ tipo: '', descripcion: '' });
    }
  };

  const handleRemoveAdjustment = (targetAdj) => {
    setFormState((prev) => ({
      ...prev,
      ajustesAprobados: prev.ajustesAprobados.filter(
        (adj) => adj.tipo !== targetAdj.tipo || adj.descripcion !== targetAdj.descripcion
      ),
    }));
    announce(`Ajuste revocado: ${targetAdj.tipo}`, 'polite');
  };

  const handleToggleTeacherAck = (sigla) => {
    setFormState((prev) => ({
      ...prev,
      acusesDocentes: prev.acusesDocentes.map((ack) =>
        ack.sigla === sigla
          ? {
              ...ack,
              confirmado: !ack.confirmado,
              fechaAcuse: !ack.confirmado ? new Date().toISOString() : null,
            }
          : ack
      ),
    }));
  };

  const handleRenewSemester = async () => {
    if (!selectedStudent) return;
    const currentSem = formState.vigenciaSemestrePaedis || '2026-1';
    let nextSem = '2026-2';
    const match = currentSem.match(/^(\d{4})-(\d)$/);
    if (match) {
      const year = Number.parseInt(match[1], 10);
      const sem = Number.parseInt(match[2], 10);
      nextSem = sem === 1 ? `${year}-2` : `${year + 1}-1`;
    }

    const renewedAdjustments = formState.ajustesAprobados.map((adj) => ({
      ...adj,
      semestreVigencia: nextSem,
      fechaAprobacion: new Date().toISOString(),
    }));

    const renewalNote = `[Renovación ${nextSem}]: Ajustes vigentes extendidos automáticamente para el periodo ${nextSem}.`;
    const updatedNotes = formState.notasConfidencialesPaedis
      ? `${formState.notasConfidencialesPaedis}\n${renewalNote}`
      : renewalNote;

    setFormState((prev) => ({
      ...prev,
      vigenciaSemestrePaedis: nextSem,
      ajustesAprobados: renewedAdjustments,
      notasConfidencialesPaedis: updatedNotes,
      fichaDocenteEstado: 'BORRADOR',
    }));

    setIsSaving(true);
    setStatusFeedback(null);
    try {
      const payload = {
        vigenciaSemestrePaedis: nextSem,
        renewForSemester: nextSem,
        ajustesAprobados: renewedAdjustments,
        notasConfidencialesPaedis: updatedNotes,
        fichaDocenteEstado: 'BORRADOR',
        fichaDocenteNotificada: false,
      };
      const res = await api.updatePaedisCase(resolveStudentKey(selectedStudent), payload);
      if (!res?.success) throw new Error(res?.message || 'Error al renovar semestre.');
      if (onStudentUpdated && res.student) onStudentUpdated(res.student);

      const msg = `Expediente renovado exitosamente para el periodo ${nextSem}. Ficha docente restablecida a BORRADOR.`;
      setStatusFeedback({ type: 'success', text: msg });
      announce(msg, 'polite');
    } catch (err) {
      const msg = err?.message || 'Error al renovar semestre.';
      setStatusFeedback({ type: 'error', text: msg });
      announce(msg, 'assertive');
    } finally {
      setIsSaving(false);
    }
  };

  const persistPaedisCase = async (explicitSheetState = null, transitionMeta = null) => {
    if (!selectedStudent) return false;
    setIsSaving(true);
    setStatusFeedback(null);

    const nextSheetState = explicitSheetState || formState.fichaDocenteEstado || 'BORRADOR';
    const notifiedFlag = isSheetNotifiedState(nextSheetState);

    try {
      const payload = {
        ...formState,
        vigenciaSemestrePaedis: formState.vigenciaSemestrePaedis || '2026-1',
        ajustesAprobados: formState.ajustesAprobados.map((a) => ({
          ...a,
          semestreVigencia: a.semestreVigencia || formState.vigenciaSemestrePaedis || '2026-1',
        })),
        fichaDocenteEstado: nextSheetState,
        fichaDocenteNotificada: notifiedFlag,
        ...(transitionMeta?.medioEntrega ? { medioEntrega: transitionMeta.medioEntrega } : {}),
        ...(transitionMeta?.evidencia ? { evidencia: transitionMeta.evidencia } : {}),
        accessibilityPreferences: {
          ...(selectedStudent.accessibilityPreferences || {}),
          voiceReader: Boolean(formState.voiceReaderByDefault),
          clearReadingMode: Boolean(formState.clearReadingByDefault),
          highContrast: Boolean(formState.highContrastByDefault),
          dyslexicFont: Boolean(formState.dyslexicFontByDefault),
          screenReaderOptimized: true,
        },
      };
      const res = await api.updatePaedisCase(resolveStudentKey(selectedStudent), payload);
      if (!res?.success) {
        throw new Error(res?.message || 'No se pudo actualizar el expediente PAEDIS.');
      }

      const historyFromServer = res.record?.fichaDocenteHistorial || res.student?.fichaDocenteHistorial;
      setFormState((prev) => ({
        ...prev,
        fichaDocenteEstado: res.record?.fichaDocenteEstado || res.student?.fichaDocenteEstado || nextSheetState,
        fichaDocenteHistorial: Array.isArray(historyFromServer)
          ? historyFromServer
          : explicitSheetState
            ? [
                {
                  estado: nextSheetState,
                  fecha: new Date().toISOString(),
                  medioEntrega: transitionMeta?.medioEntrega || '',
                  evidencia: transitionMeta?.evidencia || '',
                },
                ...(prev.fichaDocenteHistorial || []),
              ]
            : prev.fichaDocenteHistorial,
      }));

      if (onStudentUpdated && res.student) onStudentUpdated(res.student);

      const stateLabel = DOCENTE_SHEET_STATES[nextSheetState]?.label || nextSheetState;
      const successMsg = explicitSheetState
        ? `Estado de Ficha Docente actualizado a ${nextSheetState} (${stateLabel}).`
        : (res.message || 'Expediente PAEDIS actualizado correctamente.');
      setStatusFeedback({ type: 'success', text: successMsg });
      announce(successMsg, 'polite');
      return true;
    } catch (err) {
      const errorMsg = err?.message || 'Error al guardar el expediente PAEDIS.';
      setStatusFeedback({ type: 'error', text: errorMsg });
      announce(errorMsg, 'assertive');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSheetState = formState.fichaDocenteEstado || 'BORRADOR';
  const selectedSheetMeta = DOCENTE_SHEET_STATES[selectedSheetState] || DOCENTE_SHEET_STATES.BORRADOR;

  return (
    <section aria-labelledby="paedis-ops-heading" className="space-y-6 w-full max-w-full overflow-x-clip">
      {/* CABECERA */}
      <div className={`${ADMIN_THEME.cardSurface} border-t-4 border-t-brand-navy flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Centro de Operaciones PAEDIS • Gestión en 2 Capas (Ley N° 21.719)</span>
          </div>
          <h2 id="paedis-ops-heading" className={ADMIN_THEME.moduleTitle}>
            Gestión PAEDIS & Ajustes Razonables ({DEFAULT_CAMPUS})
          </h2>
          <p className={ADMIN_THEME.moduleSubtitle}>
            Segregación estricta entre expediente clínico confidencial (Capa 1) y adecuaciones pedagógicas de aula por semestre (Capa 2).
          </p>
        </div>

        {selectedStudent && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${selectedSheetMeta.badgeClass}`}>
              Ficha: {selectedSheetMeta.label}
            </span>
            <Button
              type="button"
              onClick={() => setIsDocenteModalOpen(true)}
              {...getVoiceProps('Abrir Ficha Docente Confidencial de Ajustes Razonables')}
              className="min-h-[42px] px-4 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs shrink-0 focus-visible:ring-4 focus-visible:ring-amber-400"
            >
              <FileText className="w-4 h-4 text-brand-gold" aria-hidden="true" />
              <span>Ver Ficha Docente ({formState.vigenciaSemestrePaedis || '2026-1'})</span>
            </Button>
          </div>
        )}
      </div>

      <PaedisAnalyticsHeader analytics={analytics} getVoiceProps={getVoiceProps} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PANEL IZQUIERDO: LISTA DE ESTUDIANTES */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, RUT o correo..."
              aria-label="Buscar estudiante PAEDIS"
              {...getVoiceProps('Buscar estudiante PAEDIS por nombre, RUT o correo')}
              className={`w-full pl-10 pr-3 ${ADMIN_THEME.controlInput}`}
            />
          </div>

          <div
            className="flex items-center gap-1 overflow-x-auto pb-1"
            role="group"
            aria-label="Filtros de estudiantes PAEDIS"
          >
            {CASE_FILTERS.map((f) => (
              <Button
                key={f.id}
                variant={caseFilter === f.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCaseFilter(f.id)}
                {...getVoiceProps(`Filtrar por ${f.label}`)}
                className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  caseFilter === f.id
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <PaedisStudentList
            students={filteredStudents}
            selectedKey={resolveStudentKey(selectedStudent)}
            onSelectStudent={(s) => setSelectedKey(resolveStudentKey(s))}
            getVoiceProps={getVoiceProps}
          />
        </div>

        {/* PANEL DERECHO: EXPEDIENTE EN 2 CAPAS */}
        <div className={`lg:col-span-8 ${ADMIN_THEME.cardSurface} space-y-6`}>
          {!selectedStudent ? (
            <div className="p-12 text-center text-neutral-500 font-bold">
              Selecciona un estudiante de la lista para gestionar su expediente.
            </div>
          ) : (
            <>
              {/* ENCABEZADO DEL CASO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                <div>
                  <span className={`${ADMIN_THEME.cardLabel} text-brand-navy block`}>
                    Expediente Estudiantil • {selectedStudent.rut || 'Sin RUT'}
                  </span>
                  <h3 className={ADMIN_THEME.sectionTitle}>
                    {selectedStudent.fullName || selectedStudent.nombre}
                  </h3>
                  <p className={ADMIN_THEME.metaText}>
                    {selectedStudent.career || selectedStudent.carrera} • {selectedStudent.email}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    Number(selectedStudent.attendanceRate ?? 100) < 70
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  Asistencia: {selectedStudent.attendanceRate ?? 'Sin datos'}%
                </span>
              </div>

              {statusFeedback && (
                <div
                  role={statusFeedback.type === 'error' ? 'alert' : 'status'}
                  aria-live={statusFeedback.type === 'error' ? 'assertive' : 'polite'}
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    statusFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  {statusFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
                  )}
                  <span>{statusFeedback.text}</span>
                </div>
              )}

              {/* CAPA 1: EXPEDIENTE CONFIDENCIAL */}
              <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-200 text-purple-950">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-purple-950 block">
                        Capa 1: Expediente Clínico y Confidencial (Ley N° 21.719)
                      </span>
                      <span className="text-[11px] font-medium text-neutral-600 block">
                        Exclusivo de Coordinación PAEDIS • Resguardo clínico estricto
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-950 border border-purple-300">
                    Solo Coordinación
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="paedis-barrier" className="block text-xs font-bold text-neutral-700 mb-1">
                      Tipo de Barrera / Necesidad
                    </label>
                    <Select
                      id="paedis-barrier"
                      value={formState.barreraPaedis}
                      onChange={(e) => setFormState({ ...formState, barreraPaedis: e.target.value })}
                      options={BARRIER_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                      className={`w-full ${ADMIN_THEME.controlInput}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="paedis-accreditation" className="block text-xs font-bold text-neutral-700 mb-1">
                      Acreditación Presentada
                    </label>
                    <Select
                      id="paedis-accreditation"
                      value={formState.acreditacionPaedis}
                      onChange={(e) => setFormState({ ...formState, acreditacionPaedis: e.target.value })}
                      options={ACCREDITATION_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                      className={`w-full ${ADMIN_THEME.controlInput}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="paedis-diagnosis" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Diagnóstico o Condición Declarada (Confidencial)
                  </label>
                  <Input
                    id="paedis-diagnosis"
                    value={formState.diagnosticoDeclarado}
                    onChange={(e) =>
                      setFormState({ ...formState, diagnosticoDeclarado: e.target.value })
                    }
                    placeholder="Ej. Baja visión bilateral, Hipoacusia moderada, Condición del espectro autista..."
                    className="w-full min-h-[44px] px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="paedis-notes" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Bitácora Confidencial de Acompañamiento y Entrevista PAEDIS
                  </label>
                  <textarea
                    id="paedis-notes"
                    rows={3}
                    value={formState.notasConfidencialesPaedis}
                    onChange={(e) =>
                      setFormState({ ...formState, notasConfidencialesPaedis: e.target.value })
                    }
                    placeholder="Notas de acogida, acuerdos de seguimiento y confidencialidad..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs text-neutral-900 bg-white resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-purple-200/80 space-y-2">
                  <span className="text-xs font-bold text-neutral-800 block">
                    Perfil de Accesibilidad Inicial (Pre-activación automática en el inicio de sesión):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-purple-200 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.voiceReaderByDefault)}
                        onChange={(e) => setFormState({ ...formState, voiceReaderByDefault: e.target.checked })}
                        className="w-4 h-4 text-brand-navy rounded border-neutral-300"
                      />
                      <span className="font-semibold text-neutral-800">Lector de voz al iniciar</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-purple-200 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.clearReadingByDefault)}
                        onChange={(e) => setFormState({ ...formState, clearReadingByDefault: e.target.checked })}
                        className="w-4 h-4 text-brand-navy rounded border-neutral-300"
                      />
                      <span className="font-semibold text-neutral-800">Lectura clara y resumida</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-purple-200 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.highContrastByDefault)}
                        onChange={(e) => setFormState({ ...formState, highContrastByDefault: e.target.checked })}
                        className="w-4 h-4 text-brand-navy rounded border-neutral-300"
                      />
                      <span className="font-semibold text-neutral-800">Alto contraste visual</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-purple-200 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.dyslexicFontByDefault)}
                        onChange={(e) => setFormState({ ...formState, dyslexicFontByDefault: e.target.checked })}
                        className="w-4 h-4 text-brand-navy rounded border-neutral-300"
                      />
                      <span className="font-semibold text-neutral-800">Tipografía de lectura cómoda</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* CAPA 2: AJUSTES RAZONABLES OPERATIVOS */}
              <div className="p-5 rounded-2xl bg-white border-2 border-neutral-200 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-brand-navy">
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-brand-navy block">
                        Capa 2: Ajustes Razonables Operativos (Aula & Evaluación)
                      </span>
                      <span className="text-[11px] text-neutral-600 font-medium">
                        Medidas pedagógicas sin datos clínicos • Emitidas en Ficha Docente
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">Vigencia</span>
                      <span className="text-xs font-black text-brand-navy px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                        {formState.vigenciaSemestrePaedis || '2026-1'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={handleRenewSemester}
                      {...getVoiceProps('Renovar ajustes razonables para siguiente semestre')}
                      className="min-h-[44px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer focus-visible:ring-4 focus-visible:ring-amber-400 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Renovar para Siguiente Semestre</span>
                    </Button>
                  </div>
                </div>

                <PaedisAdjustmentsManager
                  adjustments={formState.ajustesAprobados}
                  currentSemester={formState.vigenciaSemestrePaedis || '2026-1'}
                  newAdjustment={newAdjustment}
                  onNewAdjustmentChange={setNewAdjustment}
                  onAddPreset={(p) => appendAdjustment(p.tipo, p.descripcion)}
                  onAddCustom={handleAddCustomAdjustment}
                  onRemoveAdjustment={handleRemoveAdjustment}
                  getVoiceProps={getVoiceProps}
                />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  onClick={() => setIsDocenteModalOpen(true)}
                  {...getVoiceProps('Generar y previsualizar Ficha Docente Confidencial')}
                  className="min-h-[44px] px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 text-brand-navy font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-brand-navy" aria-hidden="true" />
                  <span>Gestionar Ficha Docente ({selectedSheetMeta.label})</span>
                </Button>

                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    persistPaedisCase(null).catch((err) => {
                      console.error('[PaedisCaseManagement] Error guardando:', err);
                    });
                  }}
                  {...getVoiceProps('Guardar cambios del expediente PAEDIS')}
                  className="min-h-[44px] px-5 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-brand-gold" aria-hidden="true" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Expediente PAEDIS'}</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <DocenteSheetModal
        isOpen={isDocenteModalOpen}
        onClose={() => setIsDocenteModalOpen(false)}
        student={selectedStudent}
        adjustments={formState.ajustesAprobados}
        acknowledgments={formState.acusesDocentes}
        sheetState={selectedSheetState}
        sheetHistory={formState.fichaDocenteHistorial}
        onToggleAck={handleToggleTeacherAck}
        onTransitionSheetState={(nextEstado, meta) => persistPaedisCase(nextEstado, meta)}
        isSaving={isSaving}
        announce={announce}
        getVoiceProps={getVoiceProps}
      />
    </section>
  );
};

export default PaedisManagement;
