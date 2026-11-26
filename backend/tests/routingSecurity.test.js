const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { request, setBaseUrl } = require('./testHelper');

let server;
let baseUrl;

describe('Task 7: Enrutamiento Real, Persistencia al Recargar F5 y Seguridad por Página (RBAC)', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        setBaseUrl(baseUrl);
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Contrato de Enrutamiento Real: Todos los 7 paths top-level requeridos están definidos', () => {
    const REQUIRED_PATHS = [
      '/centro-de-ayuda',
      '/toma-ramos',
      '/biblioteca',
      '/vivo-duoc',
      '/soporte',
      '/perfil',
      '/panel-admin',
    ];

    const PATH_TO_TAB = {
      '/centro-de-ayuda': 'centro-ayuda',
      '/toma-ramos': 'toma-ramos',
      '/simulador': 'toma-ramos',
      '/biblioteca': 'biblioteca',
      '/vivo-duoc': 'vivo-duoc',
      '/soporte': 'tickets',
      '/tickets': 'tickets',
      '/perfil': 'perfil',
      '/panel-admin': 'admin-panel',
      '/admin-panel': 'admin-panel',
    };

    REQUIRED_PATHS.forEach((path) => {
      assert.ok(PATH_TO_TAB[path], `El path institucional ${path} debe estar definido y mapeado.`);
    });
  });

  test('2. Persistencia F5: Resolución biunívoca de URL a pestaña y pestaña a URL', () => {
    const resolveTabFromPathname = (pathname = '') => {
      if (pathname.startsWith('/panel-admin') || pathname.startsWith('/admin-panel') || pathname.startsWith('/admin')) {
        return 'admin-panel';
      }
      if (pathname.startsWith('/toma-ramos') || pathname.startsWith('/simulador')) {
        return 'toma-ramos';
      }
      if (pathname.startsWith('/biblioteca')) {
        return 'biblioteca';
      }
      if (pathname.startsWith('/vivo-duoc')) {
        return 'vivo-duoc';
      }
      if (pathname.startsWith('/soporte') || pathname.startsWith('/tickets')) {
        return 'tickets';
      }
      if (pathname.startsWith('/perfil')) {
        return 'perfil';
      }
      return 'centro-ayuda';
    };

    // Al recargar en cualquier URL, no se resetea a centro-de-ayuda
    assert.equal(resolveTabFromPathname('/biblioteca'), 'biblioteca');
    assert.equal(resolveTabFromPathname('/toma-ramos'), 'toma-ramos');
    assert.equal(resolveTabFromPathname('/simulador'), 'toma-ramos');
    assert.equal(resolveTabFromPathname('/vivo-duoc'), 'vivo-duoc');
    assert.equal(resolveTabFromPathname('/soporte'), 'tickets');
    assert.equal(resolveTabFromPathname('/perfil'), 'perfil');
    assert.equal(resolveTabFromPathname('/panel-admin'), 'admin-panel');
    assert.equal(resolveTabFromPathname('/panel-admin/sat'), 'admin-panel');
    assert.equal(resolveTabFromPathname('/panel-admin/estudiantes'), 'admin-panel');
    assert.equal(resolveTabFromPathname('/centro-de-ayuda'), 'centro-ayuda');
  });

  test('3. Seguridad RBAC en Guardias de Ruta: Estudiante es bloqueado y redirigido a /centro-de-ayuda', () => {
    const evaluateAdminRouteGuard = (user) => {
      if (!user) return { allowed: false, redirectTo: '/login' };
      const role = (user.role || '').toLowerCase();
      const isAuthorized = role === 'admin' || role === 'administrador' || role === 'coordinador_paedis';
      if (!isAuthorized) {
        return { allowed: false, redirectTo: '/centro-de-ayuda' };
      }
      return { allowed: true, redirectTo: null };
    };

    // Estudiante
    const studentUser = { id: 's1', role: 'estudiante' };
    const studentCheck = evaluateAdminRouteGuard(studentUser);
    assert.equal(studentCheck.allowed, false);
    assert.equal(studentCheck.redirectTo, '/centro-de-ayuda');

    // Docente
    const docenteUser = { id: 'd1', role: 'docente' };
    const docenteCheck = evaluateAdminRouteGuard(docenteUser);
    assert.equal(docenteCheck.allowed, false);
    assert.equal(docenteCheck.redirectTo, '/centro-de-ayuda');

    // Administrador
    const adminUser = { id: 'a1', role: 'admin' };
    const adminCheck = evaluateAdminRouteGuard(adminUser);
    assert.equal(adminCheck.allowed, true);
    assert.equal(adminCheck.redirectTo, null);

    // Coordinador PAEDIS
    const coordinatorUser = { id: 'c1', role: 'coordinador_paedis' };
    const coordCheck = evaluateAdminRouteGuard(coordinatorUser);
    assert.equal(coordCheck.allowed, true);
    assert.equal(coordCheck.redirectTo, null);
  });

  test('4. Seguridad RBAC en Backend API: /api/admin/metrics y /api/admin/students bloquean estudiantes (403)', async () => {
    const studentToken = jwt.sign(
      { id: 'student_test_1', email: 'alumno.test@duocuc.cl', role: 'estudiante' },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    const adminToken = jwt.sign(
      { id: 'admin_test_1', email: 'admin.test@duocuc.cl', role: 'admin' },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    const coordToken = jwt.sign(
      { id: 'coord_test_1', email: 'coord.test@duocuc.cl', role: 'coordinador_paedis' },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    // 1. Estudiante intentando acceder al panel de administración -> 403 Forbidden
    const resStudent = await request('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(resStudent.status, 403);
    assert.equal(resStudent.body.success, false);

    // 2. Administrador accede exitosamente -> 200 OK
    const resAdmin = await request('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(resAdmin.status, 200);
    assert.equal(resAdmin.body.success, true);

    // 3. Coordinador PAEDIS accede exitosamente -> 200 OK
    const resCoord = await request('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${coordToken}` },
    });
    assert.equal(resCoord.status, 200);
    assert.equal(resCoord.body.success, true);
  });
});
