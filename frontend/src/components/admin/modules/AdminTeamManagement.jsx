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
  admin: { label: 'Administrador Nexo360', color: 'amber', permissions: ['full_access', 'manage_users', 'manage_catalogs', 'audit_logs', 'system_config', 'paedis_read', 'paedis_write'] },
  administrador: { label: 'Administrador Nexo360', color: 'amber', permissions: ['full_access', 'manage_users', 'manage_catalogs', 'audit_logs', 'system_config', 'paedis_read', 'paedis_write'] },
  coordinador_paedis: { label: 'Coordinador PAEDIS', color: 'purple', permissions: ['paedis_read', 'paedis_write', 'manage_students', 'sat_monitoring'] },
  profesor: { label: 'Docente Duoc UC', color: 'blue', permissions: ['paedis_read_students', 'class_management'] },
  director: { label: 'Directivo Institucional', color: 'emerald', permissions: ['institutional_overview', 'continuity_exceptions', 'titration_equity'] },
  subdirector: { label: 'Subdirectivo', color: 'emerald', permissions: ['institutional_overview', 'continuity_exceptions'] },
  administrativo: { label: 'Personal Administrativo', color: 'slate', permissions: ['operational_support', 'benefits_management'] },
  default: { label: 'Personal Administrativo', color: 'slate', permissions: ['operational_support'] },
};

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
    setRoleModalNewRole(staffUser.role || 'administrativo');
    setRoleModalError('');
    setIsRoleModalOpen(true);
    announce('Abriendo gestión de rol para ' + (staffUser.fullName || staffUser.nombre), 'polite');
  }, [announce]);

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
      const res = await api.updateUserRole(identifier, newRole);
      if (res?.success) {
        const label = ROLE_OPTIONS.find((r) => r.value === newRole)?.label || newRole;
        setStatusFeedback({
          type: 'success',
          text: `Rol de ${roleModalUser.fullName || roleModalUser.nombre} actualizado a "${label}".`,
        });
        announce(`Rol de ${roleModalUser.fullName || roleModalUser.nombre} actualizado a ${label}`, 'polite');
        setIsRoleModalOpen(false);
        setRoleModalUser(null);
        await onRefresh?.();
      } else {
        setRoleModalError(res?.message || 'Error al actualizar rol.');
      }
    } catch (err) {
      setRoleModalError(err.message || 'Error de conexión al actualizar rol.');
    } finally {
      setIsSubmittingRole(false);
    }
  }, [roleModalUser, roleModalNewRole, userRole, user, onRefresh, announce]);

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
                      <span className="text-xs font-medium truncate block text-neutral-700">{roleMeta.permissions.length} permisos</span>
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
                      {...getVoiceProps('Cambiar rol de ' + (staff.fullName || staff.nombre))}
                      className="text-xs flex-1"
                    >
                      <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cambiar Rol</span>
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
              <span className="font-bold text-neutral-800 block">Permisos habilitados:</span>
              <p className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-neutral-800 leading-relaxed">
                {formatPermissions(getRoleMeta(detailStaff.role).permissions)}
              </p>
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
                Cambiar Rol
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Role Change Modal */}
      {isRoleModalOpen && roleModalUser && (
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => { setIsRoleModalOpen(false); setRoleModalUser(null); setRoleModalError(''); }}
          title={`Cambiar Rol: ${roleModalUser.fullName || roleModalUser.nombre}`}
          size="md"
          voiceLabel={`Cambiar rol de ${roleModalUser.fullName || roleModalUser.nombre}`}
        >
          <div className="space-y-5 animate-fade-in">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-600">
                <strong>Rol actual:</strong> {getRoleMeta(roleModalUser.role).label}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                <strong>Email:</strong> {roleModalUser.email}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                <strong>Sede:</strong> {roleModalUser.campus || roleModalUser.sede || DEFAULT_CAMPUS}
              </p>
            </div>

            {roleModalError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{roleModalError}</span>
              </div>
            )}

            <div>
              <label htmlFor="role-select" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nuevo Rol
              </label>
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

            <div className="pt-4 flex justify-end gap-2.5 border-t border-neutral-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setIsRoleModalOpen(false); setRoleModalUser(null); setRoleModalError(''); }}
                {...getVoiceProps('Cancelar cambio de rol')}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRoleChange}
                disabled={isSubmittingRole}
                aria-busy={isSubmittingRole}
                {...getVoiceProps('Guardar nuevo rol')}
              >
                {isSubmittingRole ? (
                  <>
                    <span className="animate-spin mr-1">⏳</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambio</span>
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