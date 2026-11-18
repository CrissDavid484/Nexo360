import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  GraduationCap,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Search,
  UserPlus,
  Laptop,
  HeartHandshake,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  FileSpreadsheet,
  Building2,
  MapPin,
  BookOpen,
  Plus,
  Shield,
  Check,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import {
  SEDES_DUOC,
  CARRERAS_DUOC_LIST,
  DEFAULT_CAMPUS,
  matchesRutQuery,
  normalizeStudentProfile,
} from '../../utils/studentUtils';
import {
  evaluateAttendanceStatus,
  getAttendanceColorClasses,
  resolveTrafficLightColor,
  getSatRiskBadgeMeta,
  extractCourseAttendanceRate,
} from '../../utils/satUtils';
import { CoursesAdminSection } from '../admin/CoursesAdminSection';
import { EarlyWarningSatSection } from '../admin/EarlyWarningSatSection';

const INITIAL_CAREERS_CATALOG = CARRERAS_DUOC_LIST.map((name, idx) => ({
  id: `career-${idx}`,
  name,
  school: `Escuela Duoc UC - ${DEFAULT_CAMPUS}`,
}));

const INITIAL_SEDES_CATALOG = SEDES_DUOC.map((name, idx) => ({
  id: `sede-${idx}`,
  name,
  city: 'Región Metropolitana',
}));

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

const STAFF_ROLE_BADGES = {
  coordinador_paedis: {
    label: 'Coordinador PAEDIS',
    badgeClass: 'bg-purple-100 text-purple-900 border border-purple-200',
    description:
      'Gestión y acompañamiento de estudiantes con necesidades educativas especiales, aprobación de ajustes razonables y vinculación UAP.',
  },
  admin: {
    label: 'Administrador Nexo360',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200',
    description:
      'Control de plataforma, asignación de roles de seguridad RBAC, parametrización de carreras, sedes y auditorías de actividad.',
  },
  profesor: {
    label: 'Docente Duoc UC',
    badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200',
    description:
      'Recepción y aplicación de fichas de ajustes razonables en aula y evaluación curricular.',
  },
  director: {
    label: 'Directivo Institucional',
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    description:
      'Supervisión de continuidad de estudios, equidad en titulación y excepciones académicas normativas.',
  },
  default: {
    label: 'Personal Administrativo',
    badgeClass: 'bg-slate-100 text-slate-800 border border-slate-200',
    description:
      'Gestión operativa, soporte de beneficios institucionales y atención a la comunidad.',
  },
};

const getStaffRoleBadge = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'administrador') return STAFF_ROLE_BADGES.admin;
  if (r === 'subdirector') return STAFF_ROLE_BADGES.director;
  return STAFF_ROLE_BADGES[r] || STAFF_ROLE_BADGES.default;
};

const ACADEMIC_STATUS_BADGE_MAP = {
  activo: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  titulado: 'bg-purple-50 text-purple-900 border-purple-200',
  desercion: 'bg-rose-50 text-rose-900 border-rose-300',
};

const sortByNameEs = (items) =>
  [...items].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

const filterCatalogByName = (sortedItems, search) => {
  const q = search.toLowerCase().trim();
  if (!q) return sortedItems;
  return sortedItems.filter((item) => (item.name || '').toLowerCase().includes(q));
};

const isNumericRutMatch = (rut, searchTerm) =>
  Boolean(searchTerm && /\d/.test(searchTerm) && rut && matchesRutQuery(rut, searchTerm));

/**
 * Filtra y ordena alfabéticamente usuarios del directorio institucional reutilizando matchesRutQuery.
 */
function filterAndSortDirectoryUsers(users, searchTerm, extraPredicate) {
  const q = searchTerm.toLowerCase().trim();
  const hasDigitQuery = /\d/.test(searchTerm);

  return users
    .filter((u) => {
      const name = u.fullName || u.nombre || '';
      const sede = u.campus || u.sede || '';
      const email = u.email || '';

      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        sede.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        (hasDigitQuery && matchesRutQuery(u.rut, searchTerm));

      return matchesSearch && extraPredicate(u);
    })
    .sort((a, b) => {
      const nameA = (a.fullName || a.nombre || a.email || '').trim();
      const nameB = (b.fullName || b.nombre || b.email || '').trim();
      const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      return cmp !== 0 ? cmp : (a.rut || '').localeCompare(b.rut || '');
    });
}

const CATALOG_CONFIG = {
  careers: {
    idPrefix: 'career',
    title: `Carreras Duoc UC - ${DEFAULT_CAMPUS}`,
    subtitleFallback: `Escuela Duoc UC - ${DEFAULT_CAMPUS}`,
    addPlaceholder: 'Nombre de la nueva carrera...',
    searchPlaceholder: 'Filtrar carreras...',
    emptyText: 'No se encontraron carreras.',
    deleteLabelPrefix: 'Eliminar carrera',
    icon: BookOpen,
    confirmDelete: (item) => `¿Eliminar la carrera "${item.name}"?`,
    addFeedback: (name) => `Carrera "${name}" agregada exitosamente a la oferta académica.`,
    addAnnounce: (name) => `Carrera ${name} agregada.`,
    deleteFeedback: (name) => `Carrera "${name}" eliminada exitosamente.`,
    deleteAnnounce: (name) => `Carrera ${name} eliminada.`,
    buildLocalItem: (name) => ({
      id: `career-${Date.now()}`,
      name,
      school: `Escuela Duoc UC - ${DEFAULT_CAMPUS}`,
    }),
    createApi: (name) =>
      api.createAdminCareer({ name, school: `Escuela Duoc UC - ${DEFAULT_CAMPUS}` }),
    deleteApi: (key) => api.deleteAdminCareer(key),
  },
  sedes: {
    idPrefix: 'sede',
    title: `Sedes Duoc UC - ${DEFAULT_CAMPUS}`,
    subtitleFallback: `Campus Duoc UC - ${DEFAULT_CAMPUS}`,
    addPlaceholder: `Nombre de sede institucional (ej. Sede Antonio Varas)...`,
    searchPlaceholder: 'Filtrar sedes...',
    emptyText: 'No se encontraron sedes.',
    deleteLabelPrefix: 'Eliminar sede',
    icon: MapPin,
    confirmDelete: (item) => `¿Eliminar la sede "${item.name}"?`,
    addFeedback: (name) =>
      `Sede "${name}" agregada exitosamente a Duoc UC.`,
    addAnnounce: (name) => `Sede ${name} agregada.`,
    deleteFeedback: (name) => `Sede "${name}" eliminada exitosamente.`,
    deleteAnnounce: (name) => `Sede ${name} eliminada.`,
    buildLocalItem: (name) => ({
      id: `sede-${Date.now()}`,
      name,
      city: 'Región Metropolitana',
    }),
    createApi: (name) => api.createAdminSede({ name, city: 'Región Metropolitana' }),
    deleteApi: (key) => api.deleteAdminSede(key),
  },
};

/**
 * Tarjeta CRUD reutilizable para Carreras y Sedes Duoc UC.
 */
