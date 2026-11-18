import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HeartHandshake,
  Search,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  X,
  Lock,
  Save,
  Laptop,
  Send,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import { DEFAULT_CAMPUS } from '../../utils/studentUtils';

const BARRIER_OPTIONS = [
  'Visual / Sensorial',
  'Auditiva / LSCh',
  'Física / Motora',
  'Neurodivergencia / TEA',
  'Psicosocial / Cognitiva',
];

const ACCREDITATION_OPTIONS = [
  'Credencial RND SENADIS / COMPIN',
  'Certificado Médico Especialista',
  'Informe Psicopedagógico / Escolar',
  'En Proceso de Acreditación',
];

const SUPPORT_STAFF_OPTIONS = [
  'Coordinación PAEDIS Duoc UC',
  'Valentina Soto (Tutora Par PAEDIS)',
  'Intérprete LSCh Institucional',
  'Apoyo UAP / Psicopedagogía',
  'Servicio TransVoz / Transcripción',
  'Sin tutor asignado',
];

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
    tipo: 'Puesto preferente / Accesibilidad motora',
    descripcion: 'Ubicación preferencial en primera fila, mobiliario ergonómico y acceso universal.',
  },
];

function resolveStudentKey(student) {
  return student?.id || student?._id || student?.email || '';
}

function inferBarrierCategory(student) {
  if (student?.barreraPaedis) return student.barreraPaedis;
  const diag = String(student?.diagnosticoDeclarado || '').toLowerCase();
  if (/audit|sord|hipoac|lsch/.test(diag)) return 'Auditiva / LSCh';
  if (/motor|físic|fisic|silla|movil/.test(diag)) return 'Física / Motora';
  if (/tea|espectro|neuro|tdah|asperger/.test(diag)) return 'Neurodivergencia / TEA';
  if (/psicosoc|cognit|ansiedad|aprend/.test(diag)) return 'Psicosocial / Cognitiva';
  return 'Visual / Sensorial';
}

function mergeCourseAcknowledgments(student) {
  const existingMap = new Map(
    (Array.isArray(student?.acusesDocentes) ? student.acusesDocentes : []).map((ack) => [
      String(ack.sigla || '').toUpperCase(),
      ack,
    ])
  );

  const enrolled = Array.isArray(student?.enrolledCourses) ? student.enrolledCourses : [];
  const attendanceFallback = Array.isArray(student?.courseAttendance)
    ? student.courseAttendance.map((c) => ({
        sigla: c.courseCode,
        nombre: c.courseName,
        profesor: 'Docente Titular',
      }))
    : [];

  const sourceCourses = enrolled.length > 0 ? enrolled : attendanceFallback;
  const seen = new Set();
  const merged = [];

  for (const course of sourceCourses) {
    const sigla = String(course.sigla || course.courseCode || '').trim().toUpperCase();
    const nombre = String(course.nombre || course.courseName || '').trim();
    if (!sigla || !nombre || seen.has(sigla)) continue;
    seen.add(sigla);

    const existing = existingMap.get(sigla);
    merged.push({
      sigla,
      nombre,
      profesor: existing?.profesor || course.profesor || 'Docente Titular',
      confirmado: Boolean(existing?.confirmado),
      fechaAcuse: existing?.fechaAcuse || null,
    });
  }

  return merged;
}

function computePaedisAnalytics(paedisStudents) {
  const total = paedisStudents.length;
  const barrierCounts = {
    'Visual / Sensorial': 0,
    'Auditiva / LSCh': 0,
    'Física / Motora': 0,
    'Neurodivergencia / TEA': 0,
    'Psicosocial / Cognitiva': 0,
  };
  const tutorLoadMap = new Map();

  let withAdjustments = 0;
  let notifiedCount = 0;
  let simAdopted = 0;
  let simAtRisk = 0;
  let noSimAtRisk = 0;

  for (const s of paedisStudents) {
    const barrier = inferBarrierCategory(s);
    barrierCounts[barrier] = (barrierCounts[barrier] || 0) + 1;

    if (Array.isArray(s.ajustesAprobados) && s.ajustesAprobados.length > 0) {
      withAdjustments++;
    }
    if (s.fichaDocenteNotificada) {
      notifiedCount++;
    }

    const rate = Number(s.attendanceRate ?? 88.9);
    const isRisk = rate < 75;
    if (s.hasUsedSimulator) {
      simAdopted++;
      if (isRisk) simAtRisk++;
    } else if (isRisk) {
      noSimAtRisk++;
    }

    const tutor = s.tutorParAsignado || 'Sin tutor asignado';
    tutorLoadMap.set(tutor, (tutorLoadMap.get(tutor) || 0) + 1);
  }

  const coveragePct = total > 0 ? Math.round((withAdjustments / total) * 100) : 0;
  const simPct = total > 0 ? Math.round((simAdopted / total) * 100) : 0;
  const tutorDistribution = Array.from(tutorLoadMap.entries()).sort((a, b) => b[1] - a[1]);

  return {
    total,
    barrierCounts,
    withAdjustments,
    notifiedCount,
    coveragePct,
    simAdopted,
    simPct,
    simAtRisk,
    noSimAtRisk,
    tutorDistribution,
  };
}

