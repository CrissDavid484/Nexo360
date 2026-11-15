import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  FileSpreadsheet,
  Building2,
  MapPin,
  BookOpen,
  Plus,
  Shield,
  Eye,
  Check,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { CoursesAdminSection } from '../admin/CoursesAdminSection';

const DEFAULT_CAREERS = [
  'Ingeniería en Informática',
  'Analista Programador Computacional',
  'Ingeniería en Conectividad y Redes',
  'Ingeniería en Ciberseguridad',
  'Ingeniería en Infraestructura Tecnológica',
  'Ingeniería en Infraest. y Plataformas Tecn.',
  'Administración de Empresas',
  'Auditoría y Análisis de Negocios',
].map((name, i) => ({ id: `career-${i}`, name, school: 'Escuela Duoc UC' }));

const DEFAULT_SEDES = [
  'Sede Alameda',
  'Sede Antonio Varas',
  'Sede Maipú',
  'Sede Melipilla',
  'Sede Padre Alonso de Ovalle',
  'Sede Plaza Norte',
  'Sede Plaza Oeste',
  'Sede Plaza Vespucio',
  'Sede Puente Alto',
  'Sede Puerto Montt',
  'Sede San Andrés de Concepción',
  'Sede San Bernardo',
  'Sede San Carlos de Apoquindo',
  'Sede San Joaquín',
  'Sede Valparaíso',
  'Sede Viña del Mar',
].map((name, i) => ({ id: `sede-${i}`, name, city: 'Campus Duoc UC' }));

