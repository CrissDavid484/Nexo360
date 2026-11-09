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

export const api = {
  /**
   * Verificar estado de salud del Backend y conexión a MongoDB
   */
  async getHealth() {
    return request('/health', { auth: false });
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
   * Iniciar autenticación institucional con Puppeteer / MFA
   */
  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
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
};
