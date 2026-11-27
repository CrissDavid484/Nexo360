/**
 * ADAPTADOR DE INTEGRACIÓN SICOL / BANNER (SISTEMA DE GESTIÓN ACADÉMICA DUOC UC)
 * Gestiona sincronización de asignaturas, listas de clase y asistencias oficiales.
 */

const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504]);

function stripTrailingSlashes(url = '') {
  let clean = String(url || '').trim();
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

class SicolAdapter {
  constructor(options = {}) {
    this._apiUrl = options.apiUrl;
    this._apiKey = options.apiKey;
    this._clientId = options.clientId;
    this.timeoutMs = options.timeoutMs || 8000;
    this.fetchImpl = options.fetchImpl || null;
  }

  get apiUrl() {
    return stripTrailingSlashes(this._apiUrl ?? process.env.SICOL_API_URL ?? '');
  }

  get apiKey() {
    return String(this._apiKey ?? process.env.SICOL_API_KEY ?? '').trim();
  }

  get clientId() {
    return String(this._clientId ?? process.env.SICOL_CLIENT_ID ?? '').trim();
  }

  isConfigured() {
    return Boolean(this.apiUrl && this.apiKey && this.apiKey.length > 5);
  }

  async _fetchWithRetry(url, options = {}) {
    const fetchFn = this.fetchImpl || fetch;
    let lastResponse = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetchFn(url, {
        ...options,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      lastResponse = response;
      if (response.ok || !RETRYABLE_HTTP_STATUSES.has(response.status) || attempt === 1) {
        return response;
      }
    }
    return lastResponse;
  }

  /**
   * Obtiene la asistencia oficial de un estudiante desde SICOL/Banner.
   */
  async getStudentAttendance(studentEmail, period = '2026-1') {
    if (!this.isConfigured()) {
      return {
        configured: false,
        mode: 'UNCONFIGURED',
        data: null,
        source: 'unconfigured',
        isSimulated: false,
        period,
        studentEmail,
        notice: 'Integración externa SICOL no configurada (requiere SICOL_API_URL y SICOL_API_KEY).',
      };
    }

    try {
      const url = `${this.apiUrl}/students/${encodeURIComponent(studentEmail)}/attendance?period=${encodeURIComponent(period)}`;
      const response = await this._fetchWithRetry(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-Client-Id': this.clientId,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`SICOL API HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        configured: true,
        mode: 'OFFICIAL',
        data,
        source: 'sicol_official',
        isSimulated: false,
        period,
        studentEmail,
        courses: data.courses || [],
      };
    } catch (err) {
      console.warn(`[SicolAdapter] Fallo al consultar asistencia en SICOL (${err.message}).`);
      return {
        configured: true,
        mode: 'ERROR',
        data: null,
        source: 'sicol_error',
        isSimulated: false,
        period,
        studentEmail,
        error: err.message,
      };
    }
  }

  /**
   * Obtiene la nómina de un curso/sección desde SICOL.
   */
  async getCourseRoster(courseCode, section) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        mode: 'UNCONFIGURED',
        data: null,
        source: 'unconfigured',
        courseCode,
        section,
        students: [],
      };
    }

    const url = `${this.apiUrl}/courses/${encodeURIComponent(courseCode)}/sections/${encodeURIComponent(section)}/roster`;
    const response = await this._fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'X-Client-Id': this.clientId,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error consultando sección en SICOL: HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      configured: true,
      mode: 'OFFICIAL',
      data,
      ...data,
    };
  }
}

module.exports = new SicolAdapter();
module.exports.SicolAdapter = SicolAdapter;