export const AdminPanelView = () => {
  const { announce } = useAccessibility();
  const { user } = useAuth();

  // Permisos institucionales Duoc UC: Administrador o Coordinador PAEDIS tienen acceso de gestión
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isCoordinator = userRole === 'coordinador_paedis';
  const canManageAdmin = isAdmin || isCoordinator;

  // Sub-pestaña activa del Panel Admin: 'estudiantes' | 'oferta-ramos' | 'carreras-sedes'
  const [adminSubTab, setAdminSubTab] = useState('estudiantes');

  // Estados de datos principales
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'activo' | 'desercion' | 'titulado' | 'paedis'

  // Catálogos dinámicos de Carreras y Sedes sincronizados con la base de datos
  const [careersList, setCareersList] = useState(DEFAULT_CAREERS);
  const [sedesList, setSedesList] = useState(DEFAULT_SEDES);
  const [newCareerInput, setNewCareerInput] = useState('');
  const [newCareerSchool, setNewCareerSchool] = useState('');
  const [careerSearch, setCareerSearch] = useState('');
  const [newSedeInput, setNewSedeInput] = useState('');
  const [sedeSearch, setSedeSearch] = useState('');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [statusForm, setStatusForm] = useState({ academicStatus: 'activo', statusReason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Formulario de registro - Contraseña dinámica por año ('Duoc' + año + '!')
  const currentYear = new Date().getFullYear();
  const dynamicInitialPassword = `Duoc${currentYear}!`;

  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: dynamicInitialPassword,
    rut: '',
    role: '',
    career: '',
    campus: '',
  });

  // Combobox de Carrera en el modal de registro
  const [careerQuery, setCareerQuery] = useState('');
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);
  const careerDropdownRef = useRef(null);

  // Cerrar combobox al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (careerDropdownRef.current && !careerDropdownRef.current.contains(e.target)) {
        setIsCareerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar datos del panel, métricas, estudiantes, carreras y sedes
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, studentsRes, careersRes, sedesRes] = await Promise.all([
        api.getAdminMetrics().catch(() => null),
        api.getAdminStudents().catch(() => null),
        api.getAdminCareers().catch(() => null),
        api.getAdminSedes().catch(() => null),
      ]);

      if (metricsRes?.success) {
        setMetrics(metricsRes.metrics);
      }
      if (studentsRes?.success) {
        setStudents(studentsRes.students);
      }
      if (careersRes?.success && Array.isArray(careersRes.careers) && careersRes.careers.length > 0) {
        setCareersList(careersRes.careers);
      }
      if (sedesRes?.success && Array.isArray(sedesRes.sedes) && sedesRes.sedes.length > 0) {
        setSedesList(sedesRes.sedes);
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

  // Carreras y Sedes ordenadas alfabéticamente
  const sortedCareers = useMemo(() => {
    return [...careersList].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  }, [careersList]);

  const sortedSedes = useMemo(() => {
    return [...sedesList].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  }, [sedesList]);

  // Carreras filtradas para el combobox
  const filteredCareersForCombobox = useMemo(() => {
    const q = careerQuery.toLowerCase().trim();
    if (!q) return sortedCareers;
    return sortedCareers.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [sortedCareers, careerQuery]);

  // Carreras y Sedes filtradas para la pestaña de gestión CRUD
  const filteredCareersCrud = useMemo(() => {
    const q = careerSearch.toLowerCase().trim();
    if (!q) return sortedCareers;
    return sortedCareers.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [sortedCareers, careerSearch]);

  const filteredSedesCrud = useMemo(() => {
    const q = sedeSearch.toLowerCase().trim();
    if (!q) return sortedSedes;
    return sortedSedes.filter((s) => (s.name || '').toLowerCase().includes(q));
  }, [sortedSedes, sedeSearch]);

  // Filtrado de estudiantes en el directorio
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const studentSede = s.campus || s.sede || '';
      const matchesSearch =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        studentSede.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === 'paedis') return s.isPaedis === true;
      if (filterStatus !== 'all') return s.academicStatus === filterStatus;

      return true;
    });
  }, [students, searchTerm, filterStatus]);

  // Manejo de cambio de estado académico
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

        // Actualizar también en el detalle si está abierto
        if (selectedStudentForDetail && (selectedStudentForDetail._id === selectedStudentForStatus._id || selectedStudentForDetail.id === selectedStudentForStatus.id)) {
          setSelectedStudentForDetail({
            ...selectedStudentForDetail,
            academicStatus: statusForm.academicStatus,
            statusReason: statusForm.statusReason,
          });
        }

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

  // Manejo de creación de nuevo usuario con Ley N° 21.719
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!consentAccepted) {
      setFeedbackMessage({
        type: 'error',
        text: 'Debe aceptar la declaración de consentimiento y tratamiento de datos personales conforme a la Ley N° 21.719.',
      });
      return;
    }

    // Validaciones de campos requeridos
    if (!newUserForm.role) {
      setFeedbackMessage({
        type: 'error',
        text: 'Por favor, selecciona un rol institucional.',
      });
      return;
    }

    if (!newUserForm.career.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Por favor, selecciona una carrera.',
      });
      return;
    }

    if (!newUserForm.campus.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Por favor, selecciona una sede.',
      });
      return;
    }

    // Validación de restricción exclusiva para rol Administrador
    if ((newUserForm.role === 'admin' || newUserForm.role === 'administrador') && !isAdmin) {
      setFeedbackMessage({
        type: 'error',
        text: 'Acceso restringido: Solo un Administrador puede crear o asignar usuarios con el rol Administrador.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: newUserForm.fullName.trim(),
        email: newUserForm.email.trim(),
        password: newUserForm.password.trim() || dynamicInitialPassword,
        rut: newUserForm.rut.trim(),
        role: newUserForm.role,
        career: newUserForm.career.trim(),
        campus: newUserForm.campus.trim(),
        isPaedis: newUserForm.role === 'estudiante_paedis',
        consentimientoLey21719: {
          aceptado: true,
          fechaAceptacion: new Date(),
          finalidadTratamiento:
            'Gestión académica, acompañamiento PAEDIS y prevención de deserción estudiantil según Ley N° 21.719 de Chile',
        },
      };

      const res = await api.createAdminStudent(payload);

      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Usuario ${newUserForm.fullName} registrado exitosamente con contraseña inicial institucional.`,
        });
        announce(`Usuario ${newUserForm.fullName} registrado exitosamente.`, 'polite');
        setIsCreateModalOpen(false);

        // Reset form
        setNewUserForm({
          fullName: '',
          email: '',
          password: dynamicInitialPassword,
          rut: '',
          role: '',
          career: '',
          campus: '',
        });
        setCareerQuery('');
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

  // Manejo de eliminación de usuario
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
        if (selectedStudentForDetail && (selectedStudentForDetail._id === student._id || selectedStudentForDetail.id === student.id)) {
          setSelectedStudentForDetail(null);
        }
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

  // CRUD Carreras con sincronización optimista inmediata
  const handleAddCareer = async (e) => {
    e.preventDefault();
    const clean = newCareerInput.trim();
    if (!clean) return;

    const newObj = {
      id: `career-${Date.now()}`,
      name: clean,
      school: newCareerSchool.trim() || 'Escuela Duoc UC',
    };

    setCareersList((prev) => [newObj, ...prev]);
    setNewCareerInput('');
    setNewCareerSchool('');
    setFeedbackMessage({ type: 'success', text: `Carrera "${clean}" agregada exitosamente a la oferta académica.` });
    announce(`Carrera ${clean} agregada.`, 'polite');

    try {
      await api.createAdminCareer({
        name: clean,
        school: newObj.school,
      });
    } catch (err) {
      console.warn('Sincronización de carrera con backend:', err);
    }
  };

  const handleDeleteCareer = async (career) => {
    if (!window.confirm(`¿Eliminar la carrera "${career.name}"?`)) return;
    const targetKey = career._id || career.id || career.name;
    setCareersList((prev) => prev.filter((c) => (c._id || c.id || c.name) !== targetKey));
    setFeedbackMessage({ type: 'success', text: `Carrera "${career.name}" eliminada exitosamente.` });
    announce(`Carrera ${career.name} eliminada.`, 'polite');

    try {
      await api.deleteAdminCareer(targetKey);
    } catch (err) {
      console.warn('Sincronización de eliminación de carrera:', err);
    }
  };

  // CRUD Sedes con sincronización optimista inmediata
  const handleAddSede = async (e) => {
    e.preventDefault();
    const clean = newSedeInput.trim();
    if (!clean) return;

    const newObj = {
      id: `sede-${Date.now()}`,
      name: clean,
      city: 'Campus Duoc UC',
    };

    setSedesList((prev) => [newObj, ...prev]);
    setNewSedeInput('');
    setFeedbackMessage({ type: 'success', text: `Sede "${clean}" agregada exitosamente a la red institucional.` });
    announce(`Sede ${clean} agregada.`, 'polite');

    try {
      await api.createAdminSede({ name: clean });
    } catch (err) {
      console.warn('Sincronización de sede con backend:', err);
    }
  };

  const handleDeleteSede = async (sede) => {
    if (!window.confirm(`¿Eliminar la sede "${sede.name}"?`)) return;
    const targetKey = sede._id || sede.id || sede.name;
    setSedesList((prev) => prev.filter((s) => (s._id || s.id || s.name) !== targetKey));
    setFeedbackMessage({ type: 'success', text: `Sede "${sede.name}" eliminada exitosamente.` });
    announce(`Sede ${sede.name} eliminada.`, 'polite');

    try {
      await api.deleteAdminSede(targetKey);
    } catch (err) {
      console.warn('Sincronización de eliminación de sede:', err);
    }
  };

  return (
    <div className="space-y-7 animate-fade-in pb-12">
      {/* 1. HERO BANNER INSTITUCIONAL DUOC UC */}
      <section
        aria-labelledby="admin-panel-title"
        className="relative overflow-hidden rounded-3xl bg-[#002B49] text-white p-7 sm:p-9 shadow-sm border border-slate-200/20"
      >
        <div
          className="absolute -right-16 -top-16 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/10 backdrop-blur-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>
                {isAdmin
                  ? 'Módulo Exclusivo Administrador • Duoc UC'
                  : 'Módulo Coordinación PAEDIS • Gestión Institucional'}
              </span>
            </div>
            <h1
              id="admin-panel-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
            >
              Panel de Control & Analítica Predictiva
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Supervisión de métricas de retención, modelo predictivo de deserción por asistencia
              reglamentaria (&lt; 70% RI) y gestión institucional conforme a la Ley N° 21.719 de Protección de Datos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadAdminData}
              aria-label="Actualizar datos de la base de datos"
              className="min-h-[44px] px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium text-xs inline-flex items-center gap-2 border border-white/15 backdrop-blur-xs transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              <RefreshCw
                className={`w-4 h-4 text-amber-300 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refrescar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canManageAdmin) {
                  announce('Acción denegada: Requiere privilegios de Administrador o Coordinador PAEDIS.', 'assertive');
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              disabled={!canManageAdmin}
              aria-disabled={!canManageAdmin}
              title={
                !canManageAdmin
                  ? 'Acción restringida: Se requiere rol de Administrador o Coordinador PAEDIS'
                  : 'Registrar nuevo estudiante o usuario'
              }
              className={`min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                canManageAdmin
                  ? 'bg-[#FFB81C] hover:bg-amber-400 text-slate-950 cursor-pointer'
                  : 'bg-slate-300 text-slate-600 cursor-not-allowed opacity-60'
              }`}
            >
              <UserPlus className="w-4 h-4 text-slate-950" aria-hidden="true" />
              <span>Registrar Estudiante / Usuario</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pestañas de Navegación del Panel de Administración */}
      <nav
        aria-label="Secciones del Panel de Administración"
        className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2"
      >
        <button
          type="button"
          onClick={() => {
            setAdminSubTab('estudiantes');
            announce('Pestaña de Gestión de Estudiantes seleccionada.', 'polite');
          }}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminSubTab === 'estudiantes'
              ? 'bg-[#002B49] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Gestión de Estudiantes & Retención</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminSubTab('carreras-sedes');
            announce('Pestaña de Gestión Dinámica de Carreras y Sedes seleccionada.', 'polite');
          }}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminSubTab === 'carreras-sedes'
              ? 'bg-[#002B49] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Carreras & Sedes (CRUD)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminSubTab('oferta-ramos');
            announce('Pestaña de Oferta Académica y Carga de Ramos seleccionada.', 'polite');
          }}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminSubTab === 'oferta-ramos'
              ? 'bg-[#002B49] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Oferta Académica & Simulador (Excel / BD)</span>
        </button>
      </nav>

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

      {/* RENDERIZADO SEGÚN SUB-PESTAÑA */}
      {adminSubTab === 'oferta-ramos' ? (
        <CoursesAdminSection />
      ) : adminSubTab === 'carreras-sedes' ? (
        /* GESTIÓN DINÁMICA DE CARRERAS Y SEDES (CRUD) */
        <section aria-labelledby="careers-sedes-title" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider text-[#002B49] bg-blue-100">
              <Building2 className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              <span>Gestión Dinámica Institucional Duoc UC</span>
            </div>
            <h2 id="careers-sedes-title" className="text-xl sm:text-2xl font-black text-slate-900">
              Administración de Carreras y Sedes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Agrega y elimina carreras y sedes dinámicamente. Los cambios se sincronizan en tiempo
              real con el formulario de registro y la oferta académica.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. CRUD CARRERAS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#002B49]" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Carreras Duoc UC ({sortedCareers.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Orden Alfabético
                </span>
              </div>

              {/* Formulario Agregar Carrera */}
              <form onSubmit={handleAddCareer} className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={newCareerInput}
                    onChange={(e) => setNewCareerInput(e.target.value)}
                    placeholder="Nombre de la nueva carrera..."
                    className="flex-1 min-h-[40px] px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  />
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </form>

              {/* Búsqueda de Carreras */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={careerSearch}
                  onChange={(e) => setCareerSearch(e.target.value)}
                  placeholder="Filtrar carreras..."
                  className="w-full min-h-[38px] pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              {/* Lista con Scroll */}
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {filteredCareersCrud.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No se encontraron carreras.</p>
                ) : (
                  filteredCareersCrud.map((c) => (
                    <div
                      key={c._id || c.id || c.name}
                      className="pt-2 flex items-center justify-between gap-2 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {c.school || 'Escuela Duoc UC'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCareer(c)}
                        title={`Eliminar carrera ${c.name}`}
                        aria-label={`Eliminar carrera ${c.name}`}
                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. CRUD SEDES */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#002B49]" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Sedes Duoc UC ({sortedSedes.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Orden Alfabético
                </span>
              </div>

              {/* Formulario Agregar Sede */}
              <form onSubmit={handleAddSede} className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={newSedeInput}
                    onChange={(e) => setNewSedeInput(e.target.value)}
                    placeholder="Nombre de la nueva sede (Ej: Sede Providencia)..."
                    className="flex-1 min-h-[40px] px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  />
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </form>

              {/* Búsqueda de Sedes */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={sedeSearch}
                  onChange={(e) => setSedeSearch(e.target.value)}
                  placeholder="Filtrar sedes..."
                  className="w-full min-h-[38px] pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              {/* Lista con Scroll */}
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {filteredSedesCrud.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No se encontraron sedes.</p>
                ) : (
                  filteredSedesCrud.map((s) => (
                    <div
                      key={s._id || s.id || s.name}
                      className="pt-2 flex items-center justify-between gap-2 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                          {s.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {s.city || 'Campus Duoc UC'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSede(s)}
                        title={`Eliminar sede ${s.name}`}
                        aria-label={`Eliminar sede ${s.name}`}
                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* PESTAÑA PRINCIPAL: GESTIÓN DE ESTUDIANTES & MODELO PREDICTIVO */
        <>
          {/* 2. TARJETAS KPI EJECUTIVAS */}
          <section aria-labelledby="kpis-heading" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 id="kpis-heading" className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Métricas Clave de Uso & Matrícula
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Actualización en vivo vía MongoDB & Scraping
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

          {/* 3. ANALÍTICA PREDICTIVA: RETENCIÓN & TITULACIÓN CON SEMÁFORO NORMATIVO DUOC UC */}
          <section
            aria-labelledby="predictive-analytics-title"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6"
          >
            <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider text-[#002B49] bg-amber-100">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>Modelo Predictivo de Inteligencia Académica Duoc UC</span>
                </div>
                <h2
                  id="predictive-analytics-title"
                  className="text-xl sm:text-2xl font-black text-slate-900 mt-1"
                >
                  Semáforo Predictivo de Retención vs. Deserción
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Algoritmo regulatorio Duoc UC alimentado por asistencias reales (&lt; 70% Reprobación por Inasistencia [RI], 70-75% Alerta Preventiva, &gt; 75% Retención Favorable).
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 shrink-0">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                  <span>Bajo Riesgo (&gt; 75%)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
                  <span>Moderado (70-75%)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
                  <span>Alto Riesgo / RI (&lt; 70%)</span>
                </span>
              </div>
            </div>

            {/* 3 Columnas de Análisis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Columna 1: Distribución */}
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  1. Distribución de Estados Académicos
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
                  2. Semáforo Predictivo Global
                </span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-2xl font-black text-emerald-950 block">
                      {metrics?.riskSummary?.bajoRiesgo ?? 0}
                    </span>
                    <span className="text-[10px] font-black text-emerald-800 uppercase mt-0.5 block">
                      Bajo Riesgo (&gt;75%)
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-2xl font-black text-amber-950 block">
                      {metrics?.riskSummary?.medioRiesgo ?? 0}
                    </span>
                    <span className="text-[10px] font-black text-amber-800 uppercase mt-0.5 block">
                      Alerta (70-75%)
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-2xl font-black text-rose-950 block">
                      {metrics?.riskSummary?.altoRiesgo ?? 0}
                    </span>
                    <span className="text-[10px] font-black text-rose-800 uppercase mt-0.5 block">
                      Riesgo RI (&lt;70%)
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  *Las alertas tempranas calculan el riesgo de reprobación por inasistencia (RI)
                  según la asistencia real por asignatura inscrita.
                </p>
              </div>

              {/* Columna 3: Normativa Duoc UC */}
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  3. Normativa Académica Duoc UC
                </span>
                <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-black flex items-center justify-center shrink-0 text-[10px]">
                      RI
                    </span>
                    <span>
                      <strong>Asistencia &lt; 70%:</strong> Reprobación por Inasistencia inmediata en la asignatura.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-black flex items-center justify-center shrink-0 text-[10px]">
                      ⚠️
                    </span>
                    <span>
                      <strong>Asistencia 70% a 75%:</strong> Zona de riesgo crítico, requiere seguimiento docente y tutor PAR.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-[10px]">
                      ✓
                    </span>
                    <span>
                      <strong>Asistencia &gt; 75%:</strong> Cumplimiento regular con alta probabilidad de titulación y retención.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. REDISEÑO DEL DIRECTORIO DE ESTUDIANTES */}
          {/* REQUISITO ESTRICTO: En la lista principal cada entrada muestra ÚNICAMENTE el Nombre Completo y directamente debajo en texto pequeño la Sede. */}
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
                  Haz clic en cualquier estudiante para abrir su ficha completa con asistencia detallada por asignatura y semáforo predictivo.
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
                placeholder="Buscar estudiante por nombre o sede..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              />
            </div>

            {/* Directorio de Estudiantes: Cada entrada muestra ÚNICAMENTE Nombre Completo y debajo en texto pequeño la Sede */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list">
              {filteredStudents.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
                  No se encontraron estudiantes registrados con los criterios seleccionados.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const studentSede = student.campus || student.sede || 'Sede Alameda';
                  const isExpanded =
                    selectedStudentForDetail &&
                    (selectedStudentForDetail._id === student._id || selectedStudentForDetail.id === student.id);

                  return (
                    <div
                      key={student._id || student.id}
                      role="listitem"
                      className={`transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`}
                    >
                      {/* Cabecera / Tarjeta del Estudiante: Nombre y Sede directamente abajo */}
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForDetail(isExpanded ? null : student)}
                        className={`w-full p-4 text-left flex items-center justify-between gap-3 group cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                          isExpanded
                            ? 'bg-[#002B49] text-white border-2 border-[#002B49] shadow-lg rounded-t-2xl rounded-b-none'
                            : 'bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-[#002B49]/40 rounded-2xl shadow-xs hover:shadow-md'
                        }`}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Contraer' : 'Desplegar'} ficha y analítica de ${student.fullName}, ${studentSede}`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          {/* 1. Nombre Completo */}
                          <span
                            className={`font-black block truncate text-sm sm:text-base ${
                              isExpanded ? 'text-white' : 'text-slate-900 group-hover:text-[#002B49]'
                            }`}
                          >
                            {student.fullName}
                          </span>
                          {/* 2. Directamente debajo en texto pequeño la Sede */}
                          <span
                            className={`text-xs font-semibold block truncate ${
                              isExpanded ? 'text-amber-300' : 'text-slate-500'
                            }`}
                          >
                            {studentSede}
                          </span>
                        </div>

                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                            isExpanded
                              ? 'bg-white/15 text-amber-300 rotate-90'
                              : 'bg-slate-100 group-hover:bg-[#002B49] text-slate-500 group-hover:text-amber-300'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </div>
                      </button>

                      {/* DETALLE DESPLEGADO DIRECTAMENTE DESDE EL MISMO RECUADRO */}
                      {isExpanded && (
                        <div className="bg-white rounded-b-2xl border-x-2 border-b-2 border-[#002B49] p-5 sm:p-7 shadow-xl space-y-5 animate-fade-in">
                          {/* Cabecera del Detalle desplegado */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mb-1">
                                Ficha Integral del Estudiante • Nexo360
                              </span>
                              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                {student.fullName}
                              </h3>
                              <span className="text-xs font-bold text-slate-500 block">
                                {studentSede} • {student.email} • RUT: {student.rut || 'Sin RUT'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForDetail(null)}
                              className="self-start sm:self-center text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              ✕ Contraer ficha
                            </button>
                          </div>

                          {/* Ficha: Carrera, Estado Académico y PAEDIS */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Carrera */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                Carrera
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                                {student.career || 'Ingeniería en Informática'}
                              </span>
                            </div>

                            {/* Estado Académico (Calculado a partir de asistencia y registro) */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                Estado Académico
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-black uppercase px-2 py-0.5 rounded-md border ${
                                    student.academicStatus === 'activo'
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                      : student.academicStatus === 'titulado'
                                      ? 'bg-purple-50 text-purple-900 border-purple-200'
                                      : 'bg-rose-50 text-rose-900 border-rose-300'
                                  }`}
                                >
                                  {student.academicStatus || 'activo'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {student.statusReason || 'Calculado según asistencia y carga'}
                              </span>
                            </div>

                            {/* Condición PAEDIS */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                Condición PAEDIS
                              </span>
                              {student.isPaedis ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200">
                                  <span>♿ PAEDIS Acreditado</span>
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-slate-600 block">Estudiante Regular</span>
                              )}
                              {student.diagnosticoDeclarado && (
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {student.diagnosticoDeclarado}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ajustes Razonables si es PAEDIS */}
                          {student.isPaedis && Array.isArray(student.ajustesAprobados) && student.ajustesAprobados.length > 0 && (
                            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1.5">
                              <span className="text-xs font-black text-blue-950 block">
                                Ajustes Razonables PAEDIS Aprobados ({student.ajustesAprobados.length}):
                              </span>
                              <ul className="space-y-1 text-xs text-blue-900 font-medium">
                                {student.ajustesAprobados.map((aj, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-blue-700 font-bold">•</span>
                                    <span><strong>{aj.tipo}:</strong> {aj.descripcion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Semáforo Predictivo de Deserción con Normativa Duoc UC */}
                          {(() => {
                            const pred = student.prediction || {};
                            const trafficColor = pred.trafficLight || (pred.riskLevel === 'ALTO' || pred.riskLevel === 'DESERTOR' ? 'red' : pred.riskLevel === 'MEDIO' ? 'yellow' : 'green');

                            return (
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                      Semáforo Predictivo de Retención vs. Deserción
                                    </span>
                                  </div>

                                  {/* Semáforo Visual de 3 Luces */}
                                  <div className="flex items-center gap-1.5 bg-slate-200/90 p-1.5 rounded-full border border-slate-300">
                                    <span
                                      title="Verde: Bajo Riesgo (> 75%)"
                                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                                        trafficColor === 'green'
                                          ? 'bg-emerald-500 shadow-md ring-2 ring-emerald-300 animate-pulse'
                                          : 'bg-emerald-200 opacity-40'
                                      }`}
                                    />
                                    <span
                                      title="Amarillo: Riesgo Moderado (70% - 75%)"
                                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                                        trafficColor === 'yellow'
                                          ? 'bg-amber-400 shadow-md ring-2 ring-amber-200 animate-pulse'
                                          : 'bg-amber-200 opacity-40'
                                      }`}
                                    />
                                    <span
                                      title="Rojo: Alto Riesgo / RI (< 70%)"
                                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                                        trafficColor === 'red'
                                          ? 'bg-rose-500 shadow-md ring-2 ring-rose-300 animate-pulse'
                                          : 'bg-rose-200 opacity-40'
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5">
                                  <div>
                                    <span className="text-sm font-black text-slate-900 block">
                                      {pred.predictionLabel || 'Evaluación de Retención Duoc UC'}
                                    </span>
                                    <span className="text-xs text-slate-600 font-semibold block">
                                      Nivel de Riesgo: <strong>{pred.riskLevel || 'BAJO'}</strong> • Probabilidad de Titulación: <strong>{pred.graduationProbability ?? 90}%</strong>
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs font-black px-3 py-1 rounded-xl self-start sm:self-auto border ${
                                      trafficColor === 'red'
                                        ? 'bg-rose-100 text-rose-950 border-rose-300'
                                        : trafficColor === 'yellow'
                                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                                        : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                    }`}
                                  >
                                    Score de Riesgo: {pred.score ?? 15}%
                                  </span>
                                </div>

                                {/* Factores del modelo */}
                                {Array.isArray(pred.factors) && pred.factors.length > 0 && (
                                  <ul className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/50">
                                    {pred.factors.map((f, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-slate-400 font-bold">•</span>
                                        <span>{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })()}

                          {/* ASISTENCIA DETALLADA POR ASIGNATURA */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-[#002B49]" />
                                <h4 className="text-sm sm:text-base font-black text-slate-900">
                                  Asistencia Detallada por Asignatura Cursada
                                </h4>
                              </div>
                              <span className="text-xs font-bold text-slate-500">
                                {Array.isArray(selectedStudentForDetail?.enrolledCourses || student.enrolledCourses)
                                  ? `${(selectedStudentForDetail?.enrolledCourses || student.enrolledCourses).length} asignaturas`
                                  : 'Sin ramos'}
                              </span>
                            </div>

                            {Array.isArray(selectedStudentForDetail?.enrolledCourses || student.enrolledCourses) && (selectedStudentForDetail.enrolledCourses || student.enrolledCourses).length > 0 ? (
                              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[11px] border-b border-slate-200">
                                    <tr>
                                      <th className="p-3">Asignatura</th>
                                      <th className="p-3">Sección / Sala</th>
                                      <th className="p-3">Clases Asistidas</th>
                                      <th className="p-3">% Asistencia</th>
                                      <th className="p-3">Estado Normativo</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {(selectedStudentForDetail.enrolledCourses || student.enrolledCourses).map((c, i) => {
                                      const rate = Number(c.attendanceRate ?? c.porcentajeAsistencia ?? c.asistenciaPorcentaje ?? 100);
                                      const isRI = rate < 70;
                                      const isAlert = rate >= 70 && rate <= 75;

                                      return (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                          <td className="p-3 font-black text-slate-900">
                                            <span>{c.nombre || c.curso || c.sigla}</span>
                                            <span className="text-[11px] text-slate-400 block font-normal">{c.sigla}</span>
                                          </td>
                                          <td className="p-3 font-semibold text-slate-600">
                                            <span>Sec. {c.seccion || '001D'}</span>
                                            <span className="text-[11px] text-slate-400 block">{c.sala || 'Alameda'}</span>
                                          </td>
                                          <td className="p-3 font-bold text-slate-700">
                                            {c.clasesRegistradas
                                              ? `${c.asistencias ?? c.asistencia ?? 0} de ${c.clasesRegistradas} clases`
                                              : 'Registrado'}
                                          </td>
                                          <td className="p-3">
                                            <span
                                              className={`font-black px-2 py-0.5 rounded-md border text-xs ${
                                                isRI
                                                  ? 'bg-rose-50 text-rose-900 border-rose-300'
                                                  : isAlert
                                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                              }`}
                                            >
                                              {rate}%
                                            </span>
                                          </td>
                                          <td className="p-3">
                                            {isRI ? (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                                                <span>⚠️ RI (Reprobado)</span>
                                              </span>
                                            ) : isAlert ? (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                                <span>Alerta Preventiva</span>
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                                <span>Cumple Asistencia</span>
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
                                <p className="font-bold text-slate-900">
                                  Asistencia General Estimada: {student.attendanceRate ?? 88.9}%
                                </p>
                                <p>
                                  Las asignaturas específicas y su porcentaje de asistencia se extraen y sincronizan
                                  automáticamente en segundo plano al iniciar sesión mediante el portal Vivo Duoc.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Acciones del Detalle */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenStatusModal(student)}
                                disabled={!canManageAdmin}
                                className="min-h-[40px] px-4 py-2 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-black rounded-xl border border-amber-400 cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                Cambiar Estado Académico
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(student)}
                                disabled={!canManageAdmin}
                                className="min-h-[40px] px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                              >
                                <Trash2 className="w-4 h-4 text-rose-700" />
                                <span>Eliminar Estudiante</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedStudentForDetail(null)}
                              className="min-h-[40px] px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Contraer Ficha
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}

      {/* MODAL 1: Cambiar Estado Académico */}
      {isStatusModalOpen && selectedStudentForStatus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-modal-title"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 sm:pt-10 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-0 sm:my-4 animate-fade-in">
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
      {/* CUMPLE ESTRICTAMENTE: Posición al tope del viewport (pt-6 sm:pt-10), Ley N° 21.719, Contraseña DuocYYYY!, RUT, 4 Roles, Combobox Carrera y Sedes, Campos removidos */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 sm:pt-10 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-xl space-y-5 my-0 sm:my-4 animate-fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#002B49] bg-slate-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Registro Institucional Oficial • Duoc UC
                </span>
                <h3 id="create-modal-title" className="text-xl font-bold text-slate-900">
                  Registrar Estudiante / Usuario en Nexo360
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ambiente institucional seguro regulado por la Ley N° 21.719
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Cerrar modal de registro"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs sm:text-sm">
              {/* 1. Nombre Completo y Correo Institucional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="create-name" className="text-xs font-semibold text-slate-700">
                    Nombre Completo <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    required
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    placeholder="Ej. Matías Soto Gómez"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="create-email" className="text-xs font-semibold text-slate-700">
                    Correo Duoc UC <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="create-email"
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="ejemplo@duocuc.cl"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* 2. Contraseña Inicial Dinámica y RUT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="create-password"
                    className="text-xs font-semibold text-slate-700 flex items-center justify-between"
                  >
                    <span>Contraseña Inicial</span>
                    <span className="text-[10px] text-amber-700 font-medium lowercase">
                      (formato Duoc{currentYear}!)
                    </span>
                  </label>
                  <input
                    id="create-password"
                    type="text"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder={`Duoc${currentYear}!`}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-amber-50/40 hover:bg-amber-50/60 focus:bg-white border border-amber-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="create-rut" className="text-xs font-semibold text-slate-700">
                    RUT <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="create-rut"
                    type="text"
                    required
                    value={newUserForm.rut}
                    onChange={(e) => setNewUserForm({ ...newUserForm, rut: e.target.value })}
                    placeholder="20.123.456-7"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* 3. Rol Institucional (Estrictamente limitado a 4 opciones) */}
              <div className="space-y-1">
                <label htmlFor="create-role" className="text-xs font-semibold text-slate-700">
                  Rol Institucional <span className="text-red-600">*</span>
                </label>
                <select
                  id="create-role"
                  required
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                >
                  <option value="" disabled>Selecciona un rol...</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="estudiante_paedis">Estudiante PAEDIS</option>
                  <option value="coordinador_paedis">Coordinador PAEDIS</option>
                  {isAdmin ? (
                    <option value="admin">Administrador</option>
                  ) : (
                    <option value="" disabled>
                      Administrador (Restringido: Solo Administrador puede asignar este rol)
                    </option>
                  )}
                </select>
                {!isAdmin && (
                  <span className="text-[11px] text-slate-500 font-medium block">
                    *Por política de seguridad institucional, solo un Administrador puede crear usuarios con rol Administrador.
                  </span>
                )}
              </div>

              {/* 4. Carrera: COMBOBOX CON FILTRO DE BÚSQUEDA ORDENADO ALFABÉTICAMENTE */}
              <div className="space-y-1 relative" ref={careerDropdownRef}>
                <label htmlFor="create-career-input" className="text-xs font-semibold text-slate-700">
                  Carrera Duoc UC <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="create-career-input"
                    type="text"
                    required
                    value={careerQuery}
                    onChange={(e) => {
                      setCareerQuery(e.target.value);
                      setNewUserForm({ ...newUserForm, career: e.target.value });
                      setIsCareerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCareerDropdownOpen(true)}
                    placeholder="Selecciona una carrera..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 pr-10 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCareerDropdownOpen(!isCareerDropdownOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    aria-label="Desplegar lista de carreras"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {isCareerDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100 animate-fade-in">
                    {filteredCareersForCombobox.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 font-medium">
                        No se encontraron carreras con ese nombre. Puedes escribir una nueva.
                      </div>
                    ) : (
                      filteredCareersForCombobox.map((c) => (
                        <button
                          key={c._id || c.id || c.name}
                          type="button"
                          onClick={() => {
                            setCareerQuery(c.name);
                            setNewUserForm({ ...newUserForm, career: c.name });
                            setIsCareerDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            newUserForm.career === c.name ? 'bg-amber-50 text-[#002B49]' : 'text-slate-800'
                          }`}
                        >
                          <span>{c.name}</span>
                          {newUserForm.career === c.name && <Check className="w-4 h-4 text-amber-600" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 5. Sede: LISTA ORDENADA ALFABÉTICAMENTE */}
              <div className="space-y-1">
                <label htmlFor="create-campus-select" className="text-xs font-semibold text-slate-700">
                  Sede Duoc UC <span className="text-red-600">*</span>
                </label>
                <select
                  id="create-campus-select"
                  required
                  value={newUserForm.campus}
                  onChange={(e) => setNewUserForm({ ...newUserForm, campus: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                >
                  <option value="" disabled>Selecciona una sede...</option>
                  {sortedSedes.map((s) => (
                    <option key={s._id || s.id || s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Cumplimiento Ley N° 21.719 de Protección de Datos Personales de Chile */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#002B49]">
                  <Shield className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
                  <span>Aviso de Privacidad y Cumplimiento Ley N° 21.719</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  En cumplimiento de la <strong>Ley N° 21.719 sobre Protección de Datos Personales</strong>, los datos recopilados en Nexo360 tienen como finalidad exclusiva la gestión académica, la asignación de ajustes de accesibilidad PAEDIS y el seguimiento de retención estudiantil. Los datos no se cederán a terceros no autorizados.
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>
                    Al registrar el usuario, se formaliza la aceptación expresa e informada del tratamiento institucional de sus datos según la Ley N° 21.719.
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="min-h-[42px] px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[42px] px-6 py-2 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors"
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
