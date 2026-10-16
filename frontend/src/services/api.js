/**
 * SERVICIO DE COMUNICACIÓN CON LA API DE NEXO360
 */

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('nexo360_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  /**
   * Iniciar autenticación institucional con Puppeteer
   */
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  /**
   * Consulta de estado del MFA para Polling cada 2s
   */
  async checkMfaStatus(sessionId) {
    const response = await fetch(`${API_BASE}/auth/mfa-status/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  /**
   * Obtener datos del estudiante actual autenticado
   */
  async getMe() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Guardar preferencias de accesibilidad en MongoDB
   */
  async saveAccessibilityPreferences(preferences) {
    const response = await fetch(`${API_BASE}/auth/accessibility`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ preferences }),
    });
    return response.json();
  },

  /**
   * Obtener todos los módulos institucionales y sus submenús
   */
  async getModules() {
    const response = await fetch(`${API_BASE}/modules`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  /**
   * Obtener categoría específica y sus FAQs
   */
  async getModuleByKey(key) {
    const response = await fetch(`${API_BASE}/modules/${key}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
