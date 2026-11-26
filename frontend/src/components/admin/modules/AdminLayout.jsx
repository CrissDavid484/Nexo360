import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
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
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@services/api';
import { useAccessibility } from '@context/AccessibilityContext';
import { useAuth } from '@context/AuthContext';
import { useAccessibleModal } from '@hooks/useAccessibleModal';
import {
  SEDES_DUOC,
  SEDES_DUOC_ITEMS,
  CARRERAS_DUOC_LIST,
  DEFAULT_CAMPUS,
  matchesRutQuery,
  normalizeStudentProfile,
  getSchoolForCareer,
} from '@utils/studentUtils';
import { ExplainabilityPanel } from './ExplainabilityPanel';
import { AdminDashboard } from './AdminDashboard';
import { StudentDirectory } from './StudentDirectory';
import { SatMonitoring } from './SatMonitoring';
import { PaedisManagement } from './PaedisManagement';
import { AcademicCatalog } from './AcademicCatalog';
import { AuditLog } from './AuditLog';
import { OfertaAcademica } from './OfertaAcademica';
import { AdminTeamManagement } from '@/components/admin/modules/AdminTeamManagement';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { AcademicWeekBadge } from '@components/common/AcademicWeekBadge';
import { RegisterUserModal } from '@components/admin/RegisterUserModal';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
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

