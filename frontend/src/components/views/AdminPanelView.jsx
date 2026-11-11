import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Search,
  UserPlus,
  Laptop,
  HeartHandshake,
  Calendar,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  Info,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

export const AdminPanelView = () => {
  const { announce } = useAccessibility();

  // Estados de datos
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'activo' | 'desercion' | 'titulado' | 'paedis'

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState(null);
  const [statusForm, setStatusForm] = useState({ academicStatus: 'activo', statusReason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Formulario nuevo usuario
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: 'Duoc2026!',
    rut: '',
    role: 'estudiante_paedis',
    isPaedis: true,
    academicStatus: 'activo',
    statusReason: 'Estudiante regular activo',
    attendanceRate: 88,
    career: 'Ingeniería en Informática',
    campus: 'Sede Alameda',
    tutorParAsignado: 'Tania Montes (Coordinación PAEDIS)',
    diagnosticoDeclarado: '',
  });

  // Cargar métricas y estudiantes desde MongoDB
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, studentsRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminStudents(),
      ]);

      if (metricsRes?.success) {
        setMetrics(metricsRes.metrics);
      }
      if (studentsRes?.success) {
        setStudents(studentsRes.students);
      }
    } catch (err) {
      console.error('Error cargando datos del panel de administración:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Error al conectar con la base de datos de administración.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Filtrado de estudiantes
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.rut?.toLowerCase().includes(q) ||
        s.career?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === 'paedis') return s.isPaedis === true;
      if (filterStatus !== 'all') return s.academicStatus === filterStatus;

      return true;
    });
  }, [students, searchTerm, filterStatus]);

  // Manejo de cambio de estado
  const handleOpenStatusModal = (student) => {
    setSelectedStudentForStatus(student);
    setStatusForm({
      academicStatus: student.academicStatus || 'activo',
      statusReason: student.statusReason || '',
    });
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedStudentForStatus) return;

    setIsSubmitting(true);
    try {
      const res = await api.updateStudentStatus(
        selectedStudentForStatus._id || selectedStudentForStatus.id,
        statusForm.academicStatus,
        statusForm.statusReason
      );

      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Estado de ${selectedStudentForStatus.fullName} actualizado a "${statusForm.academicStatus.toUpperCase()}".`,
        });
        announce(`Estado de ${selectedStudentForStatus.fullName} actualizado.`, 'polite');
        setIsStatusModalOpen(false);
        loadAdminData();
      } else {
        setFeedbackMessage({ type: 'error', text: res?.message || 'Error al actualizar estado.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Error de conexión al actualizar estado.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de creación de usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.createAdminStudent({
        ...newUserForm,
        isPaedis: newUserForm.role === 'estudiante_paedis' ? true : newUserForm.isPaedis,
      });

      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Usuario ${newUserForm.fullName} registrado exitosamente en la base de datos.`,
        });
        announce(`Usuario ${newUserForm.fullName} registrado exitosamente.`, 'polite');
        setIsCreateModalOpen(false);
        // Reset form
        setNewUserForm({
          fullName: '',
          email: '',
          password: 'Duoc2026!',
          rut: '',
          role: 'estudiante_paedis',
          isPaedis: true,
          academicStatus: 'activo',
          statusReason: 'Estudiante regular activo',
          attendanceRate: 88,
          career: 'Ingeniería en Informática',
          campus: 'Sede Alameda',
          tutorParAsignado: 'Tania Montes (Coordinación PAEDIS)',
          diagnosticoDeclarado: '',
        });
        loadAdminData();
      } else {
        setFeedbackMessage({ type: 'error', text: res?.message || 'Error al registrar usuario.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Error de conexión al registrar usuario.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de eliminación
  const handleDeleteStudent = async (student) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar de la base de datos a "${student.fullName}"?`
      )
    ) {
      return;
    }

    try {
      const res = await api.deleteStudent(student._id || student.id);
      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Usuario ${student.fullName} eliminado de la base de datos.`,
        });
        loadAdminData();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res?.message || 'No se pudo eliminar el usuario.',
        });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Error de conexión al eliminar usuario.' });
    }
  };

  return (
    <div className="space-y-7 animate-fade-in pb-12">
      {/* 1. HERO BANNER INSTITUCIONAL DUOC UC */}
      <section
        aria-labelledby="admin-panel-title"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#002B49] via-[#003459] to-[#004b7a] text-white p-7 sm:p-9 shadow-lg border border-[#002B49]"
      >
        {/* Glow de fondo decorativo */}
        <div
          className="absolute -right-16 -top-16 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-amber-300 border border-white/15 backdrop-blur-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>MÓDULO EXCLUSIVO ADMINISTRADOR • DUOC UC</span>
            </div>
            <h1
              id="admin-panel-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white"
            >
              Panel de Control & Analítica Predictiva
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
              Supervisión de métricas de plataforma en tiempo real, gestión de perfiles
              institucionales y algoritmo de alerta temprana de retención vs. deserción estudiantil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadAdminData}
              aria-label="Actualizar datos de la base de datos"
              className="min-h-[44px] px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 border border-white/20 backdrop-blur-xs transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              <RefreshCw
                className={`w-4 h-4 text-amber-300 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refrescar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="min-h-[44px] px-5 py-2.5 bg-[#FFB81C] hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" aria-hidden="true" />
              <span>Registrar Estudiante / Usuario</span>
            </button>
          </div>
        </div>
      </section>

      {/* Alerta de Feedback Accesible */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-500 hover:text-slate-900 p-1 rounded-lg"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. TARJETAS KPI EJECUTIVAS */}
      <section aria-labelledby="kpis-heading" className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 id="kpis-heading" className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Métricas Clave de Uso & Matrícula
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Actualización en vivo vía MongoDB
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjeta 1: Total Usuarios */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Registrados
              </span>
              <span className="text-3xl font-black text-slate-950 block tracking-tight">
                {metrics?.totalUsers ?? '...'}
              </span>
              <span className="text-[11px] font-bold text-slate-600 block">
                {metrics?.totalStudents ?? 0} estudiantes • {metrics?.totalFaculty ?? 0} personal
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#002B49] border border-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>

          {/* Tarjeta 2: Estudiantes PAEDIS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Población PAEDIS
              </span>
              <span className="text-3xl font-black text-slate-950 block tracking-tight">
                {metrics?.paedisCount ?? '...'}
              </span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block">
                {metrics?.paedisPercentage ?? 0}% de los estudiantes
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>

          {/* Tarjeta 3: Uso de Simuladores */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Simulador de Ramos
              </span>
              <span className="text-3xl font-black text-slate-950 block tracking-tight">
                {metrics?.simulatorUsersCount ?? '...'}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-block">
                {metrics?.simulatorUsagePercentage ?? 0}% planificó horario
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <Laptop className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>

          {/* Tarjeta 4: Alertas de Deserción */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                En Alerta de Deserción
              </span>
              <span className="text-3xl font-black text-rose-700 block tracking-tight">
                {metrics?.riskSummary?.altoRiesgo ?? '...'}
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md inline-block">
                {metrics?.riskSummary?.medioRiesgo ?? 0} en riesgo moderado
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. ANALÍTICA PREDICTIVA: RETENCIÓN & TITULACIÓN */}
      <section
        aria-labelledby="predictive-analytics-title"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6"
      >
        <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider text-[#002B49] bg-amber-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span>Modelo Predictivo de Inteligencia Académica</span>
            </div>
            <h2
              id="predictive-analytics-title"
              className="text-xl sm:text-2xl font-black text-slate-900 mt-1"
            >
              Predicción de Retención vs. Deserción Estudiantil
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Algoritmo de alerta temprana ponderado por asistencia reglamentaria (&lt; 70% RI),
              acompañamiento PAEDIS y simulación de carga horaria.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Bajo Riesgo</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Riesgo Moderado</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Alto Riesgo</span>
            </span>
          </div>
        </div>

        {/* 3 Columnas de Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Columna 1: Barras de Estado */}
          <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              1. Matrícula y Estados en Base de Datos
            </span>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Estudiantes Activos</span>
                  <span className="font-black text-[#002B49]">
                    {metrics?.statusDistribution?.activo ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#002B49] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((metrics?.statusDistribution?.activo ?? 0) /
                          (metrics?.totalStudents || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>En Deserción / Retiro</span>
                  <span className="font-black text-rose-700">
                    {metrics?.statusDistribution?.desercion ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((metrics?.statusDistribution?.desercion ?? 0) /
                          (metrics?.totalStudents || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Titulados / Egresados</span>
                  <span className="font-black text-emerald-700">
                    {metrics?.statusDistribution?.titulado ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((metrics?.statusDistribution?.titulado ?? 0) /
                          (metrics?.totalStudents || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna 2: Semáforo Predictivo Global */}
          <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              2. Predicción de Retención y Semáforo
            </span>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-2xl font-black text-emerald-950 block">
                  {metrics?.riskSummary?.bajoRiesgo ?? 0}
                </span>
                <span className="text-[10px] font-black text-emerald-800 uppercase mt-0.5 block">
                  Titulación Probable
                </span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-2xl font-black text-amber-950 block">
                  {metrics?.riskSummary?.medioRiesgo ?? 0}
                </span>
                <span className="text-[10px] font-black text-amber-800 uppercase mt-0.5 block">
                  Alerta Preventiva
                </span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-2xl font-black text-rose-950 block">
                  {metrics?.riskSummary?.altoRiesgo ?? 0}
                </span>
                <span className="text-[10px] font-black text-rose-800 uppercase mt-0.5 block">
                  Riesgo Crítico
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              *Los estudiantes en alerta preventiva reciben sugerencias automáticas de asignación de
              tutor PAR y reprogramación de horario.
            </p>
          </div>

          {/* Columna 3: Factores Clave Institucionales */}
          <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              3. Factores Clave de Decisión en Duoc UC
            </span>

            <ul className="space-y-2.5 text-xs font-medium text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-black flex items-center justify-center shrink-0 text-[10px]">
                  RI
                </span>
                <span>
                  <strong>Asistencia menor a 70%:</strong> Detona riesgo de Reprobación por Inasistencia inmediata.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-black flex items-center justify-center shrink-0 text-[10px]">
                  ♿
                </span>
                <span>
                  <strong>Inclusión PAEDIS:</strong> La ficha de ajustes razonables reduce el estrés y la deserción en un 40%.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-[#002B49] font-black flex items-center justify-center shrink-0 text-[10px]">
                  📅
                </span>
                <span>
                  <strong>Simulador de Ramos:</strong> La planificación previa evita choques y sobrecarga de créditos.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. DIRECTORIO Y GESTIÓN DE ESTUDIANTES */}
      <section
        aria-labelledby="students-directory-title"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="students-directory-title"
              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
            >
              Directorio de Estudiantes Registrados ({filteredStudents.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Administra los estados académicos de tu comunidad y analiza el semáforo predictivo de
              cada perfil.
            </p>
          </div>

          {/* Filtros de Estado */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrar por estado"
          >
            {[
              { id: 'all', label: 'Todos' },
              { id: 'activo', label: 'Activos' },
              { id: 'desercion', label: 'Deserción' },
              { id: 'titulado', label: 'Titulados' },
              { id: 'paedis', label: 'Solo PAEDIS' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Búsqueda */}
        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUT, correo institucional o carrera..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
          />
        </div>

        {/* Tabla Accesible y Elegante de Estudiantes */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              Directorio de estudiantes registrados en la base de datos de Nexo360 con cálculos
              predictivos
            </caption>
            <thead className="bg-slate-100/90 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="p-3.5">
                  Estudiante
                </th>
                <th scope="col" className="p-3.5">
                  Carrera / Sede
                </th>
                <th scope="col" className="p-3.5">
                  Asistencia
                </th>
                <th scope="col" className="p-3.5">
                  PAEDIS
                </th>
                <th scope="col" className="p-3.5">
                  Semáforo Predictivo
                </th>
                <th scope="col" className="p-3.5">
                  Estado Académico
                </th>
                <th scope="col" className="p-3.5 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">
                    No se encontraron estudiantes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const pred = student.prediction || {};
                  const isHighRisk = pred.riskLevel === 'ALTO' || pred.riskLevel === 'DESERTOR';
                  const isMediumRisk = pred.riskLevel === 'MEDIO';

                  return (
                    <tr
                      key={student._id || student.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Estudiante */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 border text-xs ${
                              student.role === 'admin'
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : student.isPaedis
                                ? 'bg-blue-100 text-blue-950 border-blue-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block leading-snug">
                              {student.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Carrera / Sede */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block truncate max-w-[200px]">
                          {student.career}
                        </span>
                        <span className="text-[11px] text-slate-500 block">{student.campus}</span>
                      </td>

                      {/* Asistencia */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-md border ${
                              student.attendanceRate < 70
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : student.attendanceRate < 80
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {student.attendanceRate}%
                          </span>
                          {student.attendanceRate < 70 && (
                            <span className="text-[10px] font-black bg-red-100 text-red-900 px-1 py-0.5 rounded">
                              RI
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PAEDIS */}
                      <td className="p-3.5">
                        {student.isPaedis ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200">
                            <span>♿</span>
                            <span>PAEDIS</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">Regular</span>
                        )}
                      </td>

                      {/* Semáforo Predictivo */}
                      <td className="p-3.5">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-xl border ${
                              student.academicStatus === 'titulado'
                                ? 'bg-purple-50 text-purple-950 border-purple-200'
                                : student.academicStatus === 'desercion'
                                ? 'bg-rose-50 text-rose-950 border-rose-200'
                                : isHighRisk
                                ? 'bg-rose-50 text-rose-900 border-rose-300'
                                : isMediumRisk
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                student.academicStatus === 'titulado'
                                  ? 'bg-purple-600'
                                  : student.academicStatus === 'desercion' || isHighRisk
                                  ? 'bg-rose-600'
                                  : isMediumRisk
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              }`}
                            />
                            <span>
                              {pred.riskLevel || 'BAJO'} ({pred.score ?? 0}%)
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 max-w-[180px] truncate">
                            {pred.predictionLabel}
                          </span>
                        </div>
                      </td>

                      {/* Estado Académico */}
                      <td className="p-3.5">
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg inline-block border ${
                            student.academicStatus === 'activo'
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                              : student.academicStatus === 'titulado'
                              ? 'bg-purple-50 text-purple-950 border-purple-200'
                              : 'bg-rose-50 text-rose-950 border-rose-200'
                          }`}
                        >
                          {student.academicStatus}
                        </span>
                        {student.statusReason && (
                          <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[150px]">
                            {student.statusReason}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(student)}
                          className="min-h-[34px] px-3 py-1 bg-white hover:bg-[#002B49] text-[#002B49] hover:text-white border border-[#002B49]/40 hover:border-[#002B49] rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FFB81C] cursor-pointer"
                        >
                          Cambiar Estado
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(student)}
                          aria-label={`Eliminar a ${student.fullName}`}
                          className="min-h-[34px] p-1.5 text-slate-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL 1: Cambiar Estado Académico (Activo, Deserción, Titulado) */}
      {isStatusModalOpen && selectedStudentForStatus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="status-modal-title" className="text-xl font-black text-slate-900">
                Cambiar Estado Académico
              </h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 font-bold block">Estudiante</span>
                <span className="text-sm font-black text-slate-900">
                  {selectedStudentForStatus.fullName} ({selectedStudentForStatus.email})
                </span>
              </div>

              {/* Selector de los 3 estados requeridos */}
              <div className="space-y-1.5">
                <label
                  htmlFor="academic-status-select"
                  className="text-xs font-black text-slate-900 uppercase"
                >
                  Estado Académico <span className="text-red-600">*</span>
                </label>
                <select
                  id="academic-status-select"
                  value={statusForm.academicStatus}
                  onChange={(e) => setStatusForm({ ...statusForm, academicStatus: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  <option value="activo">Activo (Estudiante Regular Cursando)</option>
                  <option value="desercion">Deserción (Suspensión / Retiro Académico)</option>
                  <option value="titulado">Titulado (Egresado con Plan de Estudios Completo)</option>
                </select>
              </div>

              {/* Motivo del cambio de estado */}
              <div className="space-y-1.5">
                <label
                  htmlFor="status-reason-input"
                  className="text-xs font-black text-slate-900 uppercase"
                >
                  Motivo / Observación
                </label>
                {statusForm.academicStatus === 'desercion' ? (
                  <select
                    id="status-reason-input"
                    value={statusForm.statusReason}
                    onChange={(e) => setStatusForm({ ...statusForm, statusReason: e.target.value })}
                    className="w-full min-h-[44px] p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  >
                    <option value="">Seleccione motivo de deserción...</option>
                    <option value="Reprobación por Inasistencia (RI < 70%)">
                      Reprobación por Inasistencia (RI &lt; 70%)
                    </option>
                    <option value="Dificultades Económicas / Pago de Arancel">
                      Dificultades Económicas / Pago de Arancel
                    </option>
                    <option value="Cambio de Carrera / Vocacional">
                      Cambio de Carrera / Vocacional
                    </option>
                    <option value="Motivos de Salud / Sobrecarga">
                      Motivos de Salud / Sobrecarga
                    </option>
                  </select>
                ) : (
                  <input
                    id="status-reason-input"
                    type="text"
                    value={statusForm.statusReason}
                    onChange={(e) => setStatusForm({ ...statusForm, statusReason: e.target.value })}
                    placeholder={
                      statusForm.academicStatus === 'titulado'
                        ? 'Ej. Proyecto Capstone y Práctica profesional aprobadas'
                        : 'Ej. Reincorporación regular para periodo 2026'
                    }
                    className="w-full min-h-[44px] p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[42px] px-5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-black rounded-xl border border-amber-400 disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-[#FFB81C]" />}
                  <span>Guardar Estado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar Nuevo Estudiante / Usuario */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 id="create-modal-title" className="text-xl font-black text-slate-900">
                  Registrar Nuevo Usuario en Nexo360
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Acceso exclusivo del Administrador (Ambiente Académico Seguro)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs sm:text-sm font-bold">
              {/* Nombre y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="create-name" className="text-xs font-black text-slate-900 uppercase">
                    Nombre Completo <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    required
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    placeholder="Ej. Matías Soto"
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="create-email" className="text-xs font-black text-slate-900 uppercase">
                    Correo Duoc UC <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="create-email"
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="ejemplo@duocuc.cl"
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Contraseña Inicial y RUT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="create-password"
                    className="text-xs font-black text-slate-900 uppercase"
                  >
                    Contraseña Inicial
                  </label>
                  <input
                    id="create-password"
                    type="text"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Duoc2026!"
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="create-rut" className="text-xs font-black text-slate-900 uppercase">
                    RUT Institucional
                  </label>
                  <input
                    id="create-rut"
                    type="text"
                    value={newUserForm.rut}
                    onChange={(e) => setNewUserForm({ ...newUserForm, rut: e.target.value })}
                    placeholder="20.123.456-7"
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Rol y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="create-role" className="text-xs font-black text-slate-900 uppercase">
                    Rol Institucional
                  </label>
                  <select
                    id="create-role"
                    value={newUserForm.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      setNewUserForm({
                        ...newUserForm,
                        role,
                        isPaedis: role === 'estudiante_paedis',
                      });
                    }}
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="estudiante_paedis">Estudiante Regular • PAEDIS</option>
                    <option value="estudiante">Estudiante Regular</option>
                    <option value="tutor_par">Estudiante Tutor Par</option>
                    <option value="profesor">Profesor / Docente</option>
                    <option value="director">Director/a de Carrera</option>
                    <option value="subdirector">Subdirector/a Académico</option>
                    <option value="coordinador_paedis">Coordinación PAEDIS</option>
                    <option value="admin">Administrador TI</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="create-status"
                    className="text-xs font-black text-slate-900 uppercase"
                  >
                    Estado Académico
                  </label>
                  <select
                    id="create-status"
                    value={newUserForm.academicStatus}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, academicStatus: e.target.value })
                    }
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="activo">Activo</option>
                    <option value="desercion">Deserción</option>
                    <option value="titulado">Titulado</option>
                  </select>
                </div>
              </div>

              {/* Carrera y Sede */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="create-career"
                    className="text-xs font-black text-slate-900 uppercase"
                  >
                    Carrera
                  </label>
                  <input
                    id="create-career"
                    type="text"
                    value={newUserForm.career}
                    onChange={(e) => setNewUserForm({ ...newUserForm, career: e.target.value })}
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="create-campus"
                    className="text-xs font-black text-slate-900 uppercase"
                  >
                    Sede Duoc UC
                  </label>
                  <input
                    id="create-campus"
                    type="text"
                    value={newUserForm.campus}
                    onChange={(e) => setNewUserForm({ ...newUserForm, campus: e.target.value })}
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Asistencia Inicial y Tutor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="create-attendance"
                    className="text-xs font-black text-slate-900 uppercase"
                  >
                    Asistencia Estimada (%)
                  </label>
                  <input
                    id="create-attendance"
                    type="number"
                    min="0"
                    max="100"
                    value={newUserForm.attendanceRate}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, attendanceRate: e.target.value })
                    }
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="create-tutor"
                    className="text-xs font-black text-slate-900 uppercase"
                  >
                    Tutor PAR Asignado
                  </label>
                  <input
                    id="create-tutor"
                    type="text"
                    value={newUserForm.tutorParAsignado}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, tutorParAsignado: e.target.value })
                    }
                    className="w-full min-h-[42px] p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-black rounded-xl border border-amber-400 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-[#FFB81C]" />}
                  <span>Registrar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