function buildDocenteConfidentialText(student, adjustments, acknowledgments) {
  const lines = [
    '====================================================================',
    'FICHA DOCENTE CONFIDENCIAL DE AJUSTES RAZONABLES - PAEDIS DUOC UC',
    `Sede: ${student?.campus || DEFAULT_CAMPUS} | Cumplimiento Ley N° 21.719`,
    '====================================================================',
    `Estudiante: ${student?.fullName || student?.nombre || ''}`,
    `RUT: ${student?.rut || 'No informado'} | Correo: ${student?.email || ''}`,
    `Carrera: ${student?.career || student?.carrera || ''}`,
    `Apoyo Humano/Técnico Asignado: ${student?.tutorParAsignado || 'Coordinación PAEDIS Duoc UC'}`,
    '',
    '[CONFIDENCIALIDAD LEY N° 21.719]',
    'Se omiten diagnóstico clínico y notas de entrevista psicoeducativa.',
    'Este documento detalla únicamente los ajustes pedagógicos aplicables en aula.',
    '',
    'AJUSTES RAZONABLES APROBADOS:',
    ...(adjustments.length > 0
      ? adjustments.map((a, i) => `  ${i + 1}. ${a.tipo}: ${a.descripcion}`)
      : ['  - Sin ajustes registrados actualmente.']),
    '',
    'TRAZABILIDAD DOCENTE POR ASIGNATURA INSCRITA:',
    ...(acknowledgments.length > 0
      ? acknowledgments.map(
          (ack) =>
            `  - ${ack.sigla} | ${ack.nombre} (${ack.profesor}): ${
              ack.confirmado ? 'ACUSE CONFIRMADO' : 'PENDIENTE DE ACUSE'
            }`
        )
      : ['  - Ficha general aplicable a la carga académica vigente del periodo.']),
    '====================================================================',
  ];
  return lines.join('\n');
}