const STAFF_ROLE_BADGES = {
  coordinador_paedis: { label: 'Coordinador PAEDIS', badgeClass: 'bg-purple-100 text-purple-900 border border-purple-200', description: 'Gestión y acompañamiento de estudiantes con necesidades educativas especiales, aprobación de ajustes razonables y vinculación UAP.' },
  admin: { label: 'Administrador Nexo360', badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200', description: 'Control de plataforma, asignación de roles de seguridad RBAC, parametrización de carreras, sedes y auditorías de actividad.' },
  profesor: { label: 'Docente Duoc UC', badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200', description: 'Recepción y aplicación de fichas de ajustes razonables en aula y evaluación curricular.' },
  director: { label: 'Directivo Institucional', badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200', description: 'Supervisión de continuidad de estudios, equidad en titulación y excepciones académicas normativas.' },
  default: { label: 'Personal Administrativo', badgeClass: 'bg-slate-100 text-slate-800 border border-slate-200', description: 'Gestión operativa, soporte de beneficios institucionales y atención a la comunidad.' },
};

const getStaffRoleBadge = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'administrador') return STAFF_ROLE_BADGES.admin;
  if (r === 'subdirector') return STAFF_ROLE_BADGES.director;
  return STAFF_ROLE_BADGES[r] || STAFF_ROLE_BADGES.default;
};

const ADMIN_SUB_TABS = [
  { id: 'dashboard', label: 'Panel', icon: BookOpen, iconColor: 'text-blue-400', announceMsg: 'Panel de métricas y KPIs seleccionado.', roles: ['admin', 'coordinador_paedis'] },
  { id: 'estudiantes', label: 'Usuarios registrados', icon: Users, iconColor: 'text-amber-400', announceMsg: 'Directorio de usuarios registrados seleccionado.', roles: ['admin', 'coordinador_paedis'], showCount: true },
  { id: 'equipo', label: 'Equipo y Permisos', icon: ShieldCheck, iconColor: 'text-emerald-400', announceMsg: 'Gestión de equipo administrativo y permisos.', roles: ['admin'] },
  { id: 'sat', label: 'Alerta Temprana (SAT)', icon: AlertOctagon, iconColor: 'text-rose-400', announceMsg: 'Sistema de Alerta Temprana (SAT) seleccionado.', roles: ['admin', 'coordinador_paedis'] },
  { id: 'paedis', label: 'Gestión PAEDIS', icon: HeartHandshake, iconColor: 'text-purple-400', announceMsg: 'Gestión PAEDIS y Ajustes Razonables seleccionada.', roles: ['coordinador_paedis'] },
  { id: 'oferta', label: 'Oferta Académica', icon: FileSpreadsheet, iconColor: 'text-green-400', announceMsg: 'Oferta Académica y Catálogo seleccionada.', roles: ['admin'] },
  { id: 'catalog', label: 'Carreras & Sedes', icon: Building2, iconColor: 'text-blue-400', announceMsg: 'Gestión de Carreras y Sedes seleccionada.', roles: ['admin'] },
  { id: 'audit', label: 'Auditoría', icon: ScrollText, iconColor: 'text-sky-400', announceMsg: 'Bitácora de auditoría seleccionada.', roles: ['admin'] },
];

export const AdminLayout = ({ onExit }) => {
  const { announce, getVoiceProps } = useAccessibility();
  const { user } = useAuth();
  const { subTab } = useParams();
  const navigate = useNavigate();

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isCoordinator = userRole === 'coordinador_paedis';
  const canManageAdmin = isAdmin || isCoordinator;

  const defaultSubTab = isCoordinator ? 'paedis' : 'dashboard';
  const isValidSubTab = subTab && ADMIN_SUB_TABS.some((tab) => tab.id === subTab);
  const [adminSubTab, setAdminSubTab] = useState(() => (isValidSubTab ? subTab : defaultSubTab));

  useEffect(() => {
    if (subTab && ADMIN_SUB_TABS.some((tab) => tab.id === subTab)) {
      setAdminSubTab(subTab);
    }
  }, [subTab]);
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFeedback, setStatusFeedback] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const createCloseBtnRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsRes, studentsRes] = await Promise.allSettled([api.getAdminMetrics(), api.getAdminStudents()]);
      if (!isMountedRef.current) return;
      if (metricsRes.status === 'fulfilled' && metricsRes.value?.success) setMetrics(metricsRes.value.metrics);
      if (studentsRes.status === 'fulfilled' && studentsRes.value?.success && Array.isArray(studentsRes.value.students)) {
        setStudents(studentsRes.value.students.map((raw) => { const normalized = normalizeStudentProfile(raw); return { ...normalized, fullName: raw.fullName || raw.nombre || normalized.name }; }));
      }
    } catch (err) {
      console.error('[AdminLayout] Error cargando datos:', err);
      if (isMountedRef.current) setStatusFeedback({ type: 'error', text: 'Error al conectar con la base de datos de administración.' });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAdminData().catch((err) => { console.error('[AdminLayout] Error en carga inicial:', err); }); }, [loadAdminData]);

  const handlePaedisStudentUpdated = useCallback((updatedRaw) => { if (!updatedRaw) return; const normalized = normalizeStudentProfile(updatedRaw); const updatedStudent = { ...normalized, fullName: updatedRaw.fullName || updatedRaw.nombre || normalized.name }; const updatedKey = updatedStudent.email?.toLowerCase(); setStudents((prev) => prev.map((s) => (s.email || '').toLowerCase() === updatedKey || (s._id && updatedStudent._id && String(s._id) === String(updatedStudent._id)) ? updatedStudent : s)); }, []);

  const visibleTabs = useMemo(() => ADMIN_SUB_TABS.filter((tab) => tab.roles.includes(userRole) || (tab.roles.includes('coordinador_paedis') && isCoordinator) || (tab.roles.includes('admin') && isAdmin)), [isAdmin, isCoordinator]);

  const handleOpenCreateModal = () => { if (!canManageAdmin) { announce('Acción denegada: Requiere privilegios de Administrador o Coordinador PAEDIS.', 'assertive'); return; } setIsCreateModalOpen(true); setModalError(''); };

  const failCreateModalValidation = (errText) => { setModalError(errText); setStatusFeedback({ type: 'error', text: errText }); announce(errText, 'assertive'); };

  const handleCreateUser = async (payload) => { setModalError(''); setIsSubmitting(true); try { const res = await api.createAdminStudent(payload); if (!isMountedRef.current) return; if (res?.success) { const emailStatusNote = res.emailSent === false ? ' (aviso: no se pudo confirmar el envío del correo de bienvenida)' : ' Se envió el correo de bienvenida con su contraseña inicial y enlace de acceso.'; const previewUrl = typeof res.emailPreview === 'string' ? res.emailPreview : res.emailPreview?.resetUrl || ''; const previewToken = typeof res.emailPreview === 'object' ? res.emailPreview?.resetToken || '' : ''; setStatusFeedback({ type: 'success', text: `Usuario ${payload.fullName} registrado exitosamente.${emailStatusNote}`, previewUrl, previewToken }); announce(`Usuario ${payload.fullName} registrado exitosamente.`, 'polite'); setIsCreateModalOpen(false); setModalError(''); await loadAdminData(); } else { failCreateModalValidation(res?.message || 'Error al registrar usuario.'); } } catch (err) { console.error('[AdminLayout] Error al crear usuario:', err); if (isMountedRef.current) { failCreateModalValidation(err.message || 'Error de conexión al registrar usuario.'); } } finally { if (isMountedRef.current) setIsSubmitting(false); } };

  const handleRefresh = useCallback(() => { loadAdminData().catch((err) => { console.error('[AdminLayout] Error al refrescar datos:', err); }); }, [loadAdminData]);

  const studentUsers = useMemo(() => students.filter((s) => !isStaffOrAdministrativeRole(s.role)), [students]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full max-w-full overflow-x-clip pt-2 sm:pt-4">
      {/* Cabecera Institucional */}
      <section aria-labelledby="admin-panel-title" className="bg-[#002B49] text-white border border-[#001D33] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-300/40">
                <ShieldAlert className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                <span>{isAdmin ? 'Módulo Exclusivo Administrador • Duoc UC - Sede Alameda' : 'Módulo Coordinación PAEDIS • Duoc UC - Sede Alameda'}</span>
              </div>
              <AcademicWeekBadge className="!bg-white/10 !text-white !border-white/25 [&_svg]:!text-brand-gold [&_span]:!text-white" />
            </div>
            <h1 id="admin-panel-title" className="text-xl font-bold tracking-tight text-white">Panel de Control & Analítica Predictiva</h1>
            <p className="text-sm text-slate-100 font-normal leading-relaxed">Supervisión de métricas de retención en Duoc UC - Sede Alameda, modelo predictivo de deserción por asistencia reglamentaria (menos de 70% RI) y gestión institucional conforme a la Ley 21.719 de Protección de Datos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading} aria-label="Actualizar datos de la base de datos" {...getVoiceProps('Refrescar datos del panel de administración')} className="min-h-[42px] px-4 py-2 font-semibold text-xs !bg-white/15 hover:!bg-white/25 !text-white !border-white/30">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refrescar</span>
            </Button>
            <Button variant={canManageAdmin ? 'amber' : 'secondary'} size="sm" onClick={handleOpenCreateModal} disabled={!canManageAdmin} aria-disabled={!canManageAdmin} {...getVoiceProps('Registrar nuevo estudiante o usuario en Nexo360')} title={!canManageAdmin ? 'Acción restringida: Se requiere rol de Administrador o Coordinador PAEDIS' : 'Registrar nuevo estudiante o usuario'} className="min-h-[42px] px-5 py-2 font-bold text-xs sm:text-sm">
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Registrar Estudiante / Usuario</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Feedback Alert */}
      {statusFeedback && <div role="status" aria-live="polite" {...getVoiceProps(statusFeedback.text)} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs transition-all ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}><div className="flex items-center gap-2.5">{statusFeedback.type === 'success' ? <span className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true">✓</span> : <span className="w-5 h-5 text-rose-700 shrink-0" aria-hidden="true">⚠</span>}<span>{statusFeedback.text}</span>{statusFeedback.previewUrl && <a href={statusFeedback.previewUrl} className="underline font-black text-brand-navy hover:text-blue-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 rounded px-1">Abrir enlace de activación (dev)</a>}{statusFeedback.previewToken && <code className="px-2 py-0.5 rounded-lg bg-white border border-emerald-300 text-[11px] font-mono text-brand-navy">Token dev: {statusFeedback.previewToken}</code>}</div><button type="button" onClick={() => setStatusFeedback(null)} {...getVoiceProps('Cerrar notificación')} className="text-neutral-500 hover:text-neutral-900 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400" aria-label="Cerrar notificación"><X className="w-4 h-4" /></button></div>}

      {/* Sub-tabs Navigation */}
      <nav aria-label="Secciones del Panel de Administración" className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto w-full flex-nowrap sm:flex-wrap">
        {visibleTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = adminSubTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setAdminSubTab(tab.id);
                navigate(`/panel-admin/${tab.id}`);
                announce(tab.announceMsg, 'polite');
              }}
              {...getVoiceProps(tab.label)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${isActive ? 'bg-brand-navy text-white shadow-xs' : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'}`}
            >
              <TabIcon className={`w-4 h-4 ${tab.iconColor}`} aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.showCount && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-brand-navy">
                  {(userRole === 'coordinador_paedis' ? students.filter(s => !isStaffOrAdministrativeRole(s.role)) : students).length}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Render Sub-tab Content */}
      {adminSubTab === 'dashboard' && <AdminDashboard metrics={metrics} isLoading={isLoading} onRefresh={handleRefresh} isCoordinator={!isAdmin} isAdmin={isAdmin} getVoiceProps={getVoiceProps} announce={announce} />}
      {adminSubTab === 'estudiantes' && <StudentDirectory students={students} metrics={metrics} isLoading={isLoading} onRefresh={handleRefresh} isCoordinator={!isAdmin} isAdmin={isAdmin} getVoiceProps={getVoiceProps} announce={announce} />}
      {adminSubTab === 'equipo' && isAdmin && <AdminTeamManagement students={students} metrics={metrics} isLoading={isLoading} onRefresh={handleRefresh} isAdmin={isAdmin} getVoiceProps={getVoiceProps} announce={announce} />}
      {adminSubTab === 'sat' && <SatMonitoring announce={announce} />}
      {adminSubTab === 'paedis' && <PaedisManagement students={students} onStudentUpdated={handlePaedisStudentUpdated} announce={announce} />}
      {adminSubTab === 'oferta' && <OfertaAcademica isAdmin={isAdmin} isCoordinator={!isAdmin} getVoiceProps={getVoiceProps} announce={announce} />}
      {adminSubTab === 'catalog' && <AcademicCatalog isAdmin={isAdmin} isCoordinator={!isAdmin} getVoiceProps={getVoiceProps} announce={announce} />}
      {adminSubTab === 'audit' && isAdmin && <AuditLog isAdmin={isAdmin} getVoiceProps={getVoiceProps} announce={announce} />}

      {/* Modals */}
      <RegisterUserModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setModalError(''); }} closeBtnRef={createCloseBtnRef} sortedCareers={CARRERAS_DUOC_LIST.map((name, idx) => ({ id: `career-${idx}`, name, school: getSchoolForCareer(name) }))} sortedSedes={SEDES_DUOC_ITEMS.map((s, idx) => ({ id: `sede-${idx}`, name: s.name, region: s.region, city: s.city }))} isAdmin={isAdmin} isCoordinator={!isAdmin} defaultCampus={DEFAULT_CAMPUS} isSubmitting={isSubmitting} serverError={modalError} onSubmitUser={handleCreateUser} />
    </div>
  );
};

export default AdminLayout;