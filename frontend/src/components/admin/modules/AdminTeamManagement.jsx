import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  Search,
  ChevronRight,
  Edit,
  Trash2,
  ShieldAlert,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  Key,
  Eye,
  MoreHorizontal,
  Tag,
  Plus,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAccessibility } from '@context/AccessibilityContext';
import { useAuth } from '@context/AuthContext';
import { api } from '@services/api';
import {
  DEFAULT_CAMPUS,
  SEDES_DUOC,
  CARRERAS_DUOC_LIST,
  normalizeStudentProfile,
  matchesRutQuery,
} from '@utils/studentUtils';
import { ADMIN_THEME } from '@components/admin/adminTheme';
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

const STAFF_ROLE_META = {
  admin: {
    label: 'Administrador Nexo360',
    color: 'amber',
    permissions: ['full_access', 'manage_users', 'manage_catalogs', 'audit_logs', 'system_config', 'paedis_read', 'paedis_write'],
    badges: ['TI', 'SuperAdmin', 'Seguridad'],
  },
  administrador: {
    label: 'Administrador Nexo360',
    color: 'amber',
    permissions: ['full_access', 'manage_users', 'manage_catalogs', 'audit_logs', 'system_config', 'paedis_read', 'paedis_write'],
    badges: ['TI', 'SuperAdmin', 'Seguridad'],
  },
  coordinador_paedis: {
    label: 'Coordinador PAEDIS',
    color: 'purple',
    permissions: ['paedis_read', 'paedis_write', 'manage_students', 'sat_monitoring'],
    badges: ['PAEDIS', 'Inclusión', 'UAP'],
  },
  profesor: {
    label: 'Docente Duoc UC',
    color: 'blue',
    permissions: ['paedis_read_students', 'class_management'],
    badges: ['Docencia', 'Aula'],
  },
  director: {
    label: 'Directivo Institucional',
    color: 'emerald',
    permissions: ['institutional_overview', 'continuity_exceptions', 'titration_equity'],
    badges: ['Directivo', 'Gestión'],
  },
  subdirector: {
    label: 'Subdirectivo',
    color: 'emerald',
    permissions: ['institutional_overview', 'continuity_exceptions'],
    badges: ['Subdirección', 'Gestión'],
  },
  administrativo: {
    label: 'Personal Administrativo',
    color: 'slate',
    permissions: ['operational_support', 'benefits_management'],
    badges: ['Operaciones', 'Atención'],
  },
  default: {
    label: 'Personal Administrativo',
    color: 'slate',
    permissions: ['operational_support'],
    badges: ['Operaciones'],
  },
};

const ALL_SYSTEM_PERMISSIONS = [
  { id: 'full_access', label: 'Acceso completo', description: 'Acceso irrestricto a todas las funciones y configuraciones' },
  { id: 'manage_users', label: 'Gestionar usuarios', description: 'Creación, edición y administración de roles y perfiles' },
  { id: 'manage_catalogs', label: 'Gestionar catálogos', description: 'Administración de sedes, carreras y asignaturas' },
  { id: 'audit_logs', label: 'Ver auditoría', description: 'Acceso a registros y bitácora de seguridad' },
  { id: 'system_config', label: 'Configuración sistema', description: 'Parámetros institucionales y plataforma' },
  { id: 'paedis_read', label: 'Leer PAEDIS', description: 'Consulta de expedientes y ajustes razonables' },
  { id: 'paedis_write', label: 'Escribir PAEDIS', description: 'Aprobación, edición y emisión de fichas PAEDIS' },
  { id: 'manage_students', label: 'Gestionar estudiantes', description: 'Gestión directa de fichas y datos estudiantiles' },
  { id: 'sat_monitoring', label: 'Monitoreo SAT', description: 'Seguimiento de Alerta Temprana e intervenciones' },
  { id: 'paedis_read_students', label: 'Leer estudiantes PAEDIS', description: 'Consulta de fichas docentes y adaptaciones' },
  { id: 'class_management', label: 'Gestión de clases', description: 'Administración de asistencia y secciones en aula' },
  { id: 'institutional_overview', label: 'Vista institucional', description: 'Supervisión de métricas de sede e institucionales' },
  { id: 'continuity_exceptions', label: 'Excepciones continuidad', description: 'Aprobación de excepciones de continuidad de estudios' },
  { id: 'titration_equity', label: 'Equidad titulación', description: 'Supervisión de procesos de titulación equitativa' },
  { id: 'operational_support', label: 'Soporte operacional', description: 'Atención a la comunidad y soporte operativo' },
  { id: 'benefits_management', label: 'Gestión beneficios', description: 'Administración de beneficios institucionales y becas' },
];

