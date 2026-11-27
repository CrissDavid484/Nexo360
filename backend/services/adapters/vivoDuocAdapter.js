/**
 * ADAPTADOR VIVO DUOC UC — API OFICIAL EXPERIENCIA VIVO ALUMNOS
 * Proxy servidor-a-servidor hacia https://api-oci-ext-prd.duoc.cl
 * Modos: disabled (default producción) | mock (demo/test) | live (producción con Entra ID)
 * Prevención IDOR: deriva identidad desde contexto autenticado
 */

const { stripTrailingSlashes, fetchWithRetry } = require('./adapterUtils');

const DUOC_BASE_URL = 'https://api-oci-ext-prd.duoc.cl';
const MAX_CACHE_ENTRIES = 500;

const ALLOWED_VIVO_DUOC_ENDPOINTS = new Set([
  '/InfoPersona/InfoPersona',
  '/perfil-academico/v1/perfil-academico/perfilAcademico',
  '/vivo/v1/matriculaVigente',
  '/notas/v1/notas/notasAlumno',
  '/modyo-duoc-api/attendances/me',
  '/horario/v1/horario/horario',
]);

const ALLOWED_VIVO_DUOC_HOSTS = [
  'api-oci-ext-prd.duoc.cl',
  'localhost',
  '127.0.0.1',
];

class VivoDuocAdapter {
  constructor(options = {}) {
    this._baseUrl = options.baseUrl;
    this._entraIdAdapter = options.entraIdAdapter || null;
    this.timeoutMs = options.timeoutMs || 8000;
    this.fetchImpl = options.fetchImpl || null;

    this._cache = new Map();
    this._cacheTtlMs = options.cacheTtlMs || 5 * 60 * 1000;
  }

  get baseUrl() {
    return stripTrailingSlashes(this._baseUrl ?? process.env.VIVO_DUOC_BASE_URL ?? DUOC_BASE_URL);
  }

  get entraIdAdapter() {
    return this._entraIdAdapter;
  }

  setEntraIdAdapter(adapter) {
    this._entraIdAdapter = adapter;
  }

  getMode() {
    const raw = process.env.DUOC_API_MODE;
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      const mode = String(raw).trim().toLowerCase();
      if (['disabled', 'mock', 'live'].includes(mode)) {
        return mode;
      }
      return 'invalid';
    }

