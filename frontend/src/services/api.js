/**
 * SERVICIO DE COMUNICACIÓN CON LA API DE NEXO360 (CONECTADO A BACKEND & MONGODB EN DOCKER)
 * Incluye control de timeout (AbortController), manejo seguro de JSON y validación HTTP.
 */

const API_BASE = '/api';
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
    const data = contentType.includes('application/json')
      ? await response.json()
      : { success: false, message: await response.text() };

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

export const OFFICIAL_VIVO_DUOC_OAUTH_URL =
  'https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize?client_id=674913e2-e170-4787-833f-e307f87db6e5&nonce=23077c7bfb49e35770b10965bcbb9df5&redirect_uri=https%3A%2F%2Fexperienciavivo.duoc.cl%2Fauth%2Fopenidc%2Fcallback&response_type=code&scope=openid+profile+email+offline_access+api%3A%2F%2F674913e2-e170-4787-833f-e307f87db6e5%2Faccess&state=181261858bac94807f59900cdd53d715&sso_reload=true';

export const api = {
  /**
   * Enlace oficial de autenticación OAuth Vivo Duoc (Microsoft Entra ID)
   */
  getOfficialOAuthUrl(email = '') {
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return OFFICIAL_VIVO_DUOC_OAUTH_URL;
    return `${OFFICIAL_VIVO_DUOC_OAUTH_URL}&login_hint=${encodeURIComponent(clean)}`;
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
   * Obtener los 10 usuarios institucionales de la Base de Datos Nexo360 y URL oficial Microsoft SSO
   */
  async getInstitutionalUsers() {
    return request('/auth/users', { auth: false });
  },

  /**
   * Iniciar sesión en Nexo360 tras pasar por el Login Oficial de Microsoft Duoc UC
   */
  async ssoLogin(email) {
    return request('/auth/sso-login', {
      method: 'POST',
      auth: false,
      body: { email },
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
   * Directorio de estudiantes con analítica predictiva de deserción
   */
  async getAdminStudents(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/students${qs ? `?${qs}` : ''}`);
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
   * Obtener datos del estudiante actual autenticado desde MongoDB
   */
  async getMe() {
    return request('/auth/me');
  },

  /**
   * Guardar preferencias de accesibilidad en MongoDB
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
  async importAdminCourses(rows, replace = true, rawMarkdown = null) {
    return request('/admin/courses/import', {
      method: 'POST',
      body: { rows, replace, rawMarkdown },
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
};
