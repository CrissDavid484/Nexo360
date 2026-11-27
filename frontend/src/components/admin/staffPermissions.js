/**
 * Constantes y metadatos de roles, permisos y badges del personal administrativo y docente de Nexo360.
 * Extraído para deduplicación entre RegisterUserModal y AdminTeamManagement.
 */

export const STAFF_ROLES = new Set([
  'coordinador_paedis',
  'admin',
  'administrador',
  'administrativo',
  'profesor',
  'director',
  'subdirector',
]);

export const STAFF_ROLE_META = {
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
    label: 'Subdirectivo Institucional',
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

export const ALL_SYSTEM_PERMISSIONS = [
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

export const SUGGESTED_BADGE_TAGS = [
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