    // Por defecto en cualquier entorno (incluyendo producción): disabled (fail-closed institucional)
    return 'disabled';
  }

  isDisabled() {
    return this.getMode() === 'disabled';
  }

  isMockMode() {
    return this.getMode() === 'mock';
  }

  isLiveMode() {
    return this.getMode() === 'live';
  }

  _hashParams(params = {}) {
    const keys = Object.keys(params).sort((a, b) => a.localeCompare(b));
    if (keys.length === 0) return '';
    return keys.map((k) => `${k}=${params[k]}`).join('&');
  }

  _cacheKey(nombreUsuario, endpoint, params = {}) {
    const mode = this.getMode();
    const query = this._hashParams(params);
    return `${nombreUsuario}:${endpoint}:${mode}${query ? `:${query}` : ''}`;
  }

  _getCached(nombreUsuario, endpoint, params = {}) {
    const key = this._cacheKey(nombreUsuario, endpoint, params);
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(nombreUsuario, endpoint, data, params = {}) {
    if (this._cache.size >= MAX_CACHE_ENTRIES) {
      // Purgar la clave más antigua (FIFO/LRU básico para Maps en V8)
      const oldestKey = this._cache.keys().next().value;
      if (oldestKey) this._cache.delete(oldestKey);
    }

    const key = this._cacheKey(nombreUsuario, endpoint, params);
    this._cache.set(key, {
      data,
      expiresAt: Date.now() + this._cacheTtlMs,
    });
  }

  clearCache(nombreUsuario) {
    for (const key of this._cache.keys()) {
      if (key.startsWith(`${nombreUsuario}:`)) {
        this._cache.delete(key);
      }
    }
  }

  _clearCache(nombreUsuario) {
    this.clearCache(nombreUsuario);
  }

  clearAllCache() {
    this._cache.clear();
  }

  async _fetchWithRetry(url, options = {}) {
    const allowed = [...ALLOWED_VIVO_DUOC_HOSTS];
    try {
      const baseHost = new URL(this.baseUrl).hostname;
      if (!allowed.includes(baseHost)) allowed.push(baseHost);
    } catch {
      // fallback a hosts permitidos
    }
    return fetchWithRetry(this.fetchImpl, url, options, this.timeoutMs, allowed);
  }

  async _getAuthHeaders(userId = null) {
    if (!this.isLiveMode()) {
      return { 'Content-Type': 'application/json', Accept: 'application/json' };
    }

    if (!this.entraIdAdapter) {
      throw new Error('[VivoDuocAdapter] Entra ID Adapter no inyectado para modo live');
    }

    const tokenData = await this.entraIdAdapter.getAccessTokenForDuocApi(userId);
    if (!tokenData || !tokenData.accessToken) {
      throw new Error('[VivoDuocAdapter] No se pudo obtener access token de Entra ID');
    }

    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${tokenData.accessToken}`,
    };
  }

  async _request(endpoint, params = {}, cacheUser = null, userId = null) {
    const user = cacheUser || params.nombreUsuario || null;
    const mode = this.getMode();

    if (mode === 'disabled' || mode === 'invalid') {
      return {
        success: false,
        status: 'not_configured',
        source: 'none',
        isSimulated: false,
        data: null,
        message: mode === 'disabled'
          ? 'Integración académica deshabilitada'
          : `Modo de integración inválido: ${process.env.DUOC_API_MODE}`,
        cached: false,
      };
    }

    if (user) {
      const cached = this._getCached(user, endpoint, params);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    if (mode === 'mock') {
      const mockResult = this._mockResponse(endpoint, params);
      if (user) {
        this._setCache(user, endpoint, mockResult, params);
      }
      return { ...mockResult, cached: false };
    }

    // Modo live
    if (!ALLOWED_VIVO_DUOC_ENDPOINTS.has(endpoint)) {
      throw new Error(`[VivoDuocAdapter] Endpoint no autorizado: ${endpoint}`);
    }

    const headers = await this._getAuthHeaders(userId);
    const safeBaseUrl = this.baseUrl.startsWith('http') ? this.baseUrl : `https://${this.baseUrl}`;
    const targetUrl = new URL(endpoint, safeBaseUrl);

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        targetUrl.searchParams.set(encodeURIComponent(String(k)), String(v));
      }
    });

    const response = await this._fetchWithRetry(targetUrl.href, { headers });

    if (response.status === 401) {
      throw new Error('DUOC_TOKEN_EXPIRED');
    }
    if (!response.ok) {
      throw new Error(`DUOC_UPSTREAM_ERROR: HTTP ${response.status}`);
    }

    const data = await response.json();
    const normalized = this._normalizeEndpointResponse(endpoint, data);
    const result = {
      success: true,
      status: 'ok',
      data: normalized,
      source: 'vivo_duoc',
      isSimulated: false,
      cached: false,
    };

    if (user) {
      this._setCache(user, endpoint, result, params);
    }
    return result;
  }

  // Métodos de consulta directa por endpoint
  async getInfoPersona(nombreUsuario, codAlumno = null) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');
    return this._request('/InfoPersona/InfoPersona', { codAlumno, nombreUsuario }, nombreUsuario);
  }

  async getPerfilAcademico(alumnoId, nombreUsuario) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');
    return this._request('/perfil-academico/v1/perfil-academico/perfilAcademico', { alumnoId }, nombreUsuario);
  }

  async getMatriculaVigente(nombreUsuario) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');
    return this._request('/vivo/v1/matriculaVigente', { nombreUsuario }, nombreUsuario);
  }

  async getNotas(codAlumno, nombreUsuario) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');
    return this._request('/notas/v1/notas/notasAlumno', { codAlumno }, nombreUsuario);
  }

  async getAsistencias(nombreUsuario) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');
    return this._request('/modyo-duoc-api/attendances/me', {}, nombreUsuario);
  }

  async getHorario(alumnoId, nombreUsuario) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');
    return this._request('/horario/v1/horario/horario', { alumnoId }, nombreUsuario);
  }

  _normalizeEndpointResponse(endpoint, raw) {
    if (endpoint === '/InfoPersona/InfoPersona') {
      return this._normalizeInfoPersona(raw);
    }
    if (endpoint === '/perfil-academico/v1/perfil-academico/perfilAcademico') {
      return this._normalizePerfilAcademico(raw);
    }
    if (endpoint === '/vivo/v1/matriculaVigente') {
      return this._normalizeMatriculaVigente(raw);
    }
    if (endpoint === '/notas/v1/notas/notasAlumno') {
      return this._normalizeNotas(raw);
    }
    if (endpoint === '/modyo-duoc-api/attendances/me') {
      return this._normalizeAsistencias(raw);
    }
    if (endpoint === '/horario/v1/horario/horario') {
      return this._normalizeHorario(raw);
    }
    return raw;
  }

  _normalizeInfoPersona(raw) {
    if (!raw || !raw.InfoPersona) return null;
    const p = raw.InfoPersona;
    return {
      rut: `${String(p.rut || '').padStart(8, '0')}-${p.dvRut || '0'}`,
      nombreCompleto: `${p.nombre || ''} ${p.apellido_pat || ''} ${p.apellido_mat || ''}`.trim(),
      email: p.correo_personal || '',
      telefono: p.celular || '',
      direccion: p.direccion || '',
      comuna: p.nombre_comuna || '',
      region: p.nombre_region || '',
      alumnoId: String(p.alumnoId || ''),
    };
  }

  _normalizePerfilAcademico(raw) {
    if (!raw || !raw.planesEstudios?.length) return null;
    const plan = raw.planesEstudios[0];
    const avance = plan.avanceEsperado || {};
    return {
      carrera: plan.descripcionPlanEstudios || '',
      codigoCarrera: String(plan.codigoSap || ''),
      creditosTotales: Number(plan.creditosDuoc || 0),
      creditosOptativos: Number(plan.creditosOptativos || 0),
      avanceCreditos: {
        porcentaje: String(avance.porcentaje || '0%'),
        aprobados: Number(plan.avancePorCreditos?.creditosAprobados?.creditos || 0),
        inscritos: Number(plan.avancePorCreditos?.creditosInscritos?.creditos || 0),
        pendientes: Number(plan.avancePorCreditos?.creditosPendientes?.creditos || 0),
      },
      avanceEsperado: {
        porcentaje: String(avance.porcentaje || '0%'),
        cantidadActual: Number(avance.cantidadActual || 0),
        cantidadEsperada: Number(avance.cantidadEsperadaFecha || 0),
        alDia: Boolean(avance.aldia),
      },
      asignaturas: {
        total: Number(plan.avancePorCantidad?.cantidadTotal || 0),
        aprobadas: Number(plan.avancePorCantidad?.cantidadAprobadas || 0),
        reprobadas: Number(plan.avancePorCantidad?.cantidadReprobadas || 0),
        inscritas: Number(plan.avancePorCantidad?.cantidadInscritas || 0),
        noInscritas: Number(plan.avancePorCantidad?.cantidadNoInscritas || 0),
      },
    };
  }

  _normalizeMatriculaVigente(raw) {
    if (!raw) return null;
    return {
      codAlumno: String(raw.codAlumno || ''),
      alumnoId: Number(raw.idAlumno || raw.alumnoId || 0),
      rut: `${String(raw.rut || '').padStart(8, '0')}-${raw.rut_dv || raw.dv || '0'}`,
      estado: raw.estado || raw.estadoAcademico || 'activo',
      periodo: raw.periodo || raw.periodoAcademico || null,
    };
  }

  _normalizeNotas(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((carrera) => ({
      carrera: carrera.nomCarrera || '',
      codigoCarrera: String(carrera.codCarrera || ''),
      asignaturas: (carrera.asignaturas || []).map((a) => ({
        codigo: a.codAsignatura || '',
        nombre: a.nombre || '',
        promedio: a.promedio !== undefined && a.promedio !== null ? Number(a.promedio) : null,
        parciales: (a.parciales || []).map((p) => ({
          nombre: p.texto || '',
          nota: p.nota !== undefined && p.nota !== null ? Number(p.nota) : null,
          ponderacion: Number(p.ponderacion || 0),
          fechaActualizacion: p.fechaActualizacion || null,
          promedioCurso: p.promedioCurso !== undefined && p.promedioCurso !== null ? Number(p.promedioCurso) : null,
        })),
        examenes: (a.examenes || []).map((e) => ({
          nombre: e.texto || '',
          nota: e.nota !== undefined && e.nota !== null ? Number(e.nota) : null,
          ponderacion: Number(e.ponderacion || 0),
          fechaActualizacion: e.fechaActualizacion || null,
          promedioCurso: e.promedioCurso !== undefined && e.promedioCurso !== null ? Number(e.promedioCurso) : null,
        })),
        periodo: a.periodoAcademico || '',
      })),
    }));
  }

  _normalizeAsistencias(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((a) => {
      const total = a.total !== undefined && a.total !== null ? Number(a.total) : null;
      const attended = a.attendance !== undefined && a.attendance !== null ? Number(a.attendance) : null;
      let percentage = a.percentage !== undefined && a.percentage !== null ? Number(a.percentage) : null;

      if (percentage === null && total !== null && total > 0 && attended !== null) {
        percentage = Math.round((attended / total) * 100);
      }

      return {
        courseCode: a.courseCode || '',
        courseName: a.course || '',
        career: a.carrer || a.career || '',
        totalSessions: total,
        attendedSessions: attended,
        attendancePercentage: percentage,
        studentCode: String(a.studentCode || ''),
      };
    });
  }

  _normalizeHorario(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((carrera) => ({
      carrera: carrera.nomCarrera || '',
      codigoCarrera: String(carrera.codCarrera || ''),
      dias: (carrera.dias || []).map((dia) => ({
        dia: Number(dia.dia || 0),
        ramos: (dia.ramos || []).map((r) => ({
          nombre: r.nombre || '',
          sigla: r.sigla || '',
          profesor: r.profesor || '',
          sala: r.sala || '',
          sede: r.sede || '',
          horaInicio: r.horaInicio || '',
          horaFin: r.horaFin || '',
          seccion: r.seccion || '',
        })),
      })),
    }));
  }

  _mockResponse(endpoint, params) {
    const nombreUsuario = params.nombreUsuario || 'est.demo';

    const mockData = {
      '/InfoPersona/InfoPersona': {
        rut: '11111111-1',
        nombreCompleto: 'Estudiante Demo',
        email: `${nombreUsuario}@duocuc.cl`,
        telefono: '900000000',
        direccion: 'Dirección Ficticia 123',
        comuna: 'Santiago',
        region: 'Región Metropolitana',
        alumnoId: '000000',
      },
      '/perfil-academico/v1/perfil-academico/perfilAcademico': {
        carrera: 'Ingeniería en Informática',
        codigoCarrera: '999999',
        creditosTotales: 400,
        creditosOptativos: 20,
        avanceCreditos: { porcentaje: '85%', aprobados: 340, inscritos: 30, pendientes: 30 },
        avanceEsperado: { porcentaje: '85%', cantidadActual: 34, cantidadEsperada: 40, alDia: true },
        asignaturas: { total: 40, aprobadas: 34, reprobadas: 0, inscritas: 3, noInscritas: 3 },
      },
      '/vivo/v1/matriculaVigente': {
        codAlumno: '000000',
        alumnoId: 100001,
        rut: '11111111-1',
        estado: 'activo',
        periodo: '2026-1',
      },
      '/notas/v1/notas/notasAlumno': [
        {
          carrera: 'Ingeniería en Informática',
          codigoCarrera: '999999',
          asignaturas: [
            {
              codigo: 'DEMO101',
              nombre: 'Asignatura Demo 1',
              promedio: 5.5,
              parciales: [
                { nombre: 'Parcial 1', nota: 5.0, ponderacion: 30, fechaActualizacion: '2026-01-15', promedioCurso: 5.2 },
                { nombre: 'Parcial 2', nota: 6.0, ponderacion: 30, fechaActualizacion: '2026-02-15', promedioCurso: 5.8 },
              ],
              examenes: [
                { nombre: 'Examen Final', nota: 5.5, ponderacion: 40, fechaActualizacion: '2026-03-15', promedioCurso: 5.5 },
              ],
              periodo: '2026-1',
            },
          ],
        },
      ],
      '/modyo-duoc-api/attendances/me': [
        {
          courseCode: 'DEMO101-001',
          courseName: 'Asignatura Demo 1',
          career: 'Ingeniería en Informática',
          totalSessions: 20,
          attendedSessions: 18,
          attendancePercentage: 90,
          studentCode: '000000',
        },
      ],
      '/horario/v1/horario/horario': [
        {
          carrera: 'Ingeniería en Informática',
          codigoCarrera: '999999',
          dias: [
            {
              dia: 1,
              ramos: [
                {
                  nombre: 'Asignatura Demo 1',
                  sigla: 'DEMO101',
                  profesor: 'Profesor Demo',
                  sala: 'SALA 101',
                  sede: 'ALAMEDA',
                  horaInicio: '08:30',
                  horaFin: '10:00',
                  seccion: 'DEMO101-001',
                },
              ],
            },
            {
              dia: 3,
              ramos: [
                {
                  nombre: 'Asignatura Demo 1',
                  sigla: 'DEMO101',
                  profesor: 'Profesor Demo',
                  sala: 'LAB 201',
                  sede: 'ALAMEDA',
                  horaInicio: '14:00',
                  horaFin: '15:30',
                  seccion: 'DEMO101-001',
                },
              ],
            },
            { dia: 2, ramos: [] },
            { dia: 4, ramos: [] },
            { dia: 5, ramos: [] },
            { dia: 6, ramos: [] },
            { dia: 7, ramos: [] },
          ],
        },
      ],
    };

    const data = mockData[endpoint] || null;
    return {
      success: true,
      status: 'ok',
      data,
      source: 'mock_demo',
      isSimulated: true,
      cached: false,
    };
  }

  async getFullDashboard(nombreUsuario, userId = null) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');

    const mode = this.getMode();

    if (mode === 'disabled') {
      return {
        success: false,
        status: 'not_configured',
        source: 'none',
        isSimulated: false,
        data: null,
        sections: {
          infoPersona: { status: 'unavailable', error: 'Integración deshabilitada' },
          perfilAcademico: { status: 'unavailable', error: 'Integración deshabilitada' },
          matricula: { status: 'unavailable', error: 'Integración deshabilitada' },
          notas: { status: 'unavailable', error: 'Integración deshabilitada' },
          asistencias: { status: 'unavailable', error: 'Integración deshabilitada' },
          horario: { status: 'unavailable', error: 'Integración deshabilitada' },
        },
        errors: [],
        message: 'Integración académica no disponible (modo disabled)',
        generatedAt: new Date().toISOString(),
      };
    }

    if (mode === 'invalid') {
      return {
        success: false,
        status: 'not_configured',
        source: 'none',
        isSimulated: false,
        data: null,
        sections: {},
        errors: [{ message: `Modo de API no reconocido: ${process.env.DUOC_API_MODE}` }],
        message: `Modo de API no reconocido: ${process.env.DUOC_API_MODE}`,
        generatedAt: new Date().toISOString(),
      };
    }

    const cachedDashboard = this._getCached(nombreUsuario, '__full_dashboard__');
    if (cachedDashboard) {
      return { ...cachedDashboard, cached: true };
    }

    const source = this.isLiveMode() ? 'vivo_duoc' : 'mock_demo';
    const isSimulated = !this.isLiveMode();

    // 1. Obtener matrícula vigente
    const matriculaResult = await this._request('/vivo/v1/matriculaVigente', { nombreUsuario }, nombreUsuario, userId);

    if (!matriculaResult.success || !matriculaResult.data?.codAlumno) {
      return {
        success: false,
        status: 'unavailable',
        code: 'MATRICULA_NO_ENCONTRADA',
        message: 'No se encontró matrícula vigente',
        source,
        isSimulated,
        cached: false,
        sections: {
          matricula: { status: 'error', error: 'Matrícula no encontrada' },
        },
      };
    }

    const codAlumno = matriculaResult.data.codAlumno;
    const alumnoId = String(matriculaResult.data.alumnoId);

    // 2. Ejecutar las otras 5 consultas en paralelo
    const results = await Promise.allSettled([
      this._request('/InfoPersona/InfoPersona', { codAlumno, nombreUsuario }, nombreUsuario, userId),
      this._request('/perfil-academico/v1/perfil-academico/perfilAcademico', { alumnoId }, nombreUsuario, userId),
      this._request('/notas/v1/notas/notasAlumno', { codAlumno }, nombreUsuario, userId),
      this._request('/modyo-duoc-api/attendances/me', {}, nombreUsuario, userId),
      this._request('/horario/v1/horario/horario', { alumnoId }, nombreUsuario, userId),
    ]);

    const sectionNames = ['infoPersona', 'perfilAcademico', 'notas', 'asistencias', 'horario'];
    const sections = {
      matricula: { status: 'ok', error: null },
    };
    const errors = [];
    const data = {
      matricula: matriculaResult.data,
      infoPersona: null,
      perfilAcademico: null,
      notas: null,
      asistencias: null,
      horario: null,
    };

    results.forEach((r, idx) => {
      const name = sectionNames[idx];
      if (r.status === 'fulfilled' && r.value.success) {
        data[name] = r.value.data;
        const isEmpty =
          r.value.data === null ||
          (Array.isArray(r.value.data) && r.value.data.length === 0);
        sections[name] = {
          status: isEmpty ? 'empty' : 'ok',
          error: null,
        };
      } else {
        const errorMsg = r.status === 'rejected' ? r.reason?.message : r.value?.message || 'Error en sección';
        sections[name] = {
          status: 'error',
          error: errorMsg,
        };
        errors.push({ endpoint: name, error: errorMsg });
      }
    });

    const okOrEmptyCount = Object.values(sections).filter((s) => s.status === 'ok' || s.status === 'empty').length;
    const allSuccessful = okOrEmptyCount === 6 && errors.length === 0;

    let overallStatus = 'complete';
    if (!allSuccessful && okOrEmptyCount > 0) {
      overallStatus = 'partial';
    } else if (okOrEmptyCount === 0) {
      overallStatus = 'unavailable';
    }

    const dashboardResult = {
      success: overallStatus === 'complete' || overallStatus === 'partial',
      status: overallStatus,
      source,
      isSimulated,
      data,
      sections,
      errors,
      cached: false,
      generatedAt: new Date().toISOString(),
    };

    this._setCache(nombreUsuario, '__full_dashboard__', dashboardResult);
    return dashboardResult;
  }

  normalizeForSatPredictive(rawDashboard) {
    if (!rawDashboard?.data) return null;
    const { notas, asistencias, perfilAcademico, matricula } = rawDashboard.data;

    const courses = [];
    let verifiedSessionsCount = 0;

    // Normalizar asignaturas desde notas oficiales
    if (Array.isArray(notas)) {
      for (const carrera of notas) {
        if (Array.isArray(carrera.asignaturas)) {
          for (const a of carrera.asignaturas) {
            courses.push({
              courseCode: a.codigo,
              courseName: a.nombre,
              attendancePercentage: null,
              totalSessions: null,
              attendedSessions: null,
              consecutiveAbsences: 0,
              missedKeySession: false,
              paedisJustified: false,
              creditos: null,
              isSimulated: false,
              minAttendanceRequired: null,
              notas: {
                promedio: a.promedio,
                parciales: a.parciales || [],
                examenes: a.examenes || [],
              },
            });
          }
        }
      }
    }

    // Vincular asistencias reales verificadas
    if (Array.isArray(asistencias)) {
      for (const a of asistencias) {
        const total = a.totalSessions !== undefined && a.totalSessions !== null ? Number(a.totalSessions) : null;
        const attended = a.attendedSessions !== undefined && a.attendedSessions !== null ? Number(a.attendedSessions) : null;
        const percentage = a.attendancePercentage !== undefined && a.attendancePercentage !== null ? Number(a.attendancePercentage) : null;

        if (total !== null && total > 0) {
          verifiedSessionsCount += total;
        }

        const existing = courses.find(
          (c) =>
            c.courseCode === a.courseCode ||
            (a.courseCode &&
              c.courseCode &&
              (a.courseCode.startsWith(c.courseCode) ||
                c.courseCode.startsWith(a.courseCode) ||
                a.courseCode.split('-')[0] === c.courseCode.split('-')[0]))
        );

        if (existing) {
          existing.attendancePercentage = percentage;
          existing.attendedSessions = attended;
          existing.totalSessions = total;
        } else {
          courses.push({
            courseCode: a.courseCode,
            courseName: a.courseName,
            attendancePercentage: percentage,
            totalSessions: total,
            attendedSessions: attended,
            consecutiveAbsences: 0,
            missedKeySession: false,
            paedisJustified: false,
            creditos: null,
            isSimulated: false,
            minAttendanceRequired: null,
          });
        }
      }
    }

    const avanceEsperado = perfilAcademico?.avanceEsperado?.porcentaje
      ? Number(String(perfilAcademico.avanceEsperado.porcentaje).replace('%', ''))
      : null;

    const hasSufficientData = verifiedSessionsCount > 0 && courses.length > 0;
    const academicStatus = matricula?.estado || 'activo';

    return {
      courseAttendance: courses,
      academicStatus,
      isPaedis: null,
      tutorPaedisAsignado: null,
      ajustesAprobados: [],
      hasUsedSimulator: false,
      simulatorQualityScore: null,
      enrolledCourses: courses.map((c) => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        creditos: c.creditos,
        attendancePercentage: c.attendancePercentage,
      })),
      courseAttendanceHistory: [],
      avanceEsperado,
      source: rawDashboard.source,
      hasSufficientData,
      verifiedSessionsCount,
      sinDatosSuficientes: !hasSufficientData,
    };
  }
}

const instance = new VivoDuocAdapter();
instance.VivoDuocAdapter = VivoDuocAdapter;

module.exports = instance;
