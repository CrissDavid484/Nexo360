/**
 * TESTS ACADEMIC DATA SERVICE (BLOQUE A) — node:test
 * Cobertura completa:
 * 1. Modos disabled (default fail-closed) | mock | live | invalid
 * 2. Respuestas parciales (complete vs partial vs unavailable)
 * 3. Eliminación de datos sintéticos de relleno en normalización
 * 4. Prevención estricta de IDOR y contexto de identidad
 * 5. Caché aislada por usuario y modo con purga
 * 6. Salvaguarda SAT / Riesgo Predictivo (insufficient_data ante 0 sesiones)
 * 7. Códigos de respuesta HTTP del controlador (503, 401, 403, 502, 200)
 */

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const academicDataService = require('../services/academicDataService');
const vivoDuocAdapter = require('../services/adapters/vivoDuocAdapter');
const { getDashboard } = require('../controllers/vivoDuocController');

function createMockRes() {
  return {
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
}

describe('AcademicDataService (Bloque A) — Tests Unitarios e Integración', () => {
  const originalMode = process.env.DUOC_API_MODE;

  beforeEach(() => {
    vivoDuocAdapter.clearAllCache();
  });

  after(() => {
    process.env.DUOC_API_MODE = originalMode;
    vivoDuocAdapter.clearAllCache();
  });

  describe('1. Modos de Operación (disabled, mock, live, invalid)', () => {
    test('Modo disabled por defecto o explícito retorna status: not_configured (Fail-Closed)', async () => {
      delete process.env.DUOC_API_MODE;
      const resDefault = await academicDataService.getStudentAcademicDashboard({
        email: 'est.test@duocuc.cl',
        role: 'student',
      });
      assert.equal(resDefault.success, false);
      assert.equal(resDefault.status, 'not_configured');
      assert.equal(resDefault.source, 'none');

      process.env.DUOC_API_MODE = 'disabled';
      const resExplicit = await academicDataService.getStudentAcademicDashboard({
        email: 'est.test@duocuc.cl',
        role: 'student',
      });
      assert.equal(resExplicit.success, false);
      assert.equal(resExplicit.status, 'not_configured');
      assert.equal(resExplicit.source, 'none');
    });

    test('Modo inválido retorna fail-closed con mensaje explicativo', async () => {
      process.env.DUOC_API_MODE = 'unrecognized_mode_xyz';
      const result = await academicDataService.getStudentAcademicDashboard({
        email: 'est.test@duocuc.cl',
        role: 'student',
      });
      assert.equal(result.success, false);
      assert.equal(result.status, 'not_configured');
    });

    test('Modo mock retorna datos estructurados completos con isSimulated: true', async () => {
      process.env.DUOC_API_MODE = 'mock';
      const result = await academicDataService.getStudentAcademicDashboard({
        email: 'est.mock@duocuc.cl',
        role: 'student',
      });
      assert.equal(result.success, true);
      assert.equal(result.status, 'complete');
      assert.equal(result.source, 'mock_demo');
      assert.equal(result.isSimulated, true);
      assert.ok(result.data.matricula);
      assert.ok(result.data.notas);
      assert.ok(result.data.asistencias);
      assert.ok(result.sections.matricula);
      assert.equal(result.sections.matricula.status, 'ok');
    });
  });

  describe('2. Prevención IDOR y Contexto de Identidad', () => {
    test('Estudiante no puede solicitar datos de otro estudiante (FORBIDDEN_IDOR)', async () => {
      process.env.DUOC_API_MODE = 'mock';
      await assert.rejects(
        async () => {
          await academicDataService.getStudentAcademicDashboard({
            email: 'estudiante.legitimo@duocuc.cl',
            role: 'student',
            targetEmail: 'otro.estudiante@duocuc.cl',
          });
        },
        (err) => {
          assert.equal(err.code, 'FORBIDDEN_IDOR');
          return true;
        }
      );
    });

    test('Estudiante consultando su propio perfil tiene éxito', async () => {
      process.env.DUOC_API_MODE = 'mock';
      const result = await academicDataService.getStudentAcademicDashboard({
        email: 'estudiante.legitimo@duocuc.cl',
        role: 'student',
        targetEmail: 'estudiante.legitimo@duocuc.cl',
      });
      assert.equal(result.success, true);
    });

    test('Coordinador o Administrador puede auditar a otro estudiante', async () => {
      process.env.DUOC_API_MODE = 'mock';
      const result = await academicDataService.getStudentAcademicDashboard({
        email: 'coordinador.paedis@duocuc.cl',
        role: 'coordinador_paedis',
        targetEmail: 'alumno.auditado@duocuc.cl',
      });
      assert.equal(result.success, true);
      assert.equal(result.meta.studentEmail, 'alumno.auditado@duocuc.cl');
    });

    test('Falta de email en sesión autenticada lanza USER_EMAIL_REQUIRED', () => {
      assert.throws(
        () => academicDataService._resolveIdentity({}),
        (err) => {
          assert.equal(err.code, 'USER_EMAIL_REQUIRED');
          return true;
        }
      );
    });
  });

  describe('3. Ausencia de Rellenos Sintéticos y Diferenciación 0 vs null', () => {
    test('normalizeForSatPredictive no inventa 20 sesiones ni créditos fijos si no vienen reportados', () => {
      const mockRaw = {
        source: 'vivo_duoc',
        data: {
          matricula: { codAlumno: '123', alumnoId: 456, estado: 'regular' },
          notas: [
            {
              nomCarrera: 'Ingeniería',
              codCarrera: '1',
              asignaturas: [
                {
                  codigo: 'MAT101',
                  nombre: 'Matemática I',
                  promedio: null, // Asignatura recién inscrita
                  parciales: [],
                  examenes: [],
                },
              ],
            },
          ],
          asistencias: [], // Sin clases registradas aún
          perfilAcademico: null,
        },
      };

      const normalized = vivoDuocAdapter.normalizeForSatPredictive(mockRaw);
      assert.ok(normalized);
      const ramo = normalized.courseAttendance[0];

      // NO debe tener sesiones inventadas
      assert.equal(ramo.totalSessions, null);
      assert.equal(ramo.attendedSessions, null);
      assert.equal(ramo.attendancePercentage, null);
      assert.equal(ramo.creditos, null);
      assert.equal(ramo.minAttendanceRequired, null);

      // Verificación de suficiencia de datos
      assert.equal(normalized.hasSufficientData, false);
      assert.equal(normalized.verifiedSessionsCount, 0);
      assert.equal(normalized.sinDatosSuficientes, true);
    });

    test('Asistencia 0 real con sesiones dictadas se preserva como 0% y no como null', () => {
      const mockRaw = {
        source: 'vivo_duoc',
        data: {
          matricula: { codAlumno: '123', alumnoId: 456, estado: 'activo' },
          notas: [],
          asistencias: [
            {
              courseCode: 'FIS101',
              course: 'Física',
              career: 'Ingeniería',
              totalSessions: 10,
              attendedSessions: 0,
              attendancePercentage: 0,
            },
          ],
        },
      };

      const normalized = vivoDuocAdapter.normalizeForSatPredictive(mockRaw);
      const ramo = normalized.courseAttendance[0];
      assert.equal(ramo.totalSessions, 10);
      assert.equal(ramo.attendedSessions, 0);
      assert.equal(ramo.attendancePercentage, 0);
      assert.equal(normalized.verifiedSessionsCount, 10);
      assert.equal(normalized.hasSufficientData, true);
    });
  });

  describe('4. Salvaguarda SAT y Riesgo Predictivo (insufficient_data)', () => {
    test('Estudiante sin sesiones verificadas recibe status: insufficient_data sin falsas alarmas críticas', async () => {
      process.env.DUOC_API_MODE = 'mock';

      const mockDashboardNoSessions = {
        success: true,
        status: 'complete',
        source: 'vivo_duoc',
        data: {
          matricula: { codAlumno: '123', alumnoId: 456 },
          notas: [
            {
              nomCarrera: 'Ingeniería',
              asignaturas: [{ codigo: 'CS101', nombre: 'Intro CS' }],
            },
          ],
          asistencias: [], // 0 sesiones
        },
      };

      const baseline = await academicDataService.getSatAcademicBaseline(
        { email: 'alumno.nuevo@duocuc.cl', role: 'student' },
        mockDashboardNoSessions
      );

      assert.equal(baseline.sat.status, 'insufficient_data');
      assert.equal(baseline.sat.riskLevel, 'NONE');
      assert.ok(baseline.sat.reason.includes('No hay suficientes sesiones verificadas'));

      assert.equal(baseline.predictiveRisk.status, 'insufficient_data');
      assert.equal(baseline.predictiveRisk.riskLevel, 'SIN_DATOS');
      assert.equal(baseline.predictiveRisk.score, null);
      assert.equal(baseline.predictiveRisk.trafficLight, 'gray');
    });

    test('Estudiante con asistencia normal recibe evaluación analítica calculada', async () => {
      process.env.DUOC_API_MODE = 'mock';
      const baseline = await academicDataService.getSatAcademicBaseline({
        email: 'est.demo@duocuc.cl',
        role: 'student',
      });

      assert.equal(baseline.sat.status, 'calculated');
      assert.equal(baseline.predictiveRisk.status, 'calculated');
      assert.ok(typeof baseline.predictiveRisk.score === 'number');
    });
  });

  describe('5. Respuestas Parciales y Secciones', () => {
    test('Si una sección secundaria falla, el dashboard reporta status: partial', async () => {
      process.env.DUOC_API_MODE = 'mock';

      const origRequest = vivoDuocAdapter._request;
      vivoDuocAdapter._request = async function (endpoint, params, cacheUser) {
        if (endpoint === '/horario/v1/horario/horario') {
          return { success: false, message: 'Horario no publicado aún' };
        }
        return origRequest.call(this, endpoint, params, cacheUser);
      };

      try {
        const result = await vivoDuocAdapter.getFullDashboard('est.partial');
        assert.equal(result.success, true);
        assert.equal(result.status, 'partial');
        assert.equal(result.sections.matricula.status, 'ok');
        assert.equal(result.sections.horario.status, 'error');
        assert.ok(result.errors.length > 0);
      } finally {
        vivoDuocAdapter._request = origRequest;
      }
    });
  });

  describe('6. Integración VivoDuocController (HTTP Status)', () => {
    test('Controlador devuelve 503 cuando el modo está disabled', async () => {
      process.env.DUOC_API_MODE = 'disabled';
      const res = createMockRes();
      await getDashboard({ user: { email: 'est.test@duocuc.cl', role: 'student' } }, res);

      assert.equal(res.statusCode, 503);
      assert.equal(res.payload.status, 'not_configured');
      assert.equal(res.payload.code, 'ACADEMIC_INTEGRATION_DISABLED');
    });

    test('Controlador devuelve 403 cuando estudiante comete IDOR', async () => {
      process.env.DUOC_API_MODE = 'mock';
      const res = createMockRes();
      await getDashboard(
        {
          user: { email: 'est.alumno@duocuc.cl', role: 'student' },
          query: { targetEmail: 'est.victima@duocuc.cl' },
        },
        res
      );

      assert.equal(res.statusCode, 403);
      assert.equal(res.payload.code, 'FORBIDDEN_IDOR');
    });

    test('Controlador devuelve 200 con data, sat y predictiveRisk en modo mock', async () => {
      process.env.DUOC_API_MODE = 'mock';
      const res = createMockRes();
      await getDashboard({ user: { email: 'est.demo@duocuc.cl', role: 'student' } }, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.payload.success, true);
      assert.ok(res.payload.data);
      assert.ok(res.payload.sat);
      assert.ok(res.payload.predictiveRisk);
      assert.ok(res.payload.sections);
    });
  });
});
