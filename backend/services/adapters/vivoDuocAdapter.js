/**
 * ADAPTADOR VIVO DUOC UC — API OFICIAL EXPERIENCIA VIVO ALUMNOS
 * Proxy servidor-a-servidor hacia https://api-oci-ext-prd.duoc.cl
 * Modo dual: mock (demo) | live (producción con Entra ID)
 * Prevención IDOR: deriva identidad desde req.user.email (JWT Nexo360)
 */

const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504]);

const DUOC_BASE_URL = 'https://api-oci-ext-prd.duoc.cl';

function stripTrailingSlashes(url = '') {
  let clean = String(url || '').trim();
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

class VivoDuocAdapter {
  constructor(options = {}) {
    this._baseUrl = options.baseUrl;
    this._entraIdAdapter = options.entraIdAdapter || null;
    this.timeoutMs = options.timeoutMs || 8000;
    this.fetchImpl = options.fetchImpl || null;

    this._cache = new Map();
    this._cacheTtlMs = 5 * 60 * 1000;
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
    return (process.env.DUOC_API_MODE || 'mock').toLowerCase();
  }

  isLiveMode() {
    return this.getMode() === 'live';
  }

  _cacheKey(nombreUsuario, endpoint) {
    return `${nombreUsuario}:${endpoint}`;
  }

  _getCached(nombreUsuario, endpoint) {
    const key = this._cacheKey(nombreUsuario, endpoint);
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(nombreUsuario, endpoint, data) {
    const key = this._cacheKey(nombreUsuario, endpoint);
    this._cache.set(key, {
      data,
      expiresAt: Date.now() + this._cacheTtlMs,
    });
  }

  _clearCache(nombreUsuario) {
    for (const key of this._cache.keys()) {
      if (key.startsWith(`${nombreUsuario}:`)) {
        this._cache.delete(key);
      }
    }
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

  async _getAuthHeaders() {
    if (!this.isLiveMode()) {
      return { 'Content-Type': 'application/json', Accept: 'application/json' };
    }

    if (!this.entraIdAdapter) {
      throw new Error('[VivoDuocAdapter] Entra ID Adapter no inyectado para modo live');
    }

    const tokenData = await this.entraIdAdapter.getAccessTokenForDuocApi();
    if (!tokenData || !tokenData.accessToken) {
      throw new Error('[VivoDuocAdapter] No se pudo obtener access token de Entra ID');
    }

    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${tokenData.accessToken}`,
    };
  }

  async _request(endpoint, params = {}, cacheUser = null) {
    const user = cacheUser || params.nombreUsuario || null;

    if (user) {
      const cached = this._getCached(user, endpoint);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    if (!this.isLiveMode()) {
      const mockResult = this._mockResponse(endpoint, params);
      if (user) {
        this._setCache(user, endpoint, mockResult);
      }
      return { ...mockResult, cached: false };
    }

    const headers = await this._getAuthHeaders();
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) searchParams.set(k, v);
    });
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const url = `${this.baseUrl}${endpoint}${query}`;

    const response = await this._fetchWithRetry(url, { headers });

    if (response.status === 401) {
      throw new Error('DUOC_TOKEN_EXPIRED');
    }
    if (!response.ok) {
      throw new Error(`DUOC_UPSTREAM_ERROR: HTTP ${response.status}`);
    }

    const data = await response.json();
    const normalized = this._normalizeEndpointResponse(endpoint, data);
    const result = { success: true, data: normalized, source: 'live', cached: false };
    if (user) {
      this._setCache(user, endpoint, result);
    }
    return result;
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
      alumnoId: Number(raw.idAlumno || 0),
      rut: `${String(raw.rut || '').padStart(8, '0')}-${raw.rut_dv || '0'}`,
    };
  }

  _normalizeNotas(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(carrera => ({
      carrera: carrera.nomCarrera || '',
      codigoCarrera: String(carrera.codCarrera || ''),
      asignaturas: (carrera.asignaturas || []).map(a => ({
        codigo: a.codAsignatura || '',
        nombre: a.nombre || '',
        promedio: Number(a.promedio || 0),
        parciales: (a.parciales || []).map(p => ({
          nombre: p.texto || '',
          nota: Number(p.nota || 0),
          ponderacion: Number(p.ponderacion || 0),
          fechaActualizacion: p.fechaActualizacion || null,
          promedioCurso: Number(p.promedioCurso || 0),
        })),
        examenes: (a.examenes || []).map(e => ({
          nombre: e.texto || '',
          nota: Number(e.nota || 0),
          ponderacion: Number(e.ponderacion || 0),
          fechaActualizacion: e.fechaActualizacion || null,
          promedioCurso: Number(e.promedioCurso || 0),
        })),
        periodo: a.periodoAcademico || '',
      })),
    }));
  }

  _normalizeAsistencias(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(a => ({
      courseCode: a.courseCode || '',
      courseName: a.course || '',
      career: a.carrer || a.career || '',
      totalSessions: Number(a.total || 0),
      attendedSessions: Number(a.attendance || 0),
      attendancePercentage: Number(a.percentage || 0),
      studentCode: String(a.studentCode || ''),
    }));
  }

  _normalizeHorario(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(carrera => ({
      carrera: carrera.nomCarrera || '',
      codigoCarrera: String(carrera.codCarrera || ''),
      dias: (carrera.dias || []).map(dia => ({
        dia: Number(dia.dia || 0),
        ramos: (dia.ramos || []).map(r => ({
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
      },
      '/notas/v1/notas/notasAlumno': [{
        carrera: 'Ingeniería en Informática',
        codigoCarrera: '999999',
        asignaturas: [{
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
        }],
      }],
      '/modyo-duoc-api/attendances/me': [{
        courseCode: 'DEMO101-001',
        courseName: 'Asignatura Demo 1',
        career: 'Ingeniería en Informática',
        totalSessions: 20,
        attendedSessions: 18,
        attendancePercentage: 90,
        studentCode: '000000',
      }],
      '/horario/v1/horario/horario': [{
        carrera: 'Ingeniería en Informática',
        codigoCarrera: '999999',
        dias: [
          { dia: 1, ramos: [{ nombre: 'Asignatura Demo 1', sigla: 'DEMO101', profesor: 'Profesor Demo', sala: 'SALA 101', sede: 'ALAMEDA', horaInicio: '08:30', horaFin: '10:00', seccion: 'DEMO101-001' }] },
          { dia: 3, ramos: [{ nombre: 'Asignatura Demo 1', sigla: 'DEMO101', profesor: 'Profesor Demo', sala: 'LAB 201', sede: 'ALAMEDA', horaInicio: '14:00', horaFin: '15:30', seccion: 'DEMO101-001' }] },
          { dia: 2, ramos: [] }, { dia: 4, ramos: [] }, { dia: 5, ramos: [] }, { dia: 6, ramos: [] }, { dia: 7, ramos: [] },
        ],
      }],
    };

    const data = mockData[endpoint] || null;
    return { success: true, data, source: 'mock_demo', cached: false };
  }

  async getFullDashboard(nombreUsuario) {
    if (!nombreUsuario) throw new Error('nombreUsuario requerido');

    const cachedDashboard = this._getCached(nombreUsuario, '__full_dashboard__');
    if (cachedDashboard) {
      return { ...cachedDashboard, cached: true };
    }

    const matricula = await this._request('/vivo/v1/matriculaVigente', { nombreUsuario }, nombreUsuario);
    if (!matricula.success || !matricula.data?.codAlumno) {
      return {
        success: false,
        code: 'MATRICULA_NO_ENCONTRADA',
        message: 'No se encontró matrícula vigente',
        source: this.isLiveMode() ? 'live' : 'mock_demo',
        cached: false,
      };
    }

    const codAlumno = matricula.data.codAlumno;
    const alumnoId = String(matricula.data.alumnoId);

    const results = await Promise.allSettled([
      this._request('/InfoPersona/InfoPersona', { codAlumno, nombreUsuario }, nombreUsuario),
      this._request('/perfil-academico/v1/perfil-academico/perfilAcademico', { alumnoId }, nombreUsuario),
      this._request('/notas/v1/notas/notasAlumno', { codAlumno }, nombreUsuario),
      this._request('/modyo-duoc-api/attendances/me', {}, nombreUsuario),
      this._request('/horario/v1/horario/horario', { alumnoId }, nombreUsuario),
    ]);

    const [infoPersona, perfilAcademico, notas, asistencias, horario] = results.map(r =>
      r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message }
    );

    const errors = results
      .map((r, i) => r.status === 'rejected' ? { endpoint: ['InfoPersona', 'PerfilAcademico', 'Notas', 'Asistencias', 'Horario'][i], error: r.reason?.message } : null)
      .filter(Boolean);

    const dashboardResult = {
      success: true,
      data: {
        infoPersona: infoPersona.success ? infoPersona.data : null,
        perfilAcademico: perfilAcademico.success ? perfilAcademico.data : null,
        matricula: matricula.data,
        notas: notas.success ? notas.data : null,
        asistencias: asistencias.success ? asistencias.data : null,
        horario: horario.success ? horario.data : null,
      },
      errors,
      source: this.isLiveMode() ? 'live' : 'mock_demo',
      cached: false,
      generatedAt: new Date().toISOString(),
    };

    this._setCache(nombreUsuario, '__full_dashboard__', dashboardResult);
    return dashboardResult;
  }

  normalizeForSatPredictive(rawDashboard) {
    if (!rawDashboard?.data) return null;
    const { notas, asistencias, perfilAcademico } = rawDashboard.data;

    const courses = [];
    if (Array.isArray(notas)) {
      for (const carrera of notas) {
        if (Array.isArray(carrera.asignaturas)) {
          for (const a of carrera.asignaturas) {
            courses.push({
              courseCode: a.codigo,
              courseName: a.nombre,
              attendancePercentage: null,
              totalSessions: 20,
              attendedSessions: 0,
              consecutiveAbsences: 0,
              missedKeySession: false,
              paedisJustified: false,
              creditos: 10,
              isSimulated: false,
              minAttendanceRequired: 70,
              notas: {
                promedio: a.promedio,
                parciales: a.parciales,
                examenes: a.examenes,
              },
            });
          }
        }
      }
    }

    if (Array.isArray(asistencias)) {
      for (const a of asistencias) {
        const existing = courses.find(c =>
          c.courseCode === a.courseCode ||
          (a.courseCode && c.courseCode && (
            a.courseCode.startsWith(c.courseCode) ||
            c.courseCode.startsWith(a.courseCode) ||
            a.courseCode.split('-')[0] === c.courseCode.split('-')[0]
          ))
        );
        if (existing) {
          existing.attendancePercentage = a.attendancePercentage;
          existing.attendedSessions = a.attendedSessions;
          existing.totalSessions = a.totalSessions;
        } else {
          courses.push({
            courseCode: a.courseCode,
            courseName: a.courseName,
            attendancePercentage: a.attendancePercentage,
            totalSessions: a.totalSessions,
            attendedSessions: a.attendedSessions,
            consecutiveAbsences: 0,
            missedKeySession: false,
            paedisJustified: false,
            creditos: 10,
            isSimulated: false,
            minAttendanceRequired: 70,
          });
        }
      }
    }

    const avanceEsperado = perfilAcademico?.avanceEsperado?.porcentaje
      ? Number(String(perfilAcademico.avanceEsperado.porcentaje).replace('%', ''))
      : 0;

    return {
      courseAttendance: courses,
      academicStatus: 'activo',
      isPaedis: false,
      tutorPaedisAsignado: 'No',
      ajustesAprobados: [],
      hasUsedSimulator: false,
      simulatorQualityScore: null,
      enrolledCourses: courses.map(c => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        creditos: c.creditos,
        attendancePercentage: c.attendancePercentage,
      })),
      courseAttendanceHistory: [],
      avanceEsperado,
      source: rawDashboard.source,
    };
  }
}

const instance = new VivoDuocAdapter();
instance.VivoDuocAdapter = VivoDuocAdapter;

module.exports = instance;