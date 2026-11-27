/**
 * ADAPTADOR DE INTEGRACIÓN SICOL / BANNER (SISTEMA DE GESTIÓN ACADÉMICA DUOC UC)
 * Gestiona sincronización de asignaturas, listas de clase y asistencias oficiales.
 */

class SicolAdapter {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || process.env.SICOL_API_URL || 'https://api-sicol.duoc.cl/v1';
    this.apiKey = options.apiKey || process.env.SICOL_API_KEY || '';
    this.clientId = options.clientId || process.env.SICOL_CLIENT_ID || '';
    this.timeoutMs = options.timeoutMs || 8000;
  }

  isConfigured() {
    return Boolean(this.apiUrl && this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Obtiene la asistencia oficial de un estudiante desde SICOL/Banner.
   */
  async getStudentAttendance(studentEmail, period = '2026-1') {
    if (!this.isConfigured()) {
      return {
        source: 'local_database',
        isSimulated: true,
        period,
        studentEmail,
        notice: 'Integración externa SICOL no configurada. Utilizando registros de MongoDB.',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/students/${encodeURIComponent(studentEmail)}/attendance?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-Id': this.clientId,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`SICOL API HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        source: 'sicol_official',
        isSimulated: false,
        period,
        studentEmail,
        courses: data.courses || [],
      };
    } catch (err) {
      console.warn(`[SicolAdapter] Fallo al consultar asistencia en SICOL (${err.message}). Revertiendo a registros locales.`);
      return {
        source: 'local_fallback',
        isSimulated: true,
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
        source: 'local_database',
        isSimulated: true,
        courseCode,
        section,
        students: [],
      };
    }

    const response = await fetch(`${this.apiUrl}/courses/${encodeURIComponent(courseCode)}/sections/${encodeURIComponent(section)}/roster`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Client-Id': this.clientId,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Error consultando sección en SICOL: HTTP ${response.status}`);
    }

    return response.json();
  }
}

module.exports = new SicolAdapter();