const SUGGESTED_BADGE_TAGS = [
  'PAEDIS',
  'Inclusión',
  'UAP',
  'Docencia',
  'Aula',
  'Directivo',
  'Gestión',
  'Subdirección',
  'Operaciones',
  'Atención',
  'TI',
  'SuperAdmin',
  'Seguridad',
];

const ROLE_OPTIONS = [
  { value: 'estudiante', label: 'Estudiante Regular', color: 'emerald' },
  { value: 'estudiante_paedis', label: 'Estudiante PAEDIS', color: 'purple' },
  { value: 'profesor', label: 'Docente', color: 'blue' },
  { value: 'administrativo', label: 'Administrativo', color: 'slate' },
  { value: 'director', label: 'Directivo', color: 'emerald' },
  { value: 'subdirector', label: 'Subdirectivo', color: 'emerald' },
  { value: 'coordinador_paedis', label: 'Coordinador PAEDIS', color: 'purple' },
  { value: 'admin', label: 'Administrador Nexo360', color: 'amber' },
  { value: 'administrador', label: 'Administrador Nexo360', color: 'amber' },
];

function getRoleMeta(role) {
  const r = (role || '').toLowerCase();
  return STAFF_ROLE_META[r] || STAFF_ROLE_META.default;
}

function formatPermissions(permissions) {
  const labels = {
    full_access: 'Acceso completo',
    manage_users: 'Gestionar usuarios',
    manage_catalogs: 'Gestionar catálogos',
    audit_logs: 'Ver auditoría',
    system_config: 'Configuración sistema',
    paedis_read: 'Leer PAEDIS',
    paedis_write: 'Escribir PAEDIS',
    manage_students: 'Gestionar estudiantes',
    sat_monitoring: 'Monitoreo SAT',
    paedis_read_students: 'Leer estudiantes PAEDIS',
    class_management: 'Gestión de clases',
    institutional_overview: 'Vista institucional',
    continuity_exceptions: 'Excepciones continuidad',
    titration_equity: 'Equidad titulación',
    operational_support: 'Soporte operacional',
    benefits_management: 'Gestión beneficios',
  };
  return permissions.map(p => labels[p] || p).join(', ');
}