function CatalogCrudCard({
  kind,
  items,
  totalCount,
  newInput,
  searchValue,
  onNewInputChange,
  onSearchChange,
  onAddSubmit,
  onDeleteItem,
  getVoiceProps,
}) {
  const cfg = CATALOG_CONFIG[kind];
  const Icon = cfg.icon;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#002B49]" aria-hidden="true" />
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            {cfg.title} ({totalCount})
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          Orden Alfabético
        </span>
      </div>

      <form onSubmit={onAddSubmit} className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={newInput}
            onChange={(e) => onNewInputChange(e.target.value)}
            placeholder={cfg.addPlaceholder}
            aria-label={cfg.addPlaceholder}
            {...getVoiceProps(cfg.addPlaceholder)}
            className="flex-1 min-h-[40px] px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
          />
          <button
            type="submit"
            {...getVoiceProps(`Agregar ${kind === 'careers' ? 'carrera' : 'sede'}`)}
            className="min-h-[40px] px-4 py-2 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Agregar</span>
          </button>
        </div>
      </form>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={cfg.searchPlaceholder}
          aria-label={cfg.searchPlaceholder}
          {...getVoiceProps(cfg.searchPlaceholder)}
          className="w-full min-h-[38px] pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
        />
      </div>

      <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{cfg.emptyText}</p>
        ) : (
          items.map((item) => (
            <div
              key={item._id || item.id || item.name}
              className="pt-2 flex items-center justify-between gap-2 hover:bg-slate-50 p-2 rounded-xl transition-colors"
            >
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                  {item.name}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {item.school || item.city || cfg.subtitleFallback}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteItem(item)}
                title={`${cfg.deleteLabelPrefix} ${item.name}`}
                aria-label={`${cfg.deleteLabelPrefix} ${item.name}`}
                {...getVoiceProps(`${cfg.deleteLabelPrefix} ${item.name}`)}
                className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ADMIN_SUB_TABS = [
  {
    id: 'estudiantes',
    label: 'Alumnado & Estudiantes PAEDIS',
    announceMsg: 'Pestaña de Alumnado y Retención Estudiantil seleccionada.',
    icon: Users,
    iconColor: 'text-amber-400',
    showCount: true,
  },
  {
    id: 'carreras-sedes',
    label: 'Carreras & Sedes (CRUD)',
    announceMsg: 'Pestaña de Gestión Dinámica de Carreras y Sedes seleccionada.',
    icon: Building2,
    iconColor: 'text-blue-400',
  },
  {
    id: 'oferta-ramos',
    label: 'Oferta Académica & Simulador (Excel / BD)',
    announceMsg: 'Pestaña de Oferta Académica y Carga de Ramos seleccionada.',
    icon: FileSpreadsheet,
    iconColor: 'text-emerald-400',
  },
  {
    id: 'alerta-temprana',
    label: 'Alerta Temprana (SAT)',
    announceMsg: 'Pestaña de Sistema de Alerta Temprana (SAT) seleccionada.',
    icon: AlertOctagon,
    iconColor: 'text-rose-400',
  },
];

const STUDENT_STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'activo', label: 'Activos' },
  { id: 'desercion', label: 'Deserción' },
  { id: 'titulado', label: 'Titulados' },
  { id: 'paedis', label: 'Solo PAEDIS' },
];

const ADMIN_ROLE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'coordinadores', label: 'Coordinadores PAEDIS' },
  { id: 'administradores', label: 'Administradores' },
  { id: 'docentes', label: 'Docentes & Directivos' },
];

const ATTENDANCE_STATUS_TEXT = {
  ri: '⚠️ RI (Reprobado)',
  preventive: 'Alerta Preventiva',
  normal: 'Cumple Asistencia',
  justified: 'Justificada',
};

