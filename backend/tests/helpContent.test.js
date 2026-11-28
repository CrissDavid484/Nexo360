/**
 * PRUEBAS AUTOMATIZADAS DE GESTIÓN EDITORIAL DE CONTENIDOS (ÉPICA E-005)
 * Ejecutada con: node --test backend/tests/helpContent.test.js
 *
 * Cobertura:
 * 1. Sembrado e ingesta inicial idempotente desde institutionalModules.json.
 * 2. Consulta pública de trámites publicados con agrupación de categorías.
 * 3. Segregación de borradores (drafts) y archivados (archived) fuera de la vista de estudiantes.
 * 4. Creación administrativa de trámites con versionamiento inicial (v1).
 * 5. Modificación editorial con incremento de versión y guardado de instantánea inmutable en versionHistory.
 * 6. Transición del ciclo de vida editorial (draft -> published -> archived).
 * 7. Reversión histórica (rollback) a versiones anteriores.
 * 8. Control de acceso RBAC: estudiantes reciben 403 en rutas administrativas editoriales.
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../server');
const helpContentService = require('../services/helpContentService');
const authService = require('../services/authService');

const JWT_SECRET = process.env.JWT_SECRET || 'nexo360_duoc_paedis_secret_key_wcag_2026';

function generateTestToken(user) {
  return jwt.sign(
    {
      id: user.id || 'test_user_id',
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      tokenVersion: 0,
    },
    JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: 'nexo360-api',
      audience: 'nexo360-client',
    }
  );
}

const ADMIN_USER = {
  id: 'admin_123',
  email: 'admin.editor@duoc.cl',
  role: 'admin',
  permissions: ['full_access', 'manage_catalogs', 'manage_users', 'manage_help_content'],
};

const COORD_USER = {
  id: 'coord_456',
  email: 'coord.paedis@duoc.cl',
  role: 'coordinador_paedis',
  permissions: ['manage_help_content', 'paedis_read', 'paedis_write'],
};

const TEACHER_USER = {
  id: 'prof_1',
  email: 'profesor@duocuc.cl',
  role: 'profesor',
  permissions: ['class_management'],
};

const STUDENT_USER = {
  id: 'student_123',
  email: 't.montes@duocuc.cl',
  role: 'estudiante',
  permissions: [],
};

describe('Épica E-005: Sistema de Gestión Editorial de Contenidos (HelpContentService)', () => {
  before(async () => {
    authService.registerUser(ADMIN_USER);
    authService.registerUser(COORD_USER);
    authService.registerUser(TEACHER_USER);
    authService.registerUser(STUDENT_USER);
    await helpContentService.ensureSeedProcedures();
  });

  test('1. Sembrado idempotente carga más de 10 trámites desde institutionalModules.json', async () => {
    const categories = await helpContentService.getPublishedCategories();
    assert.ok(categories.length >= 5, 'Debe haber al menos 5 categorías publicadas');
    const totalSubmodules = categories.reduce((acc, cat) => acc + (cat.submodules?.length || 0), 0);
    assert.ok(totalSubmodules >= 10, 'Debe haber al menos 10 trámites sembrados');
  });

  test('2. Consulta pública /api/modules devuelve trámites publicados con estructura estándar', async () => {
    const categories = await helpContentService.getPublishedCategories();
    const firstCat = categories[0];
    assert.ok(firstCat.categoryKey);
    assert.ok(firstCat.categoryTitle);
    assert.ok(Array.isArray(firstCat.submodules));
    assert.ok(firstCat.submodules[0].requirements.length > 0);
    assert.ok(firstCat.submodules[0].steps.length > 0);
  });

  test('3. Creación editorial de trámite en borrador (draft) no es visible públicamente', async () => {
    const draftData = {
      procedureId: 'tramite-borrador-test',
      categoryKey: 'beneficios-estudiantiles',
      categoryTitle: 'Beneficios Estudiantiles',
      title: 'Trámite Confidencial en Borrador',
      description: 'Descripción del trámite en desarrollo editorial.',
      status: 'draft',
      requirements: ['Requisito borrador 1'],
      steps: [{ stepNumber: 1, title: 'Paso 1', instruction: 'Hacer clic en borrador' }],
    };

    const created = await helpContentService.createProcedure(draftData, ADMIN_USER);
    assert.equal(created.procedureId, 'tramite-borrador-test');
    assert.equal(created.status, 'draft');
    assert.equal(created.version, 1);

    // Comprobar que NO aparece en la lista de categorías públicas
    const publishedCats = await helpContentService.getPublishedCategories();
    const allPublishedSubIds = publishedCats.flatMap((c) => c.submodules.map((s) => s.id));
    assert.ok(
      !allPublishedSubIds.includes('tramite-borrador-test'),
      'Los trámites en estado draft no deben listarse en el Centro de Ayuda público'
    );
  });

  test('4. Modificación editorial incrementa versión y almacena instantánea en versionHistory', async () => {
    const updated = await helpContentService.updateProcedure(
      'tramite-borrador-test',
      {
        description: 'Descripción modificada para versión 2.',
        changeSummary: 'Se ajustó la descripción del trámite.',
      },
      ADMIN_USER
    );

    assert.equal(updated.version, 2);
    assert.equal(updated.description, 'Descripción modificada para versión 2.');
    assert.equal(updated.versionHistory.length, 1);
    assert.equal(updated.versionHistory[0].version, 1);
    assert.equal(updated.versionHistory[0].snapshotData.description, 'Descripción del trámite en desarrollo editorial.');
  });

  test('5. Publicación de trámite lo hace inmediatamente visible para estudiantes', async () => {
    const published = await helpContentService.setProcedureStatus('tramite-borrador-test', 'published', ADMIN_USER);
    assert.equal(published.status, 'published');
    assert.equal(published.version, 3);
    assert.ok(published.publishedAt);

    const publishedCats = await helpContentService.getPublishedCategories();
    const allPublishedSubIds = publishedCats.flatMap((c) => c.submodules.map((s) => s.id));
    assert.ok(
      allPublishedSubIds.includes('tramite-borrador-test'),
      'El trámite publicado debe aparecer en el Centro de Ayuda público'
    );
  });

  test('6. Reversión histórica (rollback) restaura contenidos de versión anterior', async () => {
    const rolledBack = await helpContentService.rollbackProcedureVersion('tramite-borrador-test', 1, ADMIN_USER);
    assert.equal(rolledBack.description, 'Descripción del trámite en desarrollo editorial.');
    assert.equal(rolledBack.version, 4);
    assert.ok(rolledBack.versionHistory.length >= 2);
  });

  test('7. Archivar trámite lo retira de la vista pública pero lo preserva administrativamente', async () => {
    const archived = await helpContentService.setProcedureStatus('tramite-borrador-test', 'archived', ADMIN_USER);
    assert.equal(archived.status, 'archived');

    const publishedCats = await helpContentService.getPublishedCategories();
    const allPublishedSubIds = publishedCats.flatMap((c) => c.submodules.map((s) => s.id));
    assert.ok(
      !allPublishedSubIds.includes('tramite-borrador-test'),
      'El trámite archivado no debe listarse públicamente'
    );

    const adminList = await helpContentService.getAllProceduresAdmin({ status: 'archived' });
    const foundArchived = adminList.find((p) => p.procedureId === 'tramite-borrador-test');
    assert.ok(foundArchived, 'El trámite archivado debe seguir existiendo en el panel administrativo');
  });

  test('8. Control RBAC: Estudiante no puede acceder a endpoints administrativos de contenido', async () => {
    const studentToken = generateTestToken(STUDENT_USER);

    // Simular llamada HTTP al endpoint de administración editorial
    const { getResponse } = createHttpCallMock(app);
    const res = await getResponse('POST', '/api/modules/admin/procedure', {
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { procedureId: 'malicious', title: 'Intento de escalación' },
    });

    assert.equal(res.statusCode, 403, 'Estudiante sin permisos debe recibir 403 Forbidden');
  });

  test('9. HTTP Operaciones: Admin crea procedimiento por POST /api/modules/admin/procedure (201)', async () => {
    const adminToken = generateTestToken(ADMIN_USER);
    const { getResponse } = createHttpCallMock(app);

    const res = await getResponse('POST', '/api/modules/admin/procedure', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        procedureId: 'tramite-http-test',
        title: 'Trámite HTTP Integración',
        categoryTitle: 'Financiamiento',
        categoryKey: 'financiamiento',
        description: 'Trámite probado mediante llamada HTTP integral.',
        status: 'draft',
        requirements: ['Cédula de identidad', 'Certificado socioeconómico'],
        steps: [
          'Paso 1: Ingresar a la plataforma',
          'Paso 2: Adjuntar antecedentes',
          'Paso 3: Esperar validación',
        ],
        estimatedDays: 5,
      },
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.success, true);
    assert.equal(res.payload.data.procedureId, 'tramite-http-test');
    assert.equal(res.payload.data.steps.length, 3);
    assert.equal(res.payload.data.steps[0].title, 'Paso 1');
    assert.equal(res.payload.data.steps[0].instruction, 'Ingresar a la plataforma');
    assert.notEqual(res.payload.data.steps[0].title, '[object Object]');
  });

  test('10. HTTP Lectura: Coordinador PAEDIS con manage_help_content consulta GET /api/modules/admin/all (200)', async () => {
    const coordToken = generateTestToken(COORD_USER);
    const { getResponse } = createHttpCallMock(app);

    const res = await getResponse('GET', '/api/modules/admin/all', {
      headers: { Authorization: `Bearer ${coordToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.success, true);
    assert.ok(Array.isArray(res.payload.data));
    assert.ok(res.payload.data.length >= 1);
  });

  test('11. HTTP Edición y Versionado: PUT /api/modules/admin/procedure/:id incrementa versión a 2', async () => {
    const adminToken = generateTestToken(ADMIN_USER);
    const { getResponse } = createHttpCallMock(app);

    const res = await getResponse('PUT', '/api/modules/admin/procedure/tramite-http-test', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Trámite HTTP Integración Actualizado',
        description: 'Descripción actualizada vía PUT.',
        changeSummary: 'Ajuste de descripción y requisitos',
        requirements: ['Cédula al día'],
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.success, true);
    assert.equal(res.payload.data.version, 2);
    assert.equal(res.payload.data.title, 'Trámite HTTP Integración Actualizado');
  });

  test('12. HTTP Ciclo Editorial: PATCH status a published (200) y rechazo de estado inválido (400)', async () => {
    const adminToken = generateTestToken(ADMIN_USER);
    const { getResponse } = createHttpCallMock(app);

    // Estado válido
    const resPub = await getResponse('PATCH', '/api/modules/admin/procedure/tramite-http-test/status', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'published' },
    });
    assert.equal(resPub.statusCode, 200);
    assert.equal(resPub.payload.data.status, 'published');

    // Estado inválido
    const resBad = await getResponse('PATCH', '/api/modules/admin/procedure/tramite-http-test/status', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'invalido_random' },
    });
    assert.equal(resBad.statusCode, 400);
    assert.equal(resBad.payload.success, false);
  });

  test('13. HTTP Rollback: POST /rollback/1 restaura versión inicial v1 preservando historial', async () => {
    const adminToken = generateTestToken(ADMIN_USER);
    const { getResponse } = createHttpCallMock(app);

    const res = await getResponse('POST', '/api/modules/admin/procedure/tramite-http-test/rollback/1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.success, true);
    assert.equal(res.payload.data.title, 'Trámite HTTP Integración');
    assert.ok(res.payload.data.version >= 3, 'El rollback debe registrarse como nueva versión');
  });

  test('14. HTTP Seguridad: Docente recibe 403 y llamada sin token recibe 401', async () => {
    const teacherToken = generateTestToken(TEACHER_USER);
    const { getResponse } = createHttpCallMock(app);

    // Con token de profesor (sin permisos editoriales)
    const resTeacher = await getResponse('GET', '/api/modules/admin/all', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.equal(resTeacher.statusCode, 403);

    // Sin token
    const resNoAuth = await getResponse('GET', '/api/modules/admin/all');
    assert.equal(resNoAuth.statusCode, 401);
  });
});

function createHttpCallMock(expressApp) {
  return {
    async getResponse(method, path, { headers = {}, body = null } = {}) {
      return new Promise((resolve) => {
        const normalizedHeaders = {};
        for (const [k, v] of Object.entries(headers)) {
          normalizedHeaders[k.toLowerCase()] = v;
        }
        const req = {
          method,
          url: path,
          headers: {
            host: 'localhost:5000',
            'content-type': 'application/json',
            ...normalizedHeaders,
          },
          body: body || {},
        };

        const res = {
          statusCode: 200,
          payload: null,
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(data) {
            this.payload = data;
            resolve({ statusCode: this.statusCode, payload: this.payload });
            return this;
          },
          send(data) {
            this.payload = data;
            resolve({ statusCode: this.statusCode, payload: this.payload });
            return this;
          },
          setHeader() {},
          getHeader() {},
        };

        expressApp.handle(req, res, () => {
          resolve({ statusCode: 404, payload: null });
        });
      });
    },
  };
}