function PaedisKpiSummary({ analytics, getVoiceProps }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        {...getVoiceProps(
          `Estudiantes PAEDIS activos: ${analytics.total}. Desglose por barrera de apoyo`
        )}
        className="bg-white rounded-2xl border border-slate-300 border-t-4 border-t-[#002B49] p-4 shadow-xs space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Cobertura PAEDIS • {DEFAULT_CAMPUS}
          </span>
          <HeartHandshake className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">{analytics.total}</span>
          <span className="text-xs font-semibold text-slate-600">estudiantes activos</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 pt-1 border-t border-slate-100">
          <span>Visual: <strong>{analytics.barrierCounts['Visual / Sensorial'] || 0}</strong></span>
          <span>Auditiva: <strong>{analytics.barrierCounts['Auditiva / LSCh'] || 0}</strong></span>
          <span>Motora: <strong>{analytics.barrierCounts['Física / Motora'] || 0}</strong></span>
          <span>TEA/Neuro: <strong>{analytics.barrierCounts['Neurodivergencia / TEA'] || 0}</strong></span>
        </div>
      </div>

      <div
        {...getVoiceProps(
          `Cobertura de ajustes razonables: ${analytics.coveragePct} por ciento. ${analytics.notifiedCount} fichas docentes notificadas.`
        )}
        className="bg-white rounded-2xl border border-slate-300 border-t-4 border-t-emerald-600 p-4 shadow-xs space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Tasa de Cobertura de Ajustes
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-700">{analytics.coveragePct}%</span>
          <span className="text-xs font-semibold text-slate-600">
            ({analytics.withAdjustments}/{analytics.total} con ajustes)
          </span>
        </div>
        <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
          <strong>{analytics.notifiedCount}</strong> con Ficha Docente emitida •{' '}
          <strong>{Math.max(0, analytics.total - analytics.notifiedCount)}</strong> pendientes
        </p>
      </div>

      <div
        {...getVoiceProps(
          `Cruce Simulador Toma de Ramos y Riesgo RI: ${analytics.simPct} por ciento adopta el simulador.`
        )}
        className="bg-white rounded-2xl border border-slate-300 border-t-4 border-t-[#FFB81C] p-4 shadow-xs space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Simulador vs Riesgo RI (&lt;75%)
          </span>
          <Laptop className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-[#002B49]">{analytics.simPct}%</span>
          <span className="text-xs font-semibold text-slate-600">
            usa Simulador ({analytics.simAdopted})
          </span>
        </div>
        <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
          Riesgo &lt;75% con simulador: <strong>{analytics.simAtRisk}</strong> • sin simulador:{' '}
          <strong className="text-rose-700">{analytics.noSimAtRisk}</strong>
        </p>
      </div>

      <div
        {...getVoiceProps('Distribución de carga de tutores pares e intérpretes PAEDIS')}
        className="bg-white rounded-2xl border border-slate-300 border-t-4 border-t-slate-700 p-4 shadow-xs space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Carga Apoyo Humano / Técnico
          </span>
          <UserCheck className="w-4 h-4 text-slate-700" aria-hidden="true" />
        </div>
        <div className="space-y-1 max-h-[82px] overflow-y-auto pr-1 text-[11px]">
          {analytics.tutorDistribution.map(([tutorName, count]) => (
            <div key={tutorName} className="flex items-center justify-between gap-2 text-slate-700">
              <span className="truncate font-medium">{tutorName}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-[#002B49] shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocenteSheetModal({
  isOpen,
  onClose,
  student,
  adjustments,
  acknowledgments,
  onToggleAck,
  onConfirmNotify,
  isSaving,
  tutorParAsignado,
  announce,
  getVoiceProps,
}) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  useAccessibleModal({
    isOpen,
    onClose,
    containerRef: modalRef,
    initialFocusRef: closeBtnRef,
  });

  if (!isOpen || !student) return null;

  const handleDownloadTxt = () => {
    const content = buildDocenteConfidentialText(
      { ...student, tutorParAsignado },
      adjustments,
      acknowledgments
    );
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Ficha_Docente_PAEDIS_${(student.rut || 'estudiante').replace(/[^0-9kK]/g, '')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    announce('Ficha Docente Confidencial descargada en formato texto seguro.', 'polite');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="docente-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white w-full max-w-3xl rounded-2xl border border-slate-300 border-t-4 border-t-[#002B49] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col focus:outline-none"
      >
        <header className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50 shrink-0">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Ficha Docente Confidencial • Ley N° 21.719</span>
            </span>
            <h3 id="docente-sheet-title" className="text-lg sm:text-xl font-black text-slate-900">
              Ficha de Ajustes Razonables para Docentes de Aula
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Resumen pedagógico para docentes de {student.fullName || student.nombre} ({student.career})
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar Ficha Docente Confidencial"
            {...getVoiceProps('Cerrar Ficha Docente Confidencial')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>Privacidad Clínica Resguardada (Ley N° 21.719):</strong> Esta ficha omite
              automáticamente el diagnóstico clínico declarado y las notas privadas de entrevista,
              exhibiendo solo las adecuaciones pedagógicas aplicables en clase y evaluaciones.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Estudiante</span>
              <strong className="text-slate-900">{student.fullName || student.nombre}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">RUT • Sede</span>
              <strong className="text-slate-900">
                {student.rut || 'Sin RUT'} • {student.campus || DEFAULT_CAMPUS}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Apoyo PAEDIS Asignado</span>
              <strong className="text-slate-900">{tutorParAsignado}</strong>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#002B49]">
              Adecuaciones Pedagógicas Aprobadas ({adjustments.length})
            </h4>
            {adjustments.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                No hay ajustes razonables aprobados todavía. Agrega medidas antes de emitir la ficha.
              </p>
            ) : (
              <ul className="space-y-2">
                {adjustments.map((adj, idx) => (
                  <li
                    key={`${adj.tipo}-${idx}`}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <strong className="text-slate-900 block">{adj.tipo}</strong>
                      <span className="text-slate-700">{adj.descripcion}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#002B49]">
              Trazabilidad de Acuse de Recibo Docente por Asignatura
            </h4>
            {acknowledgments.length === 0 ? (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Sin asignaturas inscritas sincronizadas aún para trazabilidad individual; la Ficha Docente
                cubre toda la carga académica vigente del periodo.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th scope="col" className="p-2.5">Sigla</th>
                      <th scope="col" className="p-2.5">Asignatura / Docente</th>
                      <th scope="col" className="p-2.5 text-right">Acuse Docente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {acknowledgments.map((ack) => (
                      <tr key={ack.sigla}>
                        <td className="p-2.5 font-mono font-bold text-[#002B49]">{ack.sigla}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-slate-900 block">{ack.nombre}</span>
                          <span className="text-[11px] text-slate-500">{ack.profesor}</span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => onToggleAck(ack.sigla)}
                            aria-pressed={ack.confirmado}
                            {...getVoiceProps(
                              `Acuse docente de ${ack.nombre}, ${ack.confirmado ? 'confirmado' : 'pendiente'}`
                            )}
                            className={`min-h-[34px] px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              ack.confirmado
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {ack.confirmado ? '✓ Confirmado' : 'Marcar Acuse'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              {...getVoiceProps('Exportar Ficha Docente en archivo de texto')}
              className="min-h-[40px] px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
              <span>Exportar (.txt)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              {...getVoiceProps('Imprimir Ficha Docente Confidencial')}
              className="min-h-[40px] px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
              <span>Imprimir</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onConfirmNotify}
            {...getVoiceProps('Notificar y Emitir Ficha Docente Confidencial')}
            className="min-h-[42px] px-5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
            <span>{isSaving ? 'Registrando...' : 'Notificar y Emitir Ficha'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Centro de Operaciones de Inclusión y Continuidad Académica (PAEDIS • Duoc UC Sede Alameda).
 * Implementa gestión de ciclo de vida de ajustes razonables, carga de tutores pares e intérpretes,
 * KPIs de cobertura e impacto, y emisión de Ficha Docente Confidencial conforme a la Ley N° 21.719.
 */
export const PaedisCaseManagementSection = ({ students = [], onStudentUpdated, announce }) => {
  const { getVoiceProps } = useAccessibility();

  const paedisStudents = useMemo(
    () =>
      students
        .filter(
          (s) =>
            (s.isPaedis === true || s.role === 'estudiante_paedis') &&
            (s.role?.startsWith('estudiante') ||
              s.role === 'tutor_par' ||
              s.email === 'c.guzman@duocuc.cl')
        )
        .sort((a, b) =>
          (a.fullName || a.nombre || '').localeCompare(b.fullName || b.nombre || '', 'es', {
            sensitivity: 'base',
          })
        ),
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
    tutorParAsignado: 'Coordinación PAEDIS Duoc UC',
    diagnosticoDeclarado: '',
    notasConfidencialesPaedis: '',
    ajustesAprobados: [],
    acusesDocentes: [],
  });

  const [newAdjustment, setNewAdjustment] = useState({ tipo: '', descripcion: '' });

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return paedisStudents.filter((s) => {
      if (caseFilter === 'sin-ajustes' && (s.ajustesAprobados?.length || 0) > 0) return false;
      if (caseFilter === 'pendiente-ficha' && s.fichaDocenteNotificada) return false;
      if (caseFilter === 'riesgo' && Number(s.attendanceRate ?? 100) >= 75) return false;
      if (!q) return true;
      return (
        (s.fullName || s.nombre || '').toLowerCase().includes(q) ||
        (s.rut || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.career || '').toLowerCase().includes(q)
      );
    });
  }, [paedisStudents, searchQuery, caseFilter]);

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
    setFormState({
      barreraPaedis: inferBarrierCategory(selectedStudent),
      acreditacionPaedis: selectedStudent.acreditacionPaedis || 'Credencial RND SENADIS / COMPIN',
      tutorParAsignado: selectedStudent.tutorParAsignado || 'Coordinación PAEDIS Duoc UC',
      diagnosticoDeclarado: selectedStudent.diagnosticoDeclarado || '',
      notasConfidencialesPaedis: selectedStudent.notasConfidencialesPaedis || '',
      ajustesAprobados: Array.isArray(selectedStudent.ajustesAprobados)
        ? selectedStudent.ajustesAprobados
        : [],
      acusesDocentes: mergeCourseAcknowledgments(selectedStudent),
    });
    setStatusFeedback(null);
  }, [selectedStudent]);

  const analytics = useMemo(() => computePaedisAnalytics(paedisStudents), [paedisStudents]);

  const handleAddPresetAdjustment = (preset) => {
    const alreadyExists = formState.ajustesAprobados.some(
      (a) => a.tipo.toLowerCase() === preset.tipo.toLowerCase()
    );
    if (alreadyExists) {
      announce(`El ajuste ${preset.tipo} ya está aprobado para este estudiante.`, 'polite');
      return;
    }
    setFormState((prev) => ({
      ...prev,
      ajustesAprobados: [
        ...prev.ajustesAprobados,
        { tipo: preset.tipo, descripcion: preset.descripcion, fechaAprobacion: new Date().toISOString() },
      ],
    }));
    announce(`Ajuste agregado: ${preset.tipo}`, 'polite');
  };

  const handleAddCustomAdjustment = (e) => {
    e.preventDefault();
    const tipo = newAdjustment.tipo.trim();
    const descripcion = newAdjustment.descripcion.trim();
    if (!tipo || !descripcion) return;

    setFormState((prev) => ({
      ...prev,
      ajustesAprobados: [
        ...prev.ajustesAprobados,
        { tipo, descripcion, fechaAprobacion: new Date().toISOString() },
      ],
    }));
    setNewAdjustment({ tipo: '', descripcion: '' });
    announce(`Ajuste razonable agregado: ${tipo}`, 'polite');
  };

  const handleRemoveAdjustment = (index) => {
    const target = formState.ajustesAprobados[index];
    setFormState((prev) => ({
      ...prev,
      ajustesAprobados: prev.ajustesAprobados.filter((_, idx) => idx !== index),
    }));
    if (target) {
      announce(`Ajuste revocado: ${target.tipo}`, 'polite');
    }
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

  const persistPaedisCase = async (notifyDocentes = false) => {
    if (!selectedStudent) return;
    const studentId = resolveStudentKey(selectedStudent);
    setIsSaving(true);
    setStatusFeedback(null);

    try {
      const payload = {
        ...formState,
        ...(notifyDocentes ? { fichaDocenteNotificada: true } : {}),
      };
      const res = await api.updatePaedisCase(studentId, payload);
      if (!res?.success) {
        throw new Error(res?.message || 'No se pudo actualizar el expediente PAEDIS.');
      }
      if (onStudentUpdated && res.student) {
        onStudentUpdated(res.student);
      }
      const successMsg = res.message || 'Expediente PAEDIS actualizado correctamente.';
      setStatusFeedback({ type: 'success', text: successMsg });
      announce(successMsg, 'polite');
      if (notifyDocentes) {
        setIsDocenteModalOpen(false);
      }
    } catch (err) {
      const errorMsg = err?.message || 'Error al guardar el expediente PAEDIS.';
      setStatusFeedback({ type: 'error', text: errorMsg });
      announce(errorMsg, 'assertive');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-labelledby="paedis-ops-heading" className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-300 border-t-4 border-t-[#002B49] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-[#002B49] border border-amber-300">
            <Lock className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
            <span>Centro de Operaciones PAEDIS • Confidencial Ley N° 21.719</span>
          </div>
          <h2 id="paedis-ops-heading" className="text-xl sm:text-2xl font-black text-slate-900">
            Gestión PAEDIS &amp; Ajustes Razonables ({DEFAULT_CAMPUS})
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Ciclo de vida de adecuaciones académicas, asignación de tutores pares e intérpretes LSCh y
            emisión de Ficha Docente Confidencial sin exponer datos clínicos sensibles.
          </p>
        </div>

        {selectedStudent && (
          <button
            type="button"
            onClick={() => setIsDocenteModalOpen(true)}
            {...getVoiceProps('Abrir Ficha Docente Confidencial de Ajustes Razonables')}
            className="min-h-[44px] px-4 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
            <span>Ficha Docente Confidencial</span>
          </button>
        )}
      </div>

      <PaedisKpiSummary analytics={analytics} getVoiceProps={getVoiceProps} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Selector de Estudiantes PAEDIS */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-300 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">
              Nómina PAEDIS ({filteredStudents.length})
            </h3>
            <span className="text-[11px] font-bold text-[#002B49] bg-slate-100 px-2 py-0.5 rounded">
              {DEFAULT_CAMPUS}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante, RUT o carrera..."
              aria-label="Buscar estudiante PAEDIS"
              {...getVoiceProps('Buscar estudiante PAEDIS por nombre, RUT o carrera')}
              className="w-full min-h-[40px] pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar casos PAEDIS">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pendiente-ficha', label: 'Ficha Pendiente' },
              { id: 'sin-ajustes', label: 'Sin Ajustes' },
              { id: 'riesgo', label: 'Riesgo <75%' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={caseFilter === f.id}
                onClick={() => setCaseFilter(f.id)}
                {...getVoiceProps(`Filtrar casos PAEDIS: ${f.label}`)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  caseFilter === f.id
                    ? 'bg-[#002B49] text-white border-[#002B49]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="max-h-[470px] overflow-y-auto space-y-1.5 pr-1">
            {filteredStudents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No se encontraron estudiantes PAEDIS con ese filtro.
              </p>
            ) : (
              filteredStudents.map((s) => {
                const key = resolveStudentKey(s);
                const isSelected = selectedStudent && resolveStudentKey(selectedStudent) === key;
                const adjustmentsCount = s.ajustesAprobados?.length || 0;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedKey(key)}
                    {...getVoiceProps(
                      `${s.fullName || s.nombre}, ${adjustmentsCount} ajustes aprobados, ${
                        s.fichaDocenteNotificada ? 'ficha docente emitida' : 'ficha pendiente'
                      }`
                    )}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-[#002B49] text-white border-[#002B49] shadow-sm'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-900 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{s.fullName || s.nombre}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          s.fichaDocenteNotificada
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-950'
                        }`}
                      >
                        {s.fichaDocenteNotificada ? 'Emitida' : 'Pendiente'}
                      </span>
                    </div>
                    <div
                      className={`text-[11px] truncate ${
                        isSelected ? 'text-slate-200' : 'text-slate-600'
                      }`}
                    >
                      {s.career || s.carrera} • {adjustmentsCount} ajuste(s)
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Expediente Confidencial y Ciclo de Vida de Ajustes */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-300 shadow-xs p-5 sm:p-6 space-y-5">
          {!selectedStudent ? (
            <p className="text-sm text-slate-600 text-center py-10">
              Selecciona un estudiante PAEDIS para gestionar sus ajustes razonables.
            </p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold text-[#002B49] uppercase tracking-wider">
                    Expediente Estudiantil • {selectedStudent.rut || 'Sin RUT'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {selectedStudent.fullName || selectedStudent.nombre}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {selectedStudent.career || selectedStudent.carrera} • {selectedStudent.email}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      Number(selectedStudent.attendanceRate ?? 100) < 75
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    Asistencia: {selectedStudent.attendanceRate ?? 88.9}%
                  </span>
                </div>
              </div>

              {statusFeedback && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
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

              {/* Datos de Acreditación y Asignación de Apoyos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="paedis-barrier" className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Barrera / Apoyo
                  </label>
                  <select
                    id="paedis-barrier"
                    value={formState.barreraPaedis}
                    onChange={(e) => setFormState({ ...formState, barreraPaedis: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                  >
                    {BARRIER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="paedis-accreditation" className="block text-xs font-bold text-slate-700 mb-1">
                    Acreditación Presentada
                  </label>
                  <select
                    id="paedis-accreditation"
                    value={formState.acreditacionPaedis}
                    onChange={(e) =>
                      setFormState({ ...formState, acreditacionPaedis: e.target.value })
                    }
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                  >
                    {ACCREDITATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="paedis-tutor" className="block text-xs font-bold text-slate-700 mb-1">
                    Tutor Par / Intérprete Asignado
                  </label>
                  <select
                    id="paedis-tutor"
                    value={formState.tutorParAsignado}
                    onChange={(e) =>
                      setFormState({ ...formState, tutorParAsignado: e.target.value })
                    }
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                  >
                    {!SUPPORT_STAFF_OPTIONS.includes(formState.tutorParAsignado) && (
                      <option value={formState.tutorParAsignado}>
                        {formState.tutorParAsignado}
                      </option>
                    )}
                    {SUPPORT_STAFF_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diagnóstico Declarado y Notas Confidenciales */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#002B49] inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Registro Clínico &amp; Entrevista Inicial (Oculto en Ficha Docente)</span>
                  </span>
                </div>

                <div>
                  <label htmlFor="paedis-diagnosis" className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnóstico o Condición Declarada
                  </label>
                  <input
                    id="paedis-diagnosis"
                    type="text"
                    value={formState.diagnosticoDeclarado}
                    onChange={(e) =>
                      setFormState({ ...formState, diagnosticoDeclarado: e.target.value })
                    }
                    placeholder="Ej. Baja visión bilateral, Hipoacusia moderada, TEA grado 1..."
                    className="w-full min-h-[40px] px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="paedis-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                    Bitácora Confidencial de Entrevista PAEDIS
                  </label>
                  <textarea
                    id="paedis-notes"
                    rows={3}
                    value={formState.notasConfidencialesPaedis}
                    onChange={(e) =>
                      setFormState({ ...formState, notasConfidencialesPaedis: e.target.value })
                    }
                    placeholder="Notas de entrevista de acogida, acuerdos de seguimiento y confidencialidad..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Gestor de Ajustes Razonables */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ajustes Razonables Aprobados ({formState.ajustesAprobados.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Aprobación rápida con un clic o medida personalizada
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ADJUSTMENT_PRESETS.map((preset) => (
                    <button
                      key={preset.tipo}
                      type="button"
                      onClick={() => handleAddPresetAdjustment(preset)}
                      {...getVoiceProps(`Agregar ajuste rápido: ${preset.tipo}`)}
                      className="min-h-[34px] px-2.5 py-1 bg-blue-50 hover:bg-[#002B49] text-[#002B49] hover:text-white border border-blue-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" aria-hidden="true" />
                      <span>{preset.tipo}</span>
                    </button>
                  ))}
                </div>

                {formState.ajustesAprobados.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    Sin ajustes aprobados. Selecciona un ajuste rápido o registra una medida abajo.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {formState.ajustesAprobados.map((adj, idx) => (
                      <li
                        key={`${adj.tipo}-${idx}`}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5 text-xs">
                          <strong className="text-[#002B49] block">{adj.tipo}</strong>
                          <p className="text-slate-700">{adj.descripcion}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdjustment(idx)}
                          aria-label={`Revocar ajuste ${adj.tipo}`}
                          {...getVoiceProps(`Revocar ajuste ${adj.tipo}`)}
                          className="min-h-[34px] px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Revocar</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={handleAddCustomAdjustment} className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                  <input
                    type="text"
                    value={newAdjustment.tipo}
                    onChange={(e) => setNewAdjustment({ ...newAdjustment, tipo: e.target.value })}
                    placeholder="Nombre del ajuste (ej. Pausas sensoriales)"
                    aria-label="Nombre del ajuste personalizado"
                    className="sm:col-span-4 min-h-[40px] px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    value={newAdjustment.descripcion}
                    onChange={(e) =>
                      setNewAdjustment({ ...newAdjustment, descripcion: e.target.value })
                    }
                    placeholder="Descripción pedagógica para el docente en aula..."
                    aria-label="Descripción del ajuste personalizado"
                    className="sm:col-span-6 min-h-[40px] px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <button
                    type="submit"
                    {...getVoiceProps('Agregar ajuste razonable personalizado')}
                    className="sm:col-span-2 min-h-[40px] px-3 py-2 bg-slate-800 hover:bg-[#002B49] text-white font-bold text-xs rounded-xl inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Añadir</span>
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsDocenteModalOpen(true)}
                  {...getVoiceProps('Generar y previsualizar Ficha Docente Confidencial')}
                  className="min-h-[42px] px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#002B49] font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span>Generar Ficha Docente</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    persistPaedisCase(false).catch((err) => {
                      console.error('[PaedisCaseManagementSection] Error guardando:', err);
                    });
                  }}
                  {...getVoiceProps('Guardar cambios del expediente PAEDIS')}
                  className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Expediente PAEDIS'}</span>
                </button>
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
        onToggleAck={handleToggleTeacherAck}
        onConfirmNotify={() => {
          persistPaedisCase(true).catch((err) => {
            console.error('[PaedisCaseManagementSection] Error notificando ficha:', err);
          });
        }}
        isSaving={isSaving}
        tutorParAsignado={formState.tutorParAsignado}
        announce={announce}
        getVoiceProps={getVoiceProps}
      />
    </section>
  );
};
