/**
 * SERVICIO DE COMUNICACIÓN CON LA API DE NEXO360 (CONECTADO A BACKEND & MONGODB EN DOCKER)
 * Incluye control de timeout (AbortController), manejo seguro de JSON y validación HTTP.
 */

function stripTrailingSlash(url) {
  let val = String(url || '').trim();
  while (val.endsWith('/')) {
    val = val.slice(0, -1);
  }
  return val;
}

const rawApiUrl = stripTrailingSlash(import.meta.env?.VITE_API_URL || '');
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';
const DEFAULT_TIMEOUT_MS = 12000;

const getAuthHeaders = (includeAuth = true) => {
  const token = includeAuth ? localStorage.getItem('nexo360_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (path, { method = 'GET', body, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: getAuthHeaders(auth),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textBody = await response.text();
      data = response.ok
        ? { success: true, text: textBody, markdown: textBody }
        : { success: false, message: textBody };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        ...data,
        message: data.message || data.errorMessage || `Error HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con el servidor Nexo360.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const OFFICIAL_VIVO_DUOC_OAUTH_URL = stripTrailingSlash(
  import.meta.env?.VITE_VIVO_DUOC_OAUTH_URL || ''
);

export const api = {
  /**
   * Delegado al endpoint seguro /auth/oidc/authorize (PKCE + state generado en servidor).
   * Solo usa VITE_VIVO_DUOC_OAUTH_URL si se configura explícitamente en entorno.
   */
  getOfficialOAuthUrl(email = '') {
    if (!OFFICIAL_VIVO_DUOC_OAUTH_URL) return '';
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return OFFICIAL_VIVO_DUOC_OAUTH_URL;
    const separator = OFFICIAL_VIVO_DUOC_OAUTH_URL.includes('?') ? '&' : '?';
    return `${OFFICIAL_VIVO_DUOC_OAUTH_URL}${separator}login_hint=${encodeURIComponent(clean)}`;
  },

  /**
   * Verificar estado de salud del Backend y conexión a MongoDB
   */
  async getHealth() {
    return request('/health', { auth: false });
  },

  /**
   * Consultar información de cumplimiento con Ley N° 21.719
   */
  async getLey21719Info() {
    return request('/auth/ley21719', { auth: false });
  },

  /**
   * Consultar estado de configuración OIDC (Microsoft Entra ID) y modo demo
   */
  async getOidcStatus() {
    return request('/auth/oidc/status', { auth: false });
  },

  /**
   * Solicitar URL de autorización OIDC con PKCE al backend
   */
  async getOidcAuthorizeUrl() {
    return request('/auth/oidc/authorize', { auth: false });
  },

  /**
   * Completar callback OIDC validando code y state en el backend
   */
  async completeOidcCallback(code, state) {
    return request('/auth/oidc/callback', {
      method: 'POST',
      auth: false,
      body: { code, state },
    });
  },

  /**
   * Obtener cuentas de demostración mínimas (solo disponible en desarrollo cuando está habilitado)
   */
  async getDemoAccounts() {
    return request('/auth/demo-accounts', { auth: false });
  },

  /**
   * Obtener los usuarios institucionales de la Base de Datos Nexo360 (requiere sesión autorizada)
   */
  async getInstitutionalUsers() {
    return request('/auth/users');
  },

  /**
   * Iniciar sesión en Nexo360 mediante token OIDC ({idToken, code, state}) o selección demo en desarrollo
   */
  async ssoLogin(payloadOrEmail) {
    const body =
      typeof payloadOrEmail === 'string'
        ? { email: payloadOrEmail }
        : (payloadOrEmail || {});
    return request('/auth/sso-login', {
      method: 'POST',
      auth: false,
      body,
    });
  },

  /**
   * Iniciar autenticación institucional con correo y contraseña contra la Base de Datos
   */
  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
  },

  /**
   * Registrar uso del simulador en la base de datos
   */
  async logSimulatorUsage() {
    return request('/auth/simulator-log', {
      method: 'POST',
    });
  },

  /**
   * Métricas y KPIs del Panel de Administración
   */
  async getAdminMetrics() {
    return request('/admin/metrics');
  },

  /**
   * Bitácora de auditoría (solo administradores). Omite filtros vacíos.
   */
  async getAdminActivityLogs(params = {}) {
    const clean = Object.entries(params).filter(([, v]) => v !== '' && v != null);
    const qs = new URLSearchParams(clean).toString();
    return request(`/admin/activity-logs${qs ? `?${qs}` : ''}`);
  },

  /**
   * Exportar bitácora de auditoría (solo administradores)
   */
  async exportActivityLogs(params = {}) {
    const clean = Object.entries(params).filter(([, v]) => v !== '' && v != null);
    const qs = new URLSearchParams(clean).toString();
    return request(`/admin/activity-logs/export${qs ? `?${qs}` : ''}`);
  },

  /**
   * Directorio de estudiantes con analítica predictiva de deserción
   */
  async getAdminStudents(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/students${qs ? `?${qs}` : ''}`);
  },

  /**
   * Registrar intervención interna de seguimiento para un estudiante
   */
  async createStudentIntervention(studentId, payload) {
    return request(`/admin/students/${encodeURIComponent(studentId)}/interventions`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Obtener intervenciones persistidas de un estudiante
   */
  async getStudentInterventions(studentId) {
    return request(`/admin/students/${encodeURIComponent(studentId)}/interventions`);
  },

  /**
   * Registrar nuevo usuario desde el Panel de Administración
   */
  async createAdminStudent(studentData) {
    return request('/admin/students', {
      method: 'POST',
      body: studentData,
    });
  },

  /**
   * Actualizar estado académico del estudiante (activo, desercion, titulado)
   */
  async updateStudentStatus(id, academicStatus, statusReason) {
    return request(`/admin/students/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: { academicStatus, statusReason },
    });
  },

  /**
   * Eliminar usuario desde el Panel de Administración
   */
  async deleteStudent(id) {
    return request(`/admin/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Actualizar rol institucional de un usuario (solo Administrador)
   */
  async updateUserRole(id, role) {
    return request(`/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: { role },
    });
  },

  /**
   * Actualizar permisos y badges de un miembro del equipo (solo Administrador)
   */
  async updateUserPermissions(id, { permissions, badges, role } = {}) {
    return request(`/admin/users/${encodeURIComponent(id)}/permissions`, {
      method: 'PATCH',
      body: { permissions, badges, role },
    });
  },

  /**
   * Obtener lista de Carreras Duoc UC
   */
  async getAdminCareers() {
    return request('/admin/careers');
  },

  /**
   * Crear nueva Carrera Duoc UC
   */
  async createAdminCareer(careerData) {
    return request('/admin/careers', {
      method: 'POST',
      body: careerData,
    });
  },

  /**
   * Actualizar Carrera Duoc UC existente
   */
  async updateAdminCareer(id, payload) {
    return request(`/admin/careers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Eliminar Carrera Duoc UC
   */
  async deleteAdminCareer(id) {
    return request(`/admin/careers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtener lista de Sedes Duoc UC
   */
  async getAdminSedes() {
    return request('/admin/sedes');
  },

  /**
   * Crear nueva Sede Duoc UC
   */
  async createAdminSede(sedeData) {
    return request('/admin/sedes', {
      method: 'POST',
      body: sedeData,
    });
  },

  /**
   * Actualizar Sede Duoc UC existente
   */
  async updateAdminSede(id, payload) {
    return request(`/admin/sedes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Eliminar Sede Duoc UC
   */
  async deleteAdminSede(id) {
    return request(`/admin/sedes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Consulta de estado del MFA para Polling cada 2s
   */
  async checkMfaStatus(sessionId) {
    return request(`/auth/mfa-status/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      auth: false,
    });
  },

  /**
   * Solicitar recuperación de contraseña con correo institucional
   */
  async forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      auth: false,
      body: { email },
    });
  },

  /**
   * Restablecer contraseña usando el código/token de recuperación
   */
  async resetPassword({ email, token, newPassword }) {
    return request('/auth/reset-password', {
      method: 'POST',
      auth: false,
      body: { email, token, newPassword },
    });
  },

  /**
   * Verificar validez del token de activación de cuenta institucional
   */
  async verifyActivationToken(token) {
    return request(`/auth/verify-activation-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      auth: false,
    });
  },

  /**
   * Activar cuenta institucional y definir contraseña personal
   */
  async activateAccount({ token, password, consentimiento }) {
    return request('/auth/activate-account', {
      method: 'POST',
      auth: false,
      body: { token, password, consentimiento },
    });
  },

  /**
   * Cambiar la contraseña del usuario autenticado
   */
  async changePassword({ currentPassword, newPassword }) {
    return request('/auth/change-password', {
      method: 'PUT',
      auth: true,
      body: { currentPassword, newPassword },
    });
  },

  /**
   * Obtener datos del estudiante actual autenticado desde MongoDB
   */
  async getMe() {
    return request('/auth/me');
  },

  /**
   * Guardar preferencias de accesibilidad (incluyendo daltonismo y lectura clara) en MongoDB
   */
  async saveAccessibilityPreferences(preferences) {
    return request('/auth/accessibility', {
      method: 'PUT',
      body: { preferences },
    });
  },

  /**
   * Actualizar datos de contacto del perfil en MongoDB
   */
  async updateProfile(profileData) {
    return request('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  },

  /**
   * Actualizar fotografía de perfil en MongoDB (Base64 o URL)
   */
  async updatePhoto(photo) {
    return request('/auth/profile/photo', {
      method: 'PUT',
      body: { photo },
    });
  },

  /**
   * Obtener carga académica inscrita en el Simulador de Toma de Ramos desde MongoDB
   */
  async getTomaRamos() {
    return request('/auth/toma-ramos');
  },

  /**
   * Guardar carga académica inscrita en el Simulador de Toma de Ramos en MongoDB
   */
  async saveTomaRamos(enrolledCourses) {
    return request('/auth/toma-ramos', {
      method: 'POST',
      body: { enrolledCourses },
    });
  },

  /**
   * Obtener todos los módulos institucionales y sus submenús desde MongoDB
   */
  async getModules(query = '') {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    return request(`/modules${qs}`);
  },

  /**
   * Obtener categoría específica y sus FAQs desde MongoDB
   */
  async getModuleByKey(key) {
    return request(`/modules/${encodeURIComponent(key)}`);
  },

  /**
   * Catálogo de Asignaturas para el Simulador Toma de Ramos (con aleatorización y filtro por carrera)
   */
  async getCourses(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/courses${qs ? `?${qs}` : ''}`);
  },

  /**
   * Obtener catálogo de asignaturas renderizado directamente en formato Markdown (.md)
   */
  async getCoursesMarkdown(params = {}) {
    const qs = new URLSearchParams({ ...params, format: 'md' }).toString();
    return request(`/courses?${qs}`);
  },

  /**
   * Carreras disponibles en la oferta académica
   */
  async getCourseCareers() {
    return request('/courses/careers');
  },

  /**
   * Resumen administrativo de oferta académica (Toma de Ramos)
   */
  async getAdminCoursesSummary() {
    return request('/admin/courses/summary');
  },

  /**
   * Importación masiva de asignaturas desde Excel/CSV o Markdown procesado en el Panel Admin
   * Soporta sobreescritura limpia del catálogo con replace: true por defecto
   */
  async importAdminCourses(
    rows = null,
    replace = true,
    rawMarkdown = null,
    { dryRun = false, xml = null, fileBase64 = null, filename = null } = {}
  ) {
    const body = { replace };
    if (Array.isArray(rows) && rows.length > 0) body.rows = rows;
    if (rawMarkdown) body.markdown = rawMarkdown;
    if (xml) body.xml = xml;
    if (fileBase64) body.fileBase64 = fileBase64;
    if (filename) body.filename = filename;

    return request(`/admin/courses/import${dryRun ? '?dryRun=true' : ''}`, {
      method: 'POST',
      body,
    });
  },

  /**
   * Restaurar catálogo oficial semilla 2026-002
   */
  async seedAdminCourses() {
    return request('/admin/courses/seed', {
      method: 'POST',
    });
  },

  /**
   * Limpiar todas las asignaturas cargadas
   */
  async clearAdminCourses() {
    return request('/admin/courses', {
      method: 'DELETE',
    });
  },

  /**
   * Obtener alertas del Sistema de Alerta Temprana (SAT) y métricas globales
   */
  async getSatAlerts() {
    return request('/admin/sat-alerts');
  },

  /**
   * Simular corte semanal SAP sobre una asignatura de un estudiante
   */
  async simulateSatCourse(userId, payload) {
    return request(`/admin/sat-alerts/${encodeURIComponent(userId)}/simulate`, {
      method: 'PATCH',
      body: payload,
    });
  },

  /**
   * Actualizar o registrar intervención en Ficha 360 de un estudiante
   */
  async saveSatIntervention(userId, payload) {
    return request(`/admin/sat-alerts/${encodeURIComponent(userId)}/intervention`, {
      method: 'PATCH',
      body: payload,
    });
  },

  /**
   * Consultar expediente confidencial PAEDIS segregado por estudiante
   */
  async getPaedisRecord(studentId) {
    return request(`/admin/paedis/${encodeURIComponent(studentId)}/record`);
  },

  /**
   * Actualizar expediente PAEDIS, ajustes razonables, tutores pares y Ficha Docente Confidencial
   */
  async updatePaedisCase(userId, payload) {
    return request(`/admin/paedis/${encodeURIComponent(userId)}/case`, {
      method: 'PATCH',
      body: payload,
    });
  },

  /**
   * Consultar semana y semestre académico Duoc UC vigente
   */
  async getCurrentAcademicCalendar(date) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return request(`/calendar/current${qs}`);
  },

  /**
   * Consultar calendarios académicos almacenados en MongoDB (Admin / Coordinador)
   */
  async getAdminAcademicCalendars() {
    return request('/admin/academic-calendar');
  },

  /**
   * Previsualizar (?dryRun=true) o guardar Calendario Académico desde PDF (Solo Administrador)
   */
  async importAdminAcademicCalendar(payload, { dryRun = false } = {}) {
    return request(`/admin/academic-calendar/import${dryRun ? '?dryRun=true' : ''}`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Consultar snapshots programados del Simulador Toma de Ramos (03:00 y 15:00)
   */
  async getAdminSimulatorSnapshots(limit = 20) {
    return request(`/admin/simulator-snapshots?limit=${encodeURIComponent(limit)}`);
  },

  /**
   * Obtener dashboard completo de Vivo Duoc UC (proxy backend servidor-a-servidor)
   * Endpoint: GET /api/vivo-duoc/dashboard
   * Protegido por JWT Nexo360, deriva identidad desde usuario autenticado (prevención IDOR)
   */
  async getVivoDuocDashboard() {
    return request('/vivo-duoc/dashboard');
  },
};