export const AdminPanelView = () => {
  const { announce, getVoiceProps } = useAccessibility();
  const { user } = useAuth();

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isCoordinator = userRole === 'coordinador_paedis';
  const canManageAdmin = isAdmin || isCoordinator;

  const [adminSubTab, setAdminSubTab] = useState('estudiantes');
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [directoryMode, setDirectoryMode] = useState('estudiantes');
  const [adminRoleFilter, setAdminRoleFilter] = useState('all');
  const [selectedAdminForDetail, setSelectedAdminForDetail] = useState(null);

  // Estado CRUD unificado de Carreras y Sedes
  const [catalogState, setCatalogState] = useState({
    careers: { items: INITIAL_CAREERS_CATALOG, newInput: '', search: '' },
    sedes: { items: INITIAL_SEDES_CATALOG, newInput: '', search: '' },
  });

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [statusForm, setStatusForm] = useState({ academicStatus: 'activo', statusReason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [modalError, setModalError] = useState('');

  const currentYear = new Date().getFullYear();
  const dynamicInitialPassword = `Duoc${currentYear}!`;

  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: dynamicInitialPassword,
    rut: '',
    role: '',
    career: '',
    campus: DEFAULT_CAMPUS,
  });

  const [careerQuery, setCareerQuery] = useState('');
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);
  const careerDropdownRef = useRef(null);
  const statusModalRef = useRef(null);
  const statusCloseBtnRef = useRef(null);
  const createModalRef = useRef(null);
  const createCloseBtnRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useOnClickOutside(careerDropdownRef, () => setIsCareerDropdownOpen(false), {
    enabled: isCareerDropdownOpen,
  });

  useAccessibleModal({
    isOpen: isStatusModalOpen && Boolean(selectedStudentForStatus),
    onClose: () => setIsStatusModalOpen(false),
    containerRef: statusModalRef,
    initialFocusRef: statusCloseBtnRef,
  });

  useAccessibleModal({
    isOpen: isCreateModalOpen,
    onClose: () => {
      setIsCreateModalOpen(false);
      setIsCareerDropdownOpen(false);
    },
    containerRef: createModalRef,
    initialFocusRef: createCloseBtnRef,
  });

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsRes, studentsRes, careersRes, sedesRes] = await Promise.allSettled([
        api.getAdminMetrics(),
        api.getAdminStudents(),
        api.getAdminCareers(),
        api.getAdminSedes(),
      ]);

      if (!isMountedRef.current) return;

      const settledResults = [
        ['métricas', metricsRes],
        ['estudiantes', studentsRes],
        ['carreras', careersRes],
        ['sedes', sedesRes],
      ];
      settledResults.forEach(([label, res]) => {
        if (res.status === 'rejected') {
          console.warn(`[AdminPanelView] Error cargando ${label}:`, res.reason);
        }
      });

      const metricsData = metricsRes.status === 'fulfilled' ? metricsRes.value : null;
      const studentsData = studentsRes.status === 'fulfilled' ? studentsRes.value : null;
      const careersData = careersRes.status === 'fulfilled' ? careersRes.value : null;
      const sedesData = sedesRes.status === 'fulfilled' ? sedesRes.value : null;

      if (metricsData?.success) {
        setMetrics(metricsData.metrics);
      }
      if (studentsData?.success && Array.isArray(studentsData.students)) {
        setStudents(
          studentsData.students.map((raw) => {
            const normalized = normalizeStudentProfile(raw);
            return {
              ...normalized,
              fullName: raw.fullName || raw.nombre || normalized.name,
            };
          })
        );
      }
      setCatalogState((prev) => ({
        careers: {
          ...prev.careers,
          items:
            careersData?.success && Array.isArray(careersData.careers) && careersData.careers.length > 0
              ? careersData.careers
              : prev.careers.items,
        },
        sedes: {
          ...prev.sedes,
          items:
            sedesData?.success && Array.isArray(sedesData.sedes) && sedesData.sedes.length > 0
              ? sedesData.sedes
              : prev.sedes.items,
        },
      }));
    } catch (err) {
      console.error('[AdminPanelView] Error cargando datos del panel de administración:', err);
      if (isMountedRef.current) {
        setFeedbackMessage({
          type: 'error',
          text: 'Error al conectar con la base de datos de administración.',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAdminData().catch((err) => {
      console.error('[AdminPanelView] Error en carga inicial:', err);
    });
  }, [loadAdminData]);

  const sortedCareers = useMemo(
    () => sortByNameEs(catalogState.careers.items),
    [catalogState.careers.items]
  );
  const sortedSedes = useMemo(
    () => sortByNameEs(catalogState.sedes.items),
    [catalogState.sedes.items]
  );

  const filteredCareersForCombobox = useMemo(
    () => filterCatalogByName(sortedCareers, careerQuery),
    [sortedCareers, careerQuery]
  );
  const filteredCareersCrud = useMemo(
    () => filterCatalogByName(sortedCareers, catalogState.careers.search),
    [sortedCareers, catalogState.careers.search]
  );
  const filteredSedesCrud = useMemo(
    () => filterCatalogByName(sortedSedes, catalogState.sedes.search),
    [sortedSedes, catalogState.sedes.search]
  );

  const studentUsers = useMemo(
    () => students.filter((s) => !isStaffOrAdministrativeRole(s.role)),
    [students]
  );
  const administrativeUsers = useMemo(
    () => students.filter((s) => isStaffOrAdministrativeRole(s.role)),
    [students]
  );

  const filteredStudents = useMemo(
    () =>
      filterAndSortDirectoryUsers(studentUsers, searchTerm, (s) => {
        if (filterStatus === 'paedis') {
          return Boolean(s.isPaedis) || s.role === 'estudiante_paedis';
        }
        if (filterStatus !== 'all') {
          return s.academicStatus === filterStatus;
        }
        return true;
      }),
    [studentUsers, searchTerm, filterStatus]
  );

  const filteredAdministradores = useMemo(
    () =>
      filterAndSortDirectoryUsers(administrativeUsers, searchTerm, (u) => {
        const r = (u.role || '').toLowerCase();
        if (adminRoleFilter === 'coordinadores') return r === 'coordinador_paedis';
        if (adminRoleFilter === 'administradores') return r === 'admin' || r === 'administrador';
        if (adminRoleFilter === 'docentes') {
          return (
            r === 'profesor' ||
            r === 'director' ||
            r === 'subdirector' ||
            r === 'administrativo'
          );
        }
        return true;
      }),
    [administrativeUsers, searchTerm, adminRoleFilter]
  );

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

      if (!isMountedRef.current) return;

      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Estado de ${selectedStudentForStatus.fullName} actualizado a "${statusForm.academicStatus.toUpperCase()}".`,
        });
        announce(`Estado de ${selectedStudentForStatus.fullName} actualizado.`, 'polite');
        setIsStatusModalOpen(false);

        if (
          selectedStudentForDetail &&
          (selectedStudentForDetail._id === selectedStudentForStatus._id ||
            selectedStudentForDetail.id === selectedStudentForStatus.id)
        ) {
          setSelectedStudentForDetail({
            ...selectedStudentForDetail,
            academicStatus: statusForm.academicStatus,
            statusReason: statusForm.statusReason,
          });
        }

        await loadAdminData();
      } else {
        setFeedbackMessage({ type: 'error', text: res?.message || 'Error al actualizar estado.' });
      }
    } catch (err) {
      console.error('[AdminPanelView] Error actualizando estado:', err);
      if (isMountedRef.current) {
        setFeedbackMessage({ type: 'error', text: 'Error de conexión al actualizar estado.' });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const failCreateModalValidation = (errText) => {
    setModalError(errText);
    setFeedbackMessage({ type: 'error', text: errText });
    announce(errText, 'assertive');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!consentAccepted) {
      failCreateModalValidation(
        'Debe aceptar la declaración de consentimiento y tratamiento de datos personales conforme a la Ley N° 21.719.'
      );
      return;
    }

    if (!newUserForm.fullName.trim()) {
      failCreateModalValidation('Por favor, ingresa el nombre completo.');
      return;
    }

    if (!newUserForm.email.trim() || !newUserForm.email.includes('@')) {
      failCreateModalValidation(
        'Debe ingresar un correo institucional Duoc UC válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).'
      );
      return;
    }

    if (!newUserForm.rut.trim()) {
      failCreateModalValidation('Por favor, ingresa el RUT del estudiante.');
      return;
    }

    if (!newUserForm.role) {
      failCreateModalValidation('Por favor, selecciona un rol institucional.');
      return;
    }

    const effectiveCareer = (newUserForm.career || careerQuery || '').trim();
    if (!effectiveCareer) {
      failCreateModalValidation('Por favor, selecciona o escribe una carrera.');
      return;
    }

    if (!newUserForm.campus.trim()) {
      failCreateModalValidation('Por favor, selecciona una sede.');
      return;
    }

    if ((newUserForm.role === 'admin' || newUserForm.role === 'administrador') && !isAdmin) {
      failCreateModalValidation(
        'Acceso restringido: Solo un Administrador puede crear o asignar usuarios con el rol Administrador.'
      );
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
        career: effectiveCareer,
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
      if (!isMountedRef.current) return;

      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Usuario ${newUserForm.fullName} registrado exitosamente con contraseña inicial institucional.`,
        });
        announce(`Usuario ${newUserForm.fullName} registrado exitosamente.`, 'polite');
        setIsCreateModalOpen(false);
        setIsCareerDropdownOpen(false);
        setNewUserForm({
          fullName: '',
          email: '',
          password: dynamicInitialPassword,
          rut: '',
          role: '',
          career: '',
          campus: DEFAULT_CAMPUS,
        });
        setCareerQuery('');
        setModalError('');
        setConsentAccepted(true);
        await loadAdminData();
      } else {
        failCreateModalValidation(res?.message || 'Error al registrar usuario.');
      }
    } catch (err) {
      console.error('[AdminPanelView] Error al crear usuario:', err);
      if (isMountedRef.current) {
        failCreateModalValidation(err.message || 'Error de conexión al registrar usuario.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

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
      if (!isMountedRef.current) return;

      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Usuario ${student.fullName} eliminado de la base de datos.`,
        });
        if (
          selectedStudentForDetail &&
          (selectedStudentForDetail._id === student._id ||
            selectedStudentForDetail.id === student.id)
        ) {
          setSelectedStudentForDetail(null);
        }
        await loadAdminData();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res?.message || 'No se pudo eliminar el usuario.',
        });
      }
    } catch (err) {
      console.error('[AdminPanelView] Error eliminando usuario:', err);
      if (isMountedRef.current) {
        setFeedbackMessage({ type: 'error', text: 'Error de conexión al eliminar usuario.' });
      }
    }
  };

  const updateCatalogField = (kind, patch) => {
    setCatalogState((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], ...patch },
    }));
  };

  const handleCatalogAdd = async (kind, e) => {
    e.preventDefault();
    const cfg = CATALOG_CONFIG[kind];
    const clean = catalogState[kind].newInput.trim();
    if (!clean) return;

    const newObj = cfg.buildLocalItem(clean);
    setCatalogState((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        items: [newObj, ...prev[kind].items],
        newInput: '',
      },
    }));
    setFeedbackMessage({ type: 'success', text: cfg.addFeedback(clean) });
    announce(cfg.addAnnounce(clean), 'polite');

    try {
      const res = await cfg.createApi(clean);
      if (res && res.success === false) {
        console.warn(`[AdminPanelView] Sincronización de ${kind}:`, res.message);
      }
    } catch (err) {
      console.warn(`[AdminPanelView] Sincronización de ${kind} con backend:`, err);
    }
  };

  const handleCatalogDelete = async (kind, item) => {
    const cfg = CATALOG_CONFIG[kind];
    if (!window.confirm(cfg.confirmDelete(item))) return;

    const targetKey = item._id || item.id || item.name;
    setCatalogState((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        items: prev[kind].items.filter((entry) => (entry._id || entry.id || entry.name) !== targetKey),
      },
    }));
    setFeedbackMessage({ type: 'success', text: cfg.deleteFeedback(item.name) });
    announce(cfg.deleteAnnounce(item.name), 'polite');

    try {
      const res = await cfg.deleteApi(targetKey);
      if (res && res.success === false) {
        console.warn(`[AdminPanelView] Eliminación de ${kind} en backend:`, res.message);
      }
    } catch (err) {
      console.warn(`[AdminPanelView] Sincronización de eliminación de ${kind}:`, err);
    }
  };

  const executiveKpis = [
    {
      id: 'total-users',
      label: 'Total Registrados',
      value: metrics?.totalUsers ?? '...',
      subtitle: `${metrics?.totalStudents ?? 0} estudiantes • ${metrics?.totalFaculty ?? 0} personal`,
      valueClass: 'text-slate-950',
      subtitleClass: 'text-[11px] font-bold text-slate-600 block',
      icon: Users,
      iconWrapperClass: 'bg-blue-50 text-[#002B49] border-blue-100',
    },
    {
      id: 'paedis-pop',
      label: 'Población PAEDIS',
      value: metrics?.paedisCount ?? '...',
      subtitle: `${metrics?.paedisPercentage ?? 0}% de los estudiantes`,
      valueClass: 'text-slate-950',
      subtitleClass:
        'text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block',
      icon: HeartHandshake,
      iconWrapperClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },
    {
      id: 'sim-usage',
      label: 'Uso del Simulador',
      value: metrics?.simulatorUsersCount ?? '...',
      subtitle: metrics?.totalSimulatorInteractions
        ? `${metrics.totalSimulatorInteractions} sesiones registradas`
        : `${metrics?.simulatorUsersCount ?? 0} estudiantes activos`,
      valueClass: 'text-slate-950',
      subtitleClass:
        'text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-block',
      icon: Laptop,
      iconWrapperClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      id: 'alert-dropout',
      label: 'En Alerta de Deserción',
      value: metrics?.riskSummary?.altoRiesgo ?? '...',
      subtitle: `${metrics?.riskSummary?.medioRiesgo ?? 0} en riesgo moderado`,
      valueClass: 'text-rose-700',
      subtitleClass:
        'text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md inline-block',
      icon: AlertTriangle,
      iconWrapperClass: 'bg-rose-50 text-rose-700 border-rose-100',
    },
  ];

  const careerInputVoiceProps = getVoiceProps('Carrera Duoc UC. Escribe o selecciona una carrera');

  return (
    <div className="space-y-7 animate-fade-in pb-12">
      {/* 1. HERO BANNER INSTITUCIONAL DUOC UC - SEDE ALAMEDA */}
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
                  ? 'Módulo Exclusivo Administrador • Duoc UC - Sede Alameda'
                  : 'Módulo Coordinación PAEDIS • Duoc UC - Sede Alameda'}
              </span>
            </div>
            <h1
              id="admin-panel-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
            >
              Panel de Control & Analítica Predictiva
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Supervisión de métricas de retención en Duoc UC - Sede Alameda, modelo predictivo
              de deserción por asistencia reglamentaria (&lt; 70% RI) y gestión institucional
              conforme a la Ley N° 21.719 de Protección de Datos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                loadAdminData().catch((err) => {
                  console.error('[AdminPanelView] Error al refrescar datos:', err);
                });
              }}
              aria-label="Actualizar datos de la base de datos"
              {...getVoiceProps('Refrescar datos del panel de administración')}
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
                  announce(
                    'Acción denegada: Requiere privilegios de Administrador o Coordinador PAEDIS.',
                    'assertive'
                  );
                  return;
                }
                setIsCreateModalOpen(true);
                setModalError('');
                setConsentAccepted(true);
              }}
              disabled={!canManageAdmin}
              aria-disabled={!canManageAdmin}
              {...getVoiceProps('Registrar nuevo estudiante o usuario en Nexo360')}
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
        {ADMIN_SUB_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = adminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setAdminSubTab(tab.id);
                announce(tab.announceMsg, 'polite');
              }}
              {...getVoiceProps(tab.label)}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                isActive
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${tab.iconColor}`} aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.showCount && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-[#002B49]">
                  {studentUsers.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Alerta de Feedback Accesible */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          {...getVoiceProps(feedbackMessage.text)}
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
            {...getVoiceProps('Cerrar notificación')}
            className="text-slate-500 hover:text-slate-900 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RENDERIZADO SEGÚN SUB-PESTAÑA */}
      {adminSubTab === 'alerta-temprana' ? (
        <EarlyWarningSatSection announce={announce} />
      ) : adminSubTab === 'oferta-ramos' ? (
        <CoursesAdminSection />
      ) : adminSubTab === 'carreras-sedes' ? (
        <section aria-labelledby="careers-sedes-title" className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider text-[#002B49] bg-blue-100">
              <Building2 className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              <span>Gestión Dinámica • Duoc UC - Sede Alameda</span>
            </div>
            <h2 id="careers-sedes-title" className="text-xl sm:text-2xl font-black text-slate-900">
              Administración de Carreras y Sedes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Agrega y elimina carreras y sedes dinámicamente para Duoc UC - Sede
              Alameda. Los cambios se sincronizan en tiempo real con el formulario de registro y la
              oferta académica.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CatalogCrudCard
              kind="careers"
              items={filteredCareersCrud}
              totalCount={sortedCareers.length}
              newInput={catalogState.careers.newInput}
              searchValue={catalogState.careers.search}
              onNewInputChange={(val) => updateCatalogField('careers', { newInput: val })}
              onSearchChange={(val) => updateCatalogField('careers', { search: val })}
              onAddSubmit={(e) => {
                handleCatalogAdd('careers', e).catch((err) => {
                  console.error('[AdminPanelView] Error agregando carrera:', err);
                });
              }}
              onDeleteItem={(item) => {
                handleCatalogDelete('careers', item).catch((err) => {
                  console.error('[AdminPanelView] Error eliminando carrera:', err);
                });
              }}
              getVoiceProps={getVoiceProps}
            />

            <CatalogCrudCard
              kind="sedes"
              items={filteredSedesCrud}
              totalCount={sortedSedes.length}
              newInput={catalogState.sedes.newInput}
              searchValue={catalogState.sedes.search}
              onNewInputChange={(val) => updateCatalogField('sedes', { newInput: val })}
              onSearchChange={(val) => updateCatalogField('sedes', { search: val })}
              onAddSubmit={(e) => {
                handleCatalogAdd('sedes', e).catch((err) => {
                  console.error('[AdminPanelView] Error agregando sede:', err);
                });
              }}
              onDeleteItem={(item) => {
                handleCatalogDelete('sedes', item).catch((err) => {
                  console.error('[AdminPanelView] Error eliminando sede:', err);
                });
              }}
              getVoiceProps={getVoiceProps}
            />
          </div>
        </section>
      ) : (
        <>
          {/* 2. TARJETAS KPI EJECUTIVAS */}
          <section aria-labelledby="kpis-heading" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2
                id="kpis-heading"
                className="text-base sm:text-lg font-black text-slate-900 tracking-tight"
              >
                Métricas Clave de Uso & Matrícula • Duoc UC - {DEFAULT_CAMPUS}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Actualización en vivo vía MongoDB & Scraping
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {executiveKpis.map((kpi) => {
                const KpiIcon = kpi.icon;
                return (
                  <div
                    key={kpi.id}
                    tabIndex={0}
                    {...getVoiceProps(`${kpi.label}: ${kpi.value}. ${kpi.subtitle}`)}
                    className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        {kpi.label}
                      </span>
                      <span className={`text-3xl font-black block tracking-tight ${kpi.valueClass}`}>
                        {kpi.value}
                      </span>
                      <span className={kpi.subtitleClass}>{kpi.subtitle}</span>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${kpi.iconWrapperClass}`}
                    >
                      <KpiIcon className="w-6 h-6" aria-hidden="true" />
                    </div>
                  </div>
                );
              })}
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
                  <span>Modelo Predictivo de Inteligencia Académica • Duoc UC - Sede Alameda</span>
                </div>
                <h2
                  id="predictive-analytics-title"
                  className="text-xl sm:text-2xl font-black text-slate-900 mt-1"
                >
                  Semáforo Predictivo de Retención vs. Deserción
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Algoritmo regulatorio Duoc UC - Sede Alameda alimentado por asistencias reales
                  (&lt; 70% Reprobación por Inasistencia [RI], 70-75% Alerta Preventiva, &gt; 75%
                  Retención Favorable).
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
                  {[
                    {
                      label: 'Estudiantes Activos',
                      value: metrics?.statusDistribution?.activo ?? 0,
                      textClass: 'text-[#002B49]',
                      barClass: 'bg-[#002B49]',
                    },
                    {
                      label: 'En Deserción / Retiro',
                      value: metrics?.statusDistribution?.desercion ?? 0,
                      textClass: 'text-rose-700',
                      barClass: 'bg-rose-500',
                    },
                    {
                      label: 'Titulados / Egresados',
                      value: metrics?.statusDistribution?.titulado ?? 0,
                      textClass: 'text-emerald-700',
                      barClass: 'bg-emerald-500',
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>{item.label}</span>
                        <span className={`font-black ${item.textClass}`}>{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`${item.barClass} h-full rounded-full transition-all duration-500`}
                          style={{
                            width: `${(item.value / (metrics?.totalStudents || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna 2: Semáforo Predictivo Global */}
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  2. Semáforo Predictivo Global
                </span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  {[
                    {
                      label: 'Bajo Riesgo (>75%)',
                      count: metrics?.riskSummary?.bajoRiesgo ?? 0,
                      boxClass: 'bg-emerald-50 border-emerald-200',
                      numClass: 'text-emerald-950',
                      tagClass: 'text-emerald-800',
                    },
                    {
                      label: 'Alerta (70-75%)',
                      count: metrics?.riskSummary?.medioRiesgo ?? 0,
                      boxClass: 'bg-amber-50 border-amber-200',
                      numClass: 'text-amber-950',
                      tagClass: 'text-amber-800',
                    },
                    {
                      label: 'Riesgo RI (<70%)',
                      count: metrics?.riskSummary?.altoRiesgo ?? 0,
                      boxClass: 'bg-rose-50 border-rose-200',
                      numClass: 'text-rose-950',
                      tagClass: 'text-rose-800',
                    },
                  ].map((cell) => (
                    <div
                      key={cell.label}
                      tabIndex={0}
                      {...getVoiceProps(`${cell.label}: ${cell.count} estudiantes`)}
                      className={`p-3 border rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${cell.boxClass}`}
                    >
                      <span className={`text-2xl font-black block ${cell.numClass}`}>
                        {cell.count}
                      </span>
                      <span className={`text-[10px] font-black uppercase mt-0.5 block ${cell.tagClass}`}>
                        {cell.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  *Las alertas tempranas calculan el riesgo de reprobación por inasistencia (RI)
                  según la asistencia real por asignatura inscrita.
                </p>
              </div>

              {/* Columna 3: Normativa Duoc UC */}
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  3. Normativa Académica Duoc UC - {DEFAULT_CAMPUS}
                </span>
                <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-black flex items-center justify-center shrink-0 text-[10px]">
                      RI
                    </span>
                    <span>
                      <strong>Asistencia &lt; 70%:</strong> Reprobación por Inasistencia inmediata en
                      la asignatura.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-black flex items-center justify-center shrink-0 text-[10px]">
                      ⚠️
                    </span>
                    <span>
                      <strong>Asistencia 70% a 75%:</strong> Zona de riesgo crítico, requiere
                      seguimiento docente y tutor PAR.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-[10px]">
                      ✓
                    </span>
                    <span>
                      <strong>Asistencia &gt; 75%:</strong> Cumplimiento regular con alta probabilidad
                      de titulación y retención.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. DIRECTORIO INSTITUCIONAL: ESTUDIANTES O ADMINISTRATIVOS */}
          <section
            aria-labelledby="students-directory-title"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
                      directoryMode === 'estudiantes'
                        ? 'text-[#002B49] bg-amber-100 border border-amber-300'
                        : 'text-purple-900 bg-purple-100 border border-purple-300'
                    }`}
                  >
                    {directoryMode === 'estudiantes' ? (
                      <>
                        <Users className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                        Estudiantes
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />
                        Administrativos
                      </>
                    )}
                  </span>

                  <div
                    className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200"
                    role="tablist"
                    aria-label="Seleccionar directorio institucional"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={directoryMode === 'estudiantes'}
                      onClick={() => {
                        setDirectoryMode('estudiantes');
                        announce('Mostrando directorio de estudiantes.', 'polite');
                      }}
                      {...getVoiceProps(`Directorio de Estudiantes, ${studentUsers.length} registros`)}
                      className={`min-h-[30px] px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        directoryMode === 'estudiantes'
                          ? 'bg-[#002B49] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Estudiantes ({studentUsers.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={directoryMode === 'administrativos'}
                      onClick={() => {
                        setDirectoryMode('administrativos');
                        announce('Mostrando directorio de administrativos.', 'polite');
                      }}
                      {...getVoiceProps(
                        `Directorio de Administrativos, ${administrativeUsers.length} registros`
                      )}
                      className={`min-h-[30px] px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        directoryMode === 'administrativos'
                          ? 'bg-[#002B49] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Administrativos ({administrativeUsers.length})
                    </button>
                  </div>
                </div>

                <h2
                  id="students-directory-title"
                  className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
                >
                  {directoryMode === 'estudiantes'
                    ? `Directorio de Estudiantes Registrados (${filteredStudents.length})`
                    : `Directorio de Administrativos Registrados (${filteredAdministradores.length})`}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {directoryMode === 'estudiantes'
                    ? `Haz clic en cualquier estudiante de Duoc UC - ${DEFAULT_CAMPUS} para abrir su ficha completa con asistencia detallada por asignatura y semáforo predictivo.`
                    : `Haz clic en cualquier miembro del personal de Duoc UC - ${DEFAULT_CAMPUS} para ver su rol institucional, funciones asignadas y datos de contacto.`}
                </p>
              </div>

              {directoryMode === 'estudiantes' ? (
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  role="group"
                  aria-label="Filtrar por estado"
                >
                  {STUDENT_STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterStatus(f.id)}
                      {...getVoiceProps(`Filtrar estudiantes por estado: ${f.label}`)}
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
              ) : (
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  role="group"
                  aria-label="Filtrar personal administrativo por rol"
                >
                  {ADMIN_ROLE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAdminRoleFilter(f.id)}
                      {...getVoiceProps(`Filtrar personal administrativo por rol: ${f.label}`)}
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        adminRoleFilter === f.id
                          ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
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
                placeholder={
                  directoryMode === 'estudiantes'
                    ? 'Buscar estudiante por nombre, RUT o sede...'
                    : 'Buscar administrativo por nombre, RUT, correo o sede...'
                }
                aria-label={
                  directoryMode === 'estudiantes'
                    ? 'Buscar estudiante por nombre, RUT o sede'
                    : 'Buscar administrativo por nombre, RUT, correo o sede'
                }
                {...getVoiceProps(
                  directoryMode === 'estudiantes'
                    ? 'Buscar estudiante por nombre, RUT o sede'
                    : 'Buscar administrativo por nombre, RUT, correo o sede'
                )}
                className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              />
            </div>

            {directoryMode === 'estudiantes' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list">
                {filteredStudents.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
                    No se encontraron estudiantes registrados con los criterios seleccionados.
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const studentSede = student.campus || student.sede || DEFAULT_CAMPUS;
                    const isExpanded =
                      selectedStudentForDetail &&
                      (selectedStudentForDetail._id === student._id ||
                        selectedStudentForDetail.id === student.id);
                    const isRutSearchMatch = isNumericRutMatch(student.rut, searchTerm);
                    const detailCourses =
                      selectedStudentForDetail?.enrolledCourses || student.enrolledCourses;

                    return (
                      <div
                        key={student._id || student.id}
                        role="listitem"
                        className={`transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForDetail(isExpanded ? null : student)}
                          {...getVoiceProps(
                            `${isExpanded ? 'Contraer' : 'Desplegar'} ficha de ${student.fullName}, ${studentSede}`
                          )}
                          className={`w-full p-4 text-left flex items-center justify-between gap-3 group cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                            isExpanded
                              ? 'bg-[#002B49] text-white border-2 border-[#002B49] shadow-lg rounded-t-2xl rounded-b-none'
                              : 'bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-[#002B49]/40 rounded-2xl shadow-xs hover:shadow-md'
                          }`}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Contraer' : 'Desplegar'} ficha y analítica de ${student.fullName}, ${studentSede}`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span
                              className={`font-black block truncate text-sm sm:text-base ${
                                isExpanded ? 'text-white' : 'text-slate-900 group-hover:text-[#002B49]'
                              }`}
                            >
                              {student.fullName}
                            </span>
                            <span
                              className={`text-xs font-semibold block truncate ${
                                isExpanded ? 'text-amber-300' : 'text-slate-500'
                              }`}
                            >
                              {studentSede}
                              {isRutSearchMatch ? ` • RUT: ${student.rut}` : ''}
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

                        {isExpanded && (
                          <div className="bg-white rounded-b-2xl border-x-2 border-b-2 border-[#002B49] p-5 sm:p-7 shadow-xl space-y-5 animate-fade-in">
                            <div className="border-b border-slate-100 pb-3">
                              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mb-1">
                                Ficha Integral del Estudiante • Duoc UC - {DEFAULT_CAMPUS}
                              </span>
                              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                {student.fullName}
                              </h3>
                              <span className="text-xs font-bold text-slate-500 block">
                                {studentSede} • {student.email} • RUT: {student.rut || 'Sin RUT'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                  Carrera
                                </span>
                                <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                                  {student.career || 'Ingeniería en Informática'}
                                </span>
                              </div>

                              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                  Estado Académico
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs font-black uppercase px-2 py-0.5 rounded-md border ${
                                      ACADEMIC_STATUS_BADGE_MAP[student.academicStatus] ||
                                      ACADEMIC_STATUS_BADGE_MAP.desercion
                                    }`}
                                  >
                                    {student.academicStatus || 'activo'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {student.statusReason || 'Calculado según asistencia y carga'}
                                </span>
                              </div>

                              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                  Condición PAEDIS
                                </span>
                                {student.isPaedis ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-black bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200">
                                    <span>♿ PAEDIS Acreditado</span>
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-slate-600 block">
                                    Estudiante Regular
                                  </span>
                                )}
                                {student.diagnosticoDeclarado && (
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {student.diagnosticoDeclarado}
                                  </span>
                                )}
                              </div>
                            </div>

                            {student.isPaedis &&
                              Array.isArray(student.ajustesAprobados) &&
                              student.ajustesAprobados.length > 0 && (
                                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1.5">
                                  <span className="text-xs font-black text-blue-950 block">
                                    Ajustes Razonables PAEDIS Aprobados (
                                    {student.ajustesAprobados.length}):
                                  </span>
                                  <ul className="space-y-1 text-xs text-blue-900 font-medium">
                                    {student.ajustesAprobados.map((aj, idx) => (
                                      <li key={idx} className="flex items-start gap-1.5">
                                        <span className="text-blue-700 font-bold">•</span>
                                        <span>
                                          <strong>{aj.tipo}:</strong> {aj.descripcion}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {/* Semáforo Predictivo de Deserción con Normativa Duoc UC */}
                            {(() => {
                              const pred = student.prediction || {};
                              const trafficMeta = resolveTrafficLightColor({
                                ...pred,
                                semaforo: pred.trafficLight || pred.semaforo || pred.color,
                              });
                              const satBadgeMeta = getSatRiskBadgeMeta(trafficMeta.key);
                              const trafficColor =
                                trafficMeta.key === 'rojo'
                                  ? 'red'
                                  : trafficMeta.key === 'amarillo'
                                  ? 'yellow'
                                  : 'green';

                              return (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
                                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                                        Semáforo Predictivo de Retención vs. Deserción
                                      </span>
                                    </div>

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
                                        {pred.predictionLabel ||
                                          `Evaluación de Retención Duoc UC - ${DEFAULT_CAMPUS}`}
                                      </span>
                                      <span className="text-xs text-slate-600 font-semibold block">
                                        Nivel de Riesgo:{' '}
                                        <strong>{pred.riskLevel || 'BAJO'}</strong> • Probabilidad de
                                        Titulación:{' '}
                                        <strong>{pred.graduationProbability ?? 90}%</strong>
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs font-black px-3 py-1 rounded-xl self-start sm:self-auto border ${satBadgeMeta.badgeClass}`}
                                    >
                                      Score de Riesgo: {pred.score ?? 15}%
                                    </span>
                                  </div>

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
                                  <GraduationCap className="w-5 h-5 text-[#002B49]" aria-hidden="true" />
                                  <h4 className="text-sm sm:text-base font-black text-slate-900">
                                    Asistencia Detallada por Asignatura Cursada
                                  </h4>
                                </div>
                                <span className="text-xs font-bold text-slate-500">
                                  {Array.isArray(detailCourses)
                                    ? `${detailCourses.length} asignaturas`
                                    : 'Sin ramos'}
                                </span>
                              </div>

                              {Array.isArray(selectedStudentForDetail?.enrolledCourses || student.enrolledCourses) &&
                              (selectedStudentForDetail.enrolledCourses || student.enrolledCourses).length >
                                0 ? (
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
                                      {(
                                        selectedStudentForDetail.enrolledCourses ||
                                        student.enrolledCourses
                                      ).map((c, i) => {
                                        const rate = extractCourseAttendanceRate({
                                          ...c,
                                          attendanceRate:
                                            c.attendanceRate ??
                                            c.porcentajeAsistencia ??
                                            c.asistenciaPorcentaje,
                                        });
                                        const attendanceEval = evaluateAttendanceStatus(rate, {
                                          mode: 'ri70',
                                        });
                                        const attendanceColors = getAttendanceColorClasses(
                                          rate,
                                          false,
                                          'ri70'
                                        );
                                        const statusText =
                                          ATTENDANCE_STATUS_TEXT[attendanceEval.status] ||
                                          'Cumple Asistencia';

                                        return (
                                          <tr
                                            key={c.sigla || i}
                                            {...getVoiceProps(
                                              `${c.nombre || c.curso || c.sigla}, asistencia ${rate} por ciento, ${statusText}`
                                            )}
                                            className="hover:bg-slate-50/80 transition-colors"
                                          >
                                            <td className="p-3 font-black text-slate-900">
                                              <span>{c.nombre || c.curso || c.sigla}</span>
                                              <span className="text-[11px] text-slate-400 block font-normal">
                                                {c.sigla}
                                              </span>
                                            </td>
                                            <td className="p-3 font-semibold text-slate-600">
                                              <span>Sec. {c.seccion || '001D'}</span>
                                              <span className="text-[11px] text-slate-400 block">
                                                {c.sala || DEFAULT_CAMPUS}
                                              </span>
                                            </td>
                                            <td className="p-3 font-bold text-slate-700">
                                              {c.clasesRegistradas
                                                ? `${c.asistencias ?? c.asistencia ?? 0} de ${c.clasesRegistradas} clases`
                                                : 'Registrado'}
                                            </td>
                                            <td className="p-3">
                                              <span
                                                className={`font-black px-2 py-0.5 rounded-md border text-xs ${attendanceColors.badgeClass}`}
                                              >
                                                {rate}%
                                              </span>
                                            </td>
                                            <td className="p-3">
                                              <span
                                                className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded border ${attendanceColors.badgeClass}`}
                                              >
                                                <span>{statusText}</span>
                                              </span>
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
                                    Las asignaturas específicas y su porcentaje de asistencia se
                                    extraen y sincronizan automáticamente en segundo plano al
                                    iniciar sesión mediante el portal Vivo Duoc.
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusModal(student)}
                                  disabled={!canManageAdmin}
                                  {...getVoiceProps(`Cambiar estado académico de ${student.fullName}`)}
                                  className="min-h-[40px] px-4 py-2 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-black rounded-xl border border-amber-400 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                  Cambiar Estado Académico
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteStudent(student).catch((err) => {
                                      console.error('[AdminPanelView] Error eliminando estudiante:', err);
                                    });
                                  }}
                                  disabled={!canManageAdmin}
                                  {...getVoiceProps(`Eliminar estudiante ${student.fullName}`)}
                                  className="min-h-[40px] px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-700" aria-hidden="true" />
                                  <span>Eliminar Estudiante</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedStudentForDetail(null)}
                                {...getVoiceProps('Contraer ficha del estudiante')}
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list">
                {filteredAdministradores.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
                    No se encontraron funcionarios administrativos con los criterios seleccionados.
                  </div>
                ) : (
                  filteredAdministradores.map((admin) => {
                    const adminSede = admin.campus || admin.sede || DEFAULT_CAMPUS;
                    const roleBadge = getStaffRoleBadge(admin.role);
                    const isExpanded =
                      selectedAdminForDetail &&
                      (selectedAdminForDetail._id === admin._id ||
                        selectedAdminForDetail.id === admin.id);
                    const isRutSearchMatch = isNumericRutMatch(admin.rut, searchTerm);

                    return (
                      <div
                        key={admin._id || admin.id}
                        role="listitem"
                        className={`transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedAdminForDetail(isExpanded ? null : admin)}
                          {...getVoiceProps(
                            `${isExpanded ? 'Contraer' : 'Desplegar'} ficha de ${admin.fullName}, ${roleBadge.label}, ${adminSede}`
                          )}
                          className={`w-full p-4 text-left flex items-center justify-between gap-3 group cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                            isExpanded
                              ? 'bg-purple-950 text-white border-2 border-purple-950 shadow-lg rounded-t-2xl rounded-b-none'
                              : 'bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-purple-900/40 rounded-2xl shadow-xs hover:shadow-md'
                          }`}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Contraer' : 'Desplegar'} ficha de ${admin.fullName}, ${roleBadge.label}, ${adminSede}`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span
                              className={`font-black block truncate text-sm sm:text-base ${
                                isExpanded
                                  ? 'text-white'
                                  : 'text-slate-900 group-hover:text-purple-950'
                              }`}
                            >
                              {admin.fullName}
                            </span>
                            <span
                              className={`text-xs font-semibold block truncate ${
                                isExpanded ? 'text-purple-200' : 'text-slate-500'
                              }`}
                            >
                              {adminSede} • {roleBadge.label}
                              {isRutSearchMatch ? ` • RUT: ${admin.rut}` : ''}
                            </span>
                          </div>

                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                              isExpanded
                                ? 'bg-white/15 text-purple-200 rotate-90'
                                : 'bg-slate-100 group-hover:bg-purple-950 text-slate-500 group-hover:text-purple-200'
                            }`}
                          >
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="bg-white rounded-b-2xl border-x-2 border-b-2 border-purple-950 p-5 sm:p-7 shadow-xl space-y-5 animate-fade-in">
                            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span
                                  className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-1 ${roleBadge.badgeClass}`}
                                >
                                  {roleBadge.label}
                                </span>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                  {admin.fullName}
                                </h3>
                              </div>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Activo Institucional
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Correo Institucional
                                </span>
                                <span className="text-xs sm:text-sm font-black text-slate-800 break-all">
                                  {admin.email || 'Sin correo registrado'}
                                </span>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                  RUT Institucional
                                </span>
                                <span className="text-xs sm:text-sm font-black text-slate-800">
                                  {admin.rut || 'No registrado'}
                                </span>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Sede / Campus
                                </span>
                                <span className="text-xs sm:text-sm font-black text-slate-800">
                                  {adminSede}
                                </span>
                              </div>
                            </div>

                            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1">
                              <span className="text-xs font-black text-purple-900 block">
                                Rol y Atribuciones en la Plataforma
                              </span>
                              <p className="text-xs text-purple-800 font-medium leading-relaxed">
                                {roleBadge.description}
                              </p>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setSelectedAdminForDetail(null)}
                                {...getVoiceProps('Contraer ficha administrativa')}
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
            )}
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
          <div
            ref={statusModalRef}
            tabIndex={-1}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-0 sm:my-4 animate-fade-in focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="status-modal-title" className="text-xl font-black text-slate-900">
                Cambiar Estado Académico
              </h3>
              <button
                ref={statusCloseBtnRef}
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                aria-label="Cerrar modal de estado académico"
                {...getVoiceProps('Cerrar modal de estado académico')}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                handleSaveStatus(e).catch((err) => {
                  console.error('[AdminPanelView] Error guardando estado:', err);
                });
              }}
              className="space-y-4"
            >
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
                  {...getVoiceProps('Seleccionar nuevo estado académico')}
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
                    {...getVoiceProps('Seleccionar motivo de deserción')}
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
                    {...getVoiceProps('Motivo u observación del cambio de estado')}
                    className="w-full min-h-[44px] p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  {...getVoiceProps('Cancelar cambio de estado académico')}
                  className="min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  {...getVoiceProps('Guardar estado académico')}
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
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 sm:pt-10 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
        >
          <div
            ref={createModalRef}
            tabIndex={-1}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-xl space-y-5 my-0 sm:my-4 animate-fade-in focus:outline-none"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#002B49] bg-slate-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Registro Institucional Oficial • Duoc UC - Sede Alameda
                </span>
                <h3 id="create-modal-title" className="text-xl font-bold text-slate-900">
                  Registrar Estudiante / Usuario en Nexo360
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ambiente institucional seguro regulado por la Ley N° 21.719
                </p>
              </div>
              <button
                ref={createCloseBtnRef}
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsCareerDropdownOpen(false);
                }}
                {...getVoiceProps('Cerrar modal de registro')}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                aria-label="Cerrar modal de registro"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                handleCreateUser(e).catch((err) => {
                  console.error('[AdminPanelView] Error creando usuario:', err);
                });
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
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
                    {...getVoiceProps('Nombre completo del usuario')}
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
                    {...getVoiceProps('Correo institucional Duoc UC')}
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
                    {...getVoiceProps(`Contraseña inicial, formato Duoc${currentYear}!`)}
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
                    {...getVoiceProps('RUT del estudiante o funcionario')}
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
                  {...getVoiceProps('Seleccionar rol institucional')}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                >
                  <option value="" disabled>
                    Selecciona un rol...
                  </option>
                  <optgroup label={`Alumnado Duoc UC - ${DEFAULT_CAMPUS}`}>
                    <option value="estudiante">Estudiante</option>
                    <option value="estudiante_paedis">Estudiante PAEDIS</option>
                  </optgroup>
                  <optgroup label="Apartado Administrativo & PAEDIS">
                    <option value="coordinador_paedis">Coordinador PAEDIS</option>
                    {isAdmin ? (
                      <option value="admin">Administrador</option>
                    ) : (
                      <option value="" disabled>
                        Administrador (Restringido: Solo Administrador puede asignar este rol)
                      </option>
                    )}
                  </optgroup>
                </select>
                {!isAdmin && (
                  <span className="text-[11px] text-slate-500 font-medium block">
                    *Por política de seguridad institucional, solo un Administrador puede crear
                    usuarios con rol Administrador.
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
                    data-voice-managed={careerInputVoiceProps['data-voice-managed']}
                    onMouseEnter={careerInputVoiceProps.onMouseEnter}
                    onFocus={(e) => {
                      careerInputVoiceProps.onFocus(e);
                      setIsCareerDropdownOpen(true);
                    }}
                    placeholder="Selecciona una carrera..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 pr-10 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCareerDropdownOpen(!isCareerDropdownOpen)}
                    {...getVoiceProps('Desplegar lista de carreras')}
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
                          {...getVoiceProps(`Seleccionar carrera ${c.name}`)}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            newUserForm.career === c.name
                              ? 'bg-amber-50 text-[#002B49]'
                              : 'text-slate-800'
                          }`}
                        >
                          <span>{c.name}</span>
                          {newUserForm.career === c.name && (
                            <Check className="w-4 h-4 text-amber-600" aria-hidden="true" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 5. Sede Institucional */}
              <div className="space-y-1">
                <label htmlFor="create-campus-select" className="text-xs font-semibold text-slate-700">
                  Sede Duoc UC - {DEFAULT_CAMPUS} <span className="text-red-600">*</span>
                </label>
                <select
                  id="create-campus-select"
                  required
                  value={newUserForm.campus}
                  onChange={(e) => setNewUserForm({ ...newUserForm, campus: e.target.value })}
                  {...getVoiceProps(`Seleccionar sede institucional ${DEFAULT_CAMPUS}`)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                >
                  <option value="" disabled>
                    Selecciona una sede...
                  </option>
                  {sortedSedes.map((s) => (
                    <option key={s._id || s.id || s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Cumplimiento Ley N° 21.719 */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#002B49]">
                  <Shield className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
                  <span>Aviso de Privacidad y Cumplimiento Ley N° 21.719</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  En cumplimiento de la <strong>Ley N° 21.719 sobre Protección de Datos Personales</strong>,
                  los datos recopilados en Nexo360 tienen como finalidad exclusiva la gestión
                  académica, la asignación de ajustes de accesibilidad PAEDIS y el seguimiento de
                  retención estudiantil. Los datos no se cederán a terceros no autorizados.
                </p>
                <label className="flex items-start gap-2.5 pt-1 text-xs font-medium text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    {...getVoiceProps(
                      `Consentimiento Ley 21.719: ${consentAccepted ? 'aceptado' : 'no aceptado'}`
                    )}
                    className="mt-0.5 w-4 h-4 text-[#002B49] rounded border-slate-300 focus:ring-[#002B49] shrink-0"
                  />
                  <span>
                    Al registrar el usuario, se formaliza la aceptación expresa e informada del
                    tratamiento institucional de sus datos según la Ley N° 21.719.
                  </span>
                </label>
              </div>

              {modalError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  {...getVoiceProps(modalError)}
                  className="p-3.5 bg-red-50 border border-red-300 text-red-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in"
                >
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" aria-hidden="true" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsCareerDropdownOpen(false);
                  }}
                  {...getVoiceProps('Cancelar registro de usuario')}
                  className="min-h-[42px] px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  {...getVoiceProps('Registrar usuario en Nexo360')}
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