function AdminTeamManagement({
  students = [],
  metrics,
  isLoading,
  onRefresh,
  isAdmin,
  getVoiceProps,
  announce,
}) {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSede, setFilterSede] = useState('all');
  const [selectedUserKey, setSelectedUserKey] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roleModalNewRole, setRoleModalNewRole] = useState('');
  const [roleModalPermissions, setRoleModalPermissions] = useState([]);
  const [roleModalBadges, setRoleModalBadges] = useState([]);
  const [newBadgeInput, setNewBadgeInput] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleModalError, setRoleModalError] = useState('');
  const [detailStaff, setDetailStaff] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const staffUsers = useMemo(
    () => students.filter((s) => STAFF_ROLES.has((s.role || '').toLowerCase())),
    [students]
  );

  const filteredStaff = useMemo(
    () =>
      staffUsers
        .filter((s) => {
          const q = searchTerm.toLowerCase().trim();
          if (!q) return true;
          const name = (s.fullName || s.nombre || '').toLowerCase();
          const email = (s.email || '').toLowerCase();
          const sede = (s.campus || s.sede || '').toLowerCase();
          const role = (s.role || '').toLowerCase();
          const hasDigitQuery = /\d/.test(searchTerm);
          return (
            name.includes(q) ||
            email.includes(q) ||
            sede.includes(q) ||
            role.includes(q) ||
            (hasDigitQuery && matchesRutQuery(s.rut, searchTerm))
          );
        })
        .filter((s) => {
          if (filterRole === 'all') return true;
          return (s.role || '').toLowerCase() === filterRole;
        })
        .filter((s) => {
          if (filterSede === 'all') return true;
          const sede = (s.campus || s.sede || '').toUpperCase();
          return sede === filterSede;
        })
        .sort((a, b) => {
          const nameA = (a.fullName || a.nombre || a.email || '').trim();
          const nameB = (b.fullName || b.nombre || b.email || '').trim();
          const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
          return cmp !== 0 ? cmp : (a.rut || '').localeCompare(b.rut || '');
        }),
    [staffUsers, searchTerm, filterRole, filterSede]
  );

  const handleOpenRoleModal = useCallback((staffUser) => {
    setRoleModalUser(staffUser);
    const r = (staffUser.role || 'administrativo').toLowerCase();
    setRoleModalNewRole(r);
    const defaultMeta = getRoleMeta(r);
    setRoleModalPermissions(
      Array.isArray(staffUser.permissions) && staffUser.permissions.length > 0
        ? [...staffUser.permissions]
        : [...(defaultMeta.permissions || [])]
    );
    setRoleModalBadges(
      Array.isArray(staffUser.badges) && staffUser.badges.length > 0
        ? [...staffUser.badges]
        : [...(defaultMeta.badges || [])]
    );
    setNewBadgeInput('');
    setRoleModalError('');
    setIsRoleModalOpen(true);
    announce('Abriendo gestión de permisos y badges para ' + (staffUser.fullName || staffUser.nombre), 'polite');
  }, [announce]);

  const handleApplyRoleDefaults = useCallback(() => {
    const defaultMeta = getRoleMeta(roleModalNewRole);
    if (defaultMeta) {
      setRoleModalPermissions([...(defaultMeta.permissions || [])]);
      setRoleModalBadges([...(defaultMeta.badges || [])]);
    }
  }, [roleModalNewRole]);

  const handleTogglePermission = useCallback((permId) => {
    setRoleModalPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  }, []);

  const handleSelectAllPermissions = useCallback(() => {
    setRoleModalPermissions(ALL_SYSTEM_PERMISSIONS.map((p) => p.id));
  }, []);

  const handleClearPermissions = useCallback(() => {
    setRoleModalPermissions([]);
  }, []);

  const handleAddBadge = useCallback((tagToAdd) => {
    const clean = (tagToAdd || newBadgeInput).trim();
    if (!clean) return;
    setRoleModalBadges((prev) => {
      if (prev.some((b) => b.toLowerCase() === clean.toLowerCase())) return prev;
      return [...prev, clean];
    });
    setNewBadgeInput('');
  }, [newBadgeInput]);

  const handleRemoveBadge = useCallback((tagToRemove) => {
    setRoleModalBadges((prev) => prev.filter((b) => b !== tagToRemove));
  }, []);

  const handleSendPasswordReset = useCallback(async (staffUser) => {
    if (!staffUser?.email) return;
    try {
      const res = await api.forgotPassword(staffUser.email);
      if (res?.success) {
        setStatusFeedback({
          type: 'success',
          text: `Instrucciones de restablecimiento de contraseña enviadas a ${staffUser.email}.`,
        });
        announce(`Correo de restablecimiento enviado a ${staffUser.fullName || staffUser.nombre}.`, 'polite');
      } else {
        setStatusFeedback({
          type: 'error',
          text: res?.message || 'No se pudo solicitar el restablecimiento de contraseña.',
        });
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Error de conexión al enviar restablecimiento.',
      });
    }
  }, [announce]);

  const handleRoleChange = useCallback(async () => {
    const newRole = roleModalNewRole;
    if (!roleModalUser || !newRole) return;

    const actorId = String(user?._id || user?.id || '');
    const targetId = String(roleModalUser._id || roleModalUser.id || '');
    const isSelf =
      (actorId && targetId && actorId === targetId) ||
      (user?.email && roleModalUser.email && user.email.toLowerCase() === roleModalUser.email.toLowerCase());
    if (isSelf && newRole !== roleModalUser.role) {
      setRoleModalError('No puedes modificar tu propio rol mientras estás en sesión.');
      return;
    }

    // RBAC: solo admin puede crear/asignar admins
    const isTargetAdmin = newRole === 'admin' || newRole === 'administrador';
    const actorRole = userRole;
    const isActorAdmin = actorRole === 'admin' || actorRole === 'administrador';
    if (isTargetAdmin && !isActorAdmin) {
      setRoleModalError('Solo un Administrador puede asignar el rol Administrador.');
      return;
    }

    setRoleModalError('');
    setIsSubmittingRole(true);

    try {
      const identifier = roleModalUser._id || roleModalUser.id || roleModalUser.email;
      const res = await api.updateUserPermissions(identifier, {
        role: newRole,
        permissions: roleModalPermissions,
        badges: roleModalBadges,
      });
      if (res?.success) {
        const label = ROLE_OPTIONS.find((r) => r.value === newRole)?.label || newRole;
        setStatusFeedback({
          type: 'success',
          text: `Permisos, badges y rol de ${roleModalUser.fullName || roleModalUser.nombre} actualizados a "${label}".`,
        });
        announce(`Permisos y badges de ${roleModalUser.fullName || roleModalUser.nombre} actualizados`, 'polite');
        setIsRoleModalOpen(false);
        setRoleModalUser(null);
        await onRefresh?.();
      } else {
        setRoleModalError(res?.message || 'Error al actualizar permisos y rol.');
      }
    } catch (err) {
      setRoleModalError(err.message || 'Error de conexión al actualizar permisos y rol.');
    } finally {
      setIsSubmittingRole(false);
    }
  }, [roleModalUser, roleModalNewRole, roleModalPermissions, roleModalBadges, userRole, user, onRefresh, announce]);

  return (
    <>
      <section aria-labelledby="team-management-title" className="animate-fade-in-up space-y-5">
        {statusFeedback && (
          <div role="status" aria-live="polite" className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}>
            <span>{statusFeedback.text}</span>
            <button type="button" onClick={() => setStatusFeedback(null)} className="text-neutral-600 hover:text-neutral-900 font-black px-2" aria-label="Cerrar notificación">
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className={`${ADMIN_THEME.cardSurface} space-y-1`}>
          <h2 id="team-management-title" className={ADMIN_THEME.moduleTitle}>
            Equipo y Permisos ({filteredStaff.length})
          </h2>
          <p className={ADMIN_THEME.moduleSubtitle}>
            Personal administrativo, directivo y docente registrado. Cambia roles RBAC, revisa permisos asignados o envía restablecimiento de clave.
          </p>
        </div>

        {/* Structured Filter Card */}
        <div className={`${ADMIN_THEME.cardSurface} space-y-4`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-8 space-y-1.5">
              <label htmlFor="team-search-input" className={`block ${ADMIN_THEME.cardLabel}`}>
                Buscar miembro del equipo
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="team-search-input"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, email, rol o sede..."
                  aria-label="Buscar miembro del equipo"
                  {...getVoiceProps('Buscar miembro del equipo')}
                  className={`w-full pl-10 pr-4 ${ADMIN_THEME.controlInput}`}
                />
              </div>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="team-sede-select" className={`block ${ADMIN_THEME.cardLabel}`}>
                Sede
              </label>
              <select
                id="team-sede-select"
                value={filterSede}
                onChange={(e) => setFilterSede(e.target.value)}
                {...getVoiceProps('Filtrar equipo por sede')}
                className={`w-full cursor-pointer ${ADMIN_THEME.controlInput}`}
                aria-label="Filtrar equipo por sede"
              >
                <option value="all">Todas las sedes</option>
                {SEDES_DUOC.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center gap-2.5" role="group" aria-label="Filtrar equipo por rol">
            <span className={`${ADMIN_THEME.cardLabel} shrink-0`}>Rol:</span>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'admin', 'coordinador_paedis', 'profesor', 'administrativo', 'director', 'subdirector'].map((f) => {
                const label = f === 'all' ? 'Todos' : (ROLE_OPTIONS.find((r) => r.value === f)?.label || f);
                return (
                  <Button
                    key={f}
                    variant={filterRole === f ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilterRole(f)}
                    {...getVoiceProps('Filtrar equipo por rol: ' + label)}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-semibold"
                    aria-pressed={filterRole === f}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-neutral-400 font-bold space-y-2">
            <span className="animate-spin inline-block w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full" aria-hidden="true" />
            <span>Cargando equipo...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <Card variant="filled" padding="lg" className="text-center">
            No se encontró personal con los criterios seleccionados.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStaff.map((staff) => {
              const key = staff._id || staff.id || staff.email;
              const isSelected = selectedUserKey === key;
              const roleMeta = getRoleMeta(staff.role);
              const staffSede = staff.campus || staff.sede || DEFAULT_CAMPUS;
              const activeBadges =
                Array.isArray(staff.badges) && staff.badges.length > 0
                  ? staff.badges
                  : (roleMeta.badges || []);
              const activePermissions =
                Array.isArray(staff.permissions) && staff.permissions.length > 0
                  ? staff.permissions
                  : (roleMeta.permissions || []);

              return (
                <Card
                  key={key}
                  variant="interactive"
                  padding="md"
                  onClick={() => setSelectedUserKey(key)}
                  className={`flex flex-col space-y-3 border cursor-pointer ${isSelected ? 'ring-2 ring-brand-navy border-brand-navy' : 'border-neutral-200'}`}
                  {...getVoiceProps(`Ver ficha de ${staff.fullName || staff.nombre}, ${roleMeta.label}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black block truncate text-neutral-900">
                          {staff.fullName || staff.nombre}
                        </span>
                        <Badge variant={roleMeta.color === 'amber' ? 'warning' : roleMeta.color === 'purple' ? 'warning' : 'success'} size="sm">
                          {roleMeta.label}
                        </Badge>
                      </div>
                      <span className="text-xs font-semibold block truncate text-neutral-500">
                        {staffSede} • {staff.email}
                      </span>
                      {/* Active Badges Tags on Card */}
                      <div className="flex flex-wrap gap-1 mt-1.5" aria-label="Tarjetas asignadas">
                        {activeBadges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`w-3.5 h-3.5 rounded-full transition-all ${roleMeta.color === 'amber' ? 'bg-amber-500' : roleMeta.color === 'purple' ? 'bg-purple-500' : roleMeta.color === 'blue' ? 'bg-blue-500' : roleMeta.color === 'emerald' ? 'bg-emerald-500' : roleMeta.color === 'slate' ? 'bg-slate-500' : 'bg-neutral-500'}`} aria-hidden="true" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                    <div className="text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Rol</span>
                      <span className="text-xs font-black truncate block text-neutral-900">{roleMeta.label}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Sede</span>
                      <span className="text-xs font-black truncate block text-neutral-900">{staffSede}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Permisos</span>
                      <span className="text-xs font-medium truncate block text-neutral-700">{activePermissions.length} permisos</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Estado</span>
                      <span className="text-xs font-black block text-neutral-900">Activo</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleOpenRoleModal(staff); }}
                      {...getVoiceProps('Gestionar permisos y badges de ' + (staff.fullName || staff.nombre))}
                      className="text-xs flex-1 gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
                      <span>Permisos & Badges</span>
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleSendPasswordReset(staff); }}
                        {...getVoiceProps('Enviar reset de contraseña a ' + (staff.fullName || staff.nombre))}
                        className="text-xs"
                        title="Enviar reset de contraseña"
                      >
                        <Key className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setDetailStaff(staff); }}
                        {...getVoiceProps('Ver detalles de ' + (staff.fullName || staff.nombre))}
                        className="text-xs"
                        title="Ver detalles y permisos"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Staff Permissions Detail Modal */}
      {detailStaff && (
        <Modal
          isOpen={Boolean(detailStaff)}
          onClose={() => setDetailStaff(null)}
          title={`Permisos de ${detailStaff.fullName || detailStaff.nombre}`}
          size="md"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-1.5">
              <p><strong>Nombre:</strong> {detailStaff.fullName || detailStaff.nombre}</p>
              <p><strong>Correo:</strong> {detailStaff.email}</p>
              <p><strong>RUT:</strong> {detailStaff.rut || '—'}</p>
              <p><strong>Sede:</strong> {detailStaff.campus || detailStaff.sede || DEFAULT_CAMPUS}</p>
              <p><strong>Rol asignado:</strong> {getRoleMeta(detailStaff.role).label}</p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-neutral-800 block flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
                <span>Tarjetas y Badges de Rol:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                {((Array.isArray(detailStaff.badges) && detailStaff.badges.length > 0)
                  ? detailStaff.badges
                  : (getRoleMeta(detailStaff.role).badges || [])
                ).map((b) => (
                  <Badge key={b} variant="info" size="sm">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-neutral-800 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Permisos habilitados:</span>
              </span>
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {(Array.isArray(detailStaff.permissions) && detailStaff.permissions.length > 0
                    ? detailStaff.permissions
                    : (getRoleMeta(detailStaff.role).permissions || [])
                  ).map((p) => {
                    const match = ALL_SYSTEM_PERMISSIONS.find((perm) => perm.id === p);
                    return (
                      <div key={p} className="flex items-center gap-1.5 text-xs text-neutral-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span>{match?.label || p}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button variant="secondary" size="sm" onClick={() => setDetailStaff(null)}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const target = detailStaff;
                  setDetailStaff(null);
                  handleOpenRoleModal(target);
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Editar Permisos y Badges</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Role, Permissions & Badges Edit Modal */}
      {isRoleModalOpen && roleModalUser && (
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => { setIsRoleModalOpen(false); setRoleModalUser(null); setRoleModalError(''); }}
          title={`Permisos y Badges: ${roleModalUser.fullName || roleModalUser.nombre}`}
          size="lg"
          voiceLabel={`Gestionar permisos y badges de ${roleModalUser.fullName || roleModalUser.nombre}`}
        >
          <div className="space-y-4 animate-fade-in max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600">
              <div>
                <strong>Miembro:</strong> <span className="text-neutral-900 font-bold block truncate">{roleModalUser.fullName || roleModalUser.nombre}</span>
              </div>
              <div>
                <strong>Correo:</strong> <span className="text-neutral-900 block truncate">{roleModalUser.email}</span>
              </div>
              <div>
                <strong>Sede:</strong> <span className="text-neutral-900 block truncate">{roleModalUser.campus || roleModalUser.sede || DEFAULT_CAMPUS}</span>
              </div>
            </div>

            {roleModalError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{roleModalError}</span>
              </div>
            )}

            {/* Role Select */}
            <div className="space-y-1.5 p-3.5 bg-white border border-neutral-200 rounded-xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="role-select" className="text-xs font-bold text-neutral-800">
                  Rol Institucional Asignado <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleApplyRoleDefaults}
                  {...getVoiceProps('Cargar permisos y badges por defecto de este rol')}
                  className="text-[11px] font-semibold text-brand-navy hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Cargar valores por defecto del rol</span>
                </button>
              </div>
              <select
                id="role-select"
                value={roleModalNewRole}
                onChange={(e) => setRoleModalNewRole(e.target.value)}
                {...getVoiceProps('Seleccionar nuevo rol')}
                className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-200 focus:border-brand-navy rounded-xl text-neutral-900 font-medium transition-all shadow-2xs"
                required
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Badges and Tags Editor */}
            <div className="space-y-2.5 p-3.5 bg-white border border-neutral-200 rounded-xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label htmlFor="team-badge-input" className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
                  <span>Tarjetas y Badges de Rol ({roleModalBadges.length})</span>
                </label>
                <span className="text-[11px] text-neutral-500 font-medium">
                  Etiquetas visibles en la ficha del miembro
                </span>
              </div>

              {/* Active badges list */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-neutral-50 border border-neutral-200 rounded-xl" aria-label="Tarjetas de rol asignadas">
                {roleModalBadges.length === 0 ? (
                  <span className="text-xs text-neutral-400 italic">Sin tarjetas asignadas. Agrega una abajo o pulsa una sugerencia.</span>
                ) : (
                  roleModalBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200"
                    >
                      <span>{badge}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBadge(badge)}
                        {...getVoiceProps(`Eliminar tarjeta ${badge}`)}
                        className="p-0.5 hover:bg-blue-200 text-blue-700 rounded-md cursor-pointer transition-colors"
                        aria-label={`Eliminar tarjeta ${badge}`}
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Badge input + Add button */}
              <div className="flex gap-2">
                <input
                  id="team-badge-input"
                  type="text"
                  value={newBadgeInput}
                  onChange={(e) => setNewBadgeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBadge();
                    }
                  }}
                  placeholder="Escribir tarjeta o badge..."
                  {...getVoiceProps('Escribir nueva tarjeta o badge para el miembro')}
                  className="flex-1 min-h-[40px] px-3 py-2 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-200 focus:border-brand-navy rounded-xl text-neutral-900 text-xs font-medium transition-all"
                />
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => handleAddBadge()}
                  {...getVoiceProps('Agregar tarjeta')}
                  className="shrink-0 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Agregar</span>
                </Button>
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] font-semibold text-neutral-500">Sugerencias:</span>
                {SUGGESTED_BADGE_TAGS.map((tag) => {
                  const isAssigned = roleModalBadges.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => (isAssigned ? handleRemoveBadge(tag) : handleAddBadge(tag))}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
                        isAssigned
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                      aria-pressed={isAssigned}
                    >
                      {tag} {isAssigned ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissions Editor */}
            <div className="space-y-2.5 p-3.5 bg-white border border-neutral-200 rounded-xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span className="text-xs font-bold text-neutral-800">
                    Permisos de Seguridad ({roleModalPermissions.length} de {ALL_SYSTEM_PERMISSIONS.length})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleApplyRoleDefaults}
                    {...getVoiceProps('Restablecer permisos por defecto del rol')}
                    className="text-[11px] font-semibold text-brand-navy hover:underline flex items-center gap-1 px-2 py-1 rounded cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Por defecto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-[11px] font-semibold text-blue-700 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPermissions}
                    className="text-[11px] font-semibold text-red-600 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              {/* Grid of permissions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-neutral-200 rounded-xl bg-neutral-50" role="group" aria-label="Permisos del miembro">
                {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                  const isChecked = roleModalPermissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      aria-label={`${perm.label}: ${perm.description}`}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-300 text-neutral-900 shadow-2xs'
                          : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.id)}
                        aria-label={perm.label}
                        className="mt-0.5 w-4 h-4 rounded text-brand-navy focus:ring-brand-navy border-neutral-300"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block truncate">{perm.label}</span>
                        <span className="text-[10px] text-neutral-500 leading-tight block truncate">
                          {perm.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-neutral-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setIsRoleModalOpen(false); setRoleModalUser(null); setRoleModalError(''); }}
                {...getVoiceProps('Cancelar edición de permisos')}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRoleChange}
                disabled={isSubmittingRole}
                aria-busy={isSubmittingRole}
                {...getVoiceProps('Guardar permisos y badges')}
              >
                {isSubmittingRole ? (
                  <>
                    <span className="animate-spin mr-1">⏳</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export { AdminTeamManagement };
export default AdminTeamManagement;