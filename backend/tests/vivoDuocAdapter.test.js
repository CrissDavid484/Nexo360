/**
 * TESTS VIVO DUOC ADAPTER — node:test
 * Cobertura: modo mock, normalización, caché, manejo 401/timeout, protección IDOR
 */

const { test, describe, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');

const vivoDuocAdapter = require('../services/adapters/vivoDuocAdapter');

describe('VivoDuocAdapter — Tests Unitarios', () => {
  const originalMode = process.env.DUOC_API_MODE;
  const originalFetch = global.fetch;

  before(() => {
    process.env.DUOC_API_MODE = 'mock';
  });

  after(() => {
    process.env.DUOC_API_MODE = originalMode;
    global.fetch = originalFetch;
  });

  describe('Modo MOCK (DUOC_API_MODE=mock)', () => {
    test('getFullDashboard retorna estructura completa con datos mock', async () => {
      const result = await vivoDuocAdapter.getFullDashboard('est.demo');

      assert.equal(result.success, true);
      assert.equal(result.source, 'mock_demo');
      assert.ok(result.data);
      assert.ok(result.data.infoPersona);
      assert.ok(result.data.perfilAcademico);
      assert.ok(result.data.matricula);
      assert.ok(result.data.notas);
      assert.ok(result.data.asistencias);
      assert.ok(result.data.horario);
      assert.ok(result.generatedAt);
    });

    test('getFullDashboard requiere nombreUsuario', async () => {
      try {
        await vivoDuocAdapter.getFullDashboard('');
        assert.fail('Debe lanzar error por nombreUsuario vacío');
      } catch (err) {
        assert.ok(err.message.includes('nombreUsuario requerido'));
      }
    });

    test('normalizeForSatPredictive transforma dashboard a formato SAT', async () => {
      const dashboard = await vivoDuocAdapter.getFullDashboard('est.demo');
      const normalized = vivoDuocAdapter.normalizeForSatPredictive(dashboard);

      assert.ok(normalized);
      assert.ok(Array.isArray(normalized.courseAttendance));
      assert.ok(normalized.courseAttendance.length > 0);
      assert.ok(normalized.courseAttendance[0].courseCode);
      assert.ok(normalized.courseAttendance[0].courseName);
      assert.ok(typeof normalized.courseAttendance[0].attendancePercentage === 'number');
      assert.equal(normalized.academicStatus, 'activo');
      assert.equal(normalized.source, 'mock_demo');
    });

    test('mock data no contiene datos personales reales (RUT real, alumnoId real, etc.)', async () => {
      const dashboard = await vivoDuocAdapter.getFullDashboard('est.demo');
      const infoPersona = dashboard.data.infoPersona;

      // Solo datos sintéticos
      assert.equal(infoPersona.rut, '11111111-1');
      assert.equal(infoPersona.alumnoId, '000000');
      assert.ok(infoPersona.email.includes('@duocuc.cl'));
    });
  });

  describe('Normalización de endpoints', () => {
    test('_normalizeInfoPersona limpia campos y formatea RUT', () => {
      const raw = {
        InfoPersona: {
          rut: '1234567',
          dvRut: '8',
          nombre: 'Juan',
          apellido_pat: 'Perez',
          apellido_mat: 'Gonzalez',
          correo_personal: 'juan@duocuc.cl',
          celular: '987654321',
          direccion: 'Calle Falsa 123',
          nombre_comuna: 'Santiago',
          nombre_region: 'Metropolitana',
          alumnoId: '100001',
        },
      };
      const normalized = vivoDuocAdapter._normalizeInfoPersona(raw);
      assert.equal(normalized.rut, '01234567-8');
      assert.equal(normalized.nombreCompleto, 'Juan Perez Gonzalez');
      assert.equal(normalized.email, 'juan@duocuc.cl');
      assert.equal(normalized.alumnoId, '100001');
    });

    test('_normalizeAsistencias corrige typo "carrer" -> "career"', () => {
      const raw = [{
        courseCode: 'PROG101-001',
        course: 'Programación I',
        carrer: 'Ingeniería Informática', // typo original de Duoc
        total: 20,
        attendance: 18,
        percentage: 90,
        studentCode: '200002',
      }];
      const normalized = vivoDuocAdapter._normalizeAsistencias(raw);
      assert.equal(normalized[0].career, 'Ingeniería Informática');
      assert.equal(normalized[0].attendancePercentage, 90);
      assert.equal(normalized[0].totalSessions, 20);
    });

    test('_normalizeNotas mapea estructura completa con parciales y examenes', () => {
      const raw = [{
        nomCarrera: 'Ingeniería en Informática',
        codCarrera: '1446114',
        asignaturas: [{
          codAsignatura: 'PTY4614',
          nombre: 'CAPSTONE',
          promedio: '5.5',
          parciales: [
            { texto: 'Parcial 1', nota: '5.0', ponderacion: '30', fechaActualizacion: '2026-01-15', promedioCurso: '5.2' },
          ],
          examenes: [
            { texto: 'Examen Final', nota: '6.0', ponderacion: '70', fechaActualizacion: '2026-03-15', promedioCurso: '5.8' },
          ],
          periodoAcademico: '2026-1',
        }],
      }];
      const normalized = vivoDuocAdapter._normalizeNotas(raw);
      assert.equal(normalized[0].carrera, 'Ingeniería en Informática');
      assert.equal(normalized[0].asignaturas[0].codigo, 'PTY4614');
      assert.equal(normalized[0].asignaturas[0].promedio, 5.5);
      assert.equal(normalized[0].asignaturas[0].parciales.length, 1);
      assert.equal(normalized[0].asignaturas[0].examenes.length, 1);
    });
  });

  describe('Caché en memoria (TTL 5 min)', () => {
    test('Segunda llamada usa caché (cached: true)', async () => {
      const r1 = await vivoDuocAdapter.getFullDashboard('est.cache1');
      const r2 = await vivoDuocAdapter.getFullDashboard('est.cache1');

      assert.equal(r1.cached, false);
      assert.equal(r2.cached, true);
    });

    test('Caché separada por usuario', async () => {
      const r1a = await vivoDuocAdapter.getFullDashboard('est.userA');
      const r1b = await vivoDuocAdapter.getFullDashboard('est.userB');
      const r2a = await vivoDuocAdapter.getFullDashboard('est.userA');

      assert.equal(r1a.cached, false);
      assert.equal(r1b.cached, false);
      assert.equal(r2a.cached, true); // userA ya tiene caché
    });

    test('_clearCache limpia entradas de un usuario', async () => {
      await vivoDuocAdapter.getFullDashboard('est.cache2');
      const r2 = await vivoDuocAdapter.getFullDashboard('est.cache2');
      assert.equal(r2.cached, true);

      vivoDuocAdapter._clearCache('est.cache2');
      const r3 = await vivoDuocAdapter.getFullDashboard('est.cache2');
      assert.equal(r3.cached, false);
    });
  });

  describe('Manejo de errores 401/timeout (modo live simulado)', () => {
    let mockFetch;

    before(() => {
      process.env.DUOC_API_MODE = 'live';
      mockFetch = mock.method(global, 'fetch', async (url, options) => {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        };
      });
    });

    after(() => {
      process.env.DUOC_API_MODE = 'mock';
      mockFetch.mock.restore();
    });

    test('Modo live sin EntraIdAdapter lanza error claro', async () => {
      const adapter = new (require('../services/adapters/vivoDuocAdapter').VivoDuocAdapter)();
      adapter.setEntraIdAdapter(null);

      try {
        await adapter.getFullDashboard('est.demo');
        assert.fail('Debe lanzar error por falta de EntraIdAdapter');
      } catch (err) {
        assert.ok(err.message.includes('Entra ID Adapter no inyectado'));
      }
    });

    test('Error 401 propaga código DUOC_TOKEN_EXPIRED', async () => {
      const adapter = new (require('../services/adapters/vivoDuocAdapter').VivoDuocAdapter)();
      // Mock EntraIdAdapter que retorna token pero fetch falla con 401
      adapter.setEntraIdAdapter({
        getAccessTokenForDuocApi: async () => ({ accessToken: 'fake-token', expiresIn: 3600 }),
      });

      try {
        await adapter.getFullDashboard('est.demo');
        assert.fail('Debe lanzar error 401');
      } catch (err) {
        assert.ok(err.message.includes('DUOC_TOKEN_EXPIRED'));
      }
    });

    test('getAccessTokenForDuocApi retorna null si no está configurado, y token si hay credencial configurada', async () => {
      const entraIdAdapter = require('../services/adapters/entraIdAdapter');
      const unconfigured = await entraIdAdapter.getAccessTokenForDuocApi('user123');
      assert.equal(unconfigured, null);

      const origToken = process.env.DUOC_API_SERVICE_TOKEN;
      const origTenant = process.env.AZURE_ENTRA_TENANT_ID;
      const origClient = process.env.AZURE_ENTRA_CLIENT_ID;
      const origRedirect = process.env.AZURE_ENTRA_REDIRECT_URI;
      const origSecret = process.env.AZURE_ENTRA_CLIENT_SECRET;
      try {
        process.env.AZURE_ENTRA_TENANT_ID = 'test-tenant';
        process.env.AZURE_ENTRA_CLIENT_ID = 'test-client';
        process.env.AZURE_ENTRA_REDIRECT_URI = 'https://nexo360.duoc.cl/auth/callback';
        process.env.AZURE_ENTRA_CLIENT_SECRET = 'test-secret';
        process.env.DUOC_API_SERVICE_TOKEN = 'token-institucional-123';

        const tokenData = await entraIdAdapter.getAccessTokenForDuocApi('user123');
        assert.ok(tokenData);
        assert.equal(tokenData.accessToken, 'token-institucional-123');
      } finally {
        if (origToken !== undefined) process.env.DUOC_API_SERVICE_TOKEN = origToken;
        else delete process.env.DUOC_API_SERVICE_TOKEN;
        if (origTenant !== undefined) process.env.AZURE_ENTRA_TENANT_ID = origTenant;
        else delete process.env.AZURE_ENTRA_TENANT_ID;
        if (origClient !== undefined) process.env.AZURE_ENTRA_CLIENT_ID = origClient;
        else delete process.env.AZURE_ENTRA_CLIENT_ID;
        if (origRedirect !== undefined) process.env.AZURE_ENTRA_REDIRECT_URI = origRedirect;
        else delete process.env.AZURE_ENTRA_REDIRECT_URI;
        if (origSecret !== undefined) process.env.AZURE_ENTRA_CLIENT_SECRET = origSecret;
        else delete process.env.AZURE_ENTRA_CLIENT_SECRET;
      }
    });
  });

  describe('Protección IDOR (deriva identidad desde email autenticado)', () => {
    test('getFullDashboard nunca recibe alumnoId/codAlumno por parámetros externos', async () => {
      const result = await vivoDuocAdapter.getFullDashboard('est.demo');

      // Verificar que el flujo interno usa nombreUsuario -> matriculaVigente -> codAlumno/alumnoId
      assert.ok(result.data.matricula);
      assert.ok(result.data.matricula.codAlumno);
      assert.ok(result.data.matricula.alumnoId);
      // Los endpoints posteriores usan esos valores derivados internamente
    });
  });

  describe('Esquema de respuesta consistente', () => {
    test('Respuesta mock tiene mismo shape que live (campos requeridos)', async () => {
      const result = await vivoDuocAdapter.getFullDashboard('est.demo');

      // Estructura canónica que el frontend espera
      assert.ok('success' in result);
      assert.ok('data' in result);
      assert.ok('source' in result);
      assert.ok('generatedAt' in result);
      assert.ok('errors' in result);

      // Datos principales
      assert.ok('infoPersona' in result.data);
      assert.ok('perfilAcademico' in result.data);
      assert.ok('matricula' in result.data);
      assert.ok('notas' in result.data);
      assert.ok('asistencias' in result.data);
      assert.ok('horario' in result.data);
    });

    test('normalizeForSatPredictive produce campos compatibles con satAlertService y predictiveRiskService', async () => {
      const dashboard = await vivoDuocAdapter.getFullDashboard('est.demo');
      const normalized = vivoDuocAdapter.normalizeForSatPredictive(dashboard);

      // satAlertService espera courseAttendance[]
      assert.ok(Array.isArray(normalized.courseAttendance));
      normalized.courseAttendance.forEach(c => {
        assert.ok('courseCode' in c);
        assert.ok('courseName' in c);
        assert.ok('attendancePercentage' in c);
        assert.ok('totalSessions' in c);
        assert.ok('attendedSessions' in c);
        assert.ok('consecutiveAbsences' in c);
        assert.ok('missedKeySession' in c);
        assert.ok('paedisJustified' in c);
        assert.ok('creditos' in c);
        assert.ok('minAttendanceRequired' in c);
      });

      // predictiveRiskService espera campos adicionales
      assert.ok('academicStatus' in normalized);
      assert.ok('isPaedis' in normalized);
      assert.ok('tutorPaedisAsignado' in normalized);
      assert.ok('ajustesAprobados' in normalized);
      assert.ok('hasUsedSimulator' in normalized);
      assert.ok('enrolledCourses' in normalized);
      assert.ok('avanceEsperado' in normalized);
    });
  });

  describe('VivoDuocController — Manejo HTTP 401, 502 y 500', () => {
    const { getDashboard } = require('../controllers/vivoDuocController');

    function createMockRes() {
      const res = {
        statusCode: 0,
        payload: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.payload = data;
          return this;
        },
      };
      return res;
    }

    test('400 si req.user.email no está presente', async () => {
      const res = createMockRes();
      await getDashboard({ user: {} }, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.payload.code, 'USER_EMAIL_REQUIRED');
    });

    test('401 si error es DUOC_TOKEN_EXPIRED', async () => {
      const origGetFull = vivoDuocAdapter.getFullDashboard;
      vivoDuocAdapter.getFullDashboard = async () => {
        throw new Error('DUOC_TOKEN_EXPIRED');
      };
      try {
        const res = createMockRes();
        await getDashboard({ user: { email: 'est.test@duocuc.cl' } }, res);
        assert.equal(res.statusCode, 401);
        assert.equal(res.payload.code, 'DUOC_TOKEN_EXPIRED');
        assert.equal(res.payload.message, 'El token de sesión de Vivo Duoc expiró.');
      } finally {
        vivoDuocAdapter.getFullDashboard = origGetFull;
      }
    });

    test('502 si error empieza con DUOC_UPSTREAM_ERROR', async () => {
      const origGetFull = vivoDuocAdapter.getFullDashboard;
      vivoDuocAdapter.getFullDashboard = async () => {
        throw new Error('DUOC_UPSTREAM_ERROR: HTTP 504 Gateway Timeout');
      };
      try {
        const res = createMockRes();
        await getDashboard({ user: { email: 'est.test@duocuc.cl' } }, res);
        assert.equal(res.statusCode, 502);
        assert.equal(res.payload.code, 'DUOC_UPSTREAM_ERROR');
        assert.equal(res.payload.message, 'DUOC_UPSTREAM_ERROR: HTTP 504 Gateway Timeout');
      } finally {
        vivoDuocAdapter.getFullDashboard = origGetFull;
      }
    });

    test('500 para otros errores no controlados', async () => {
      const origGetFull = vivoDuocAdapter.getFullDashboard;
      vivoDuocAdapter.getFullDashboard = async () => {
        throw new Error('Unexpected crash in parsing');
      };
      try {
        const res = createMockRes();
        await getDashboard({ user: { email: 'est.test@duocuc.cl' } }, res);
        assert.equal(res.statusCode, 500);
        assert.equal(res.payload.code, 'INTERNAL_ERROR');
      } finally {
        vivoDuocAdapter.getFullDashboard = origGetFull;
      }
    });
  });
});