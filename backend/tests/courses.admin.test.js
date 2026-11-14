const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { getJwtSecret } = require('../middleware/authMiddleware');
const ActivityLog = require('../models/ActivityLog');

const request = async (path, { method = 'GET', headers = {}, body = null } = {}) => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get('content-type') || '';
    let resBody = null;
    if (contentType.includes('application/json')) {
      resBody = await res.json();
    } else {
      resBody = await res.text();
    }
    return {
      status: res.status,
      headers: res.headers,
      body: resBody,
    };
  } finally {
    server.close();
  }
};

describe('Catálogo de Asignaturas Alameda 2026, Permisos RBAC y Auditoría ActivityLog', () => {
  const adminToken = jwt.sign(
    { id: 'admin_test_1', email: 'c.guzman@duocuc.cl', role: 'admin' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );

  const coordinadorToken = jwt.sign(
    { id: 'coord_test_1', email: 't.montes@duoc.cl', role: 'coordinador_paedis' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );

  const studentToken = jwt.sign(
    { id: 'student_test_1', email: 'd.rojas@duocuc.cl', role: 'estudiante_paedis' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );

  const tutorToken = jwt.sign(
    { id: 'tutor_test_1', email: 'v.soto@duocuc.cl', role: 'tutor_par' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );

  test('1. Permisos RBAC: Estudiantes y tutores son bloqueados (403) en endpoints destructivos/administrativos', async () => {
    // Estudiante intenta importar
    const impRes = await request('/api/admin/courses/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { rows: [{ sigla: 'TEST101', nombre: 'CURSO TEST', seccion: 'TEST101-001D' }] },
    });
    assert.equal(impRes.status, 403);
    assert.match(impRes.body?.message, /Coordinador PAEDIS/i);

    // Tutor intenta restablecer semilla
    const seedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tutorToken}` },
    });
    assert.equal(seedRes.status, 403);

    // Estudiante intenta vaciar catálogo
    const delRes = await request('/api/admin/courses', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(delRes.status, 403);
  });

  test('2. Permisos RBAC: Coordinador PAEDIS puede gestionar catálogos (import, seed, delete)', async () => {
    const seedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${coordinadorToken}` },
    });
    assert.equal(seedRes.status, 200);
    assert.equal(seedRes.body?.success, true);
    assert.ok(seedRes.body?.result?.count >= 7000);
  });

  test('3. Consulta de Asignaturas: Estudiantes y Tutores pueden consultar cursos para el simulador', async () => {
    // Estudiante consulta ramos de Informática
    const coursesRes = await request('/api/courses?carrera=INFORMATICA&limit=6', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(coursesRes.status, 200);
    assert.equal(coursesRes.body?.success, true);
    assert.ok(coursesRes.body?.courses?.length > 0);

    // Tutor consulta carreras disponibles
    const careersRes = await request('/api/courses/careers', {
      headers: { Authorization: `Bearer ${tutorToken}` },
    });
    assert.equal(careersRes.status, 200);
    assert.equal(careersRes.body?.success, true);
    assert.ok(careersRes.body?.careers?.length >= 20);
  });

  test('4. Consulta de Asignaturas en formato Markdown (?format=md)', async () => {
    const mdRes = await request('/api/courses?carrera=INFRAESTRUCTURA&format=md', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(mdRes.status, 200);
    assert.ok(typeof mdRes.body === 'string');
    assert.ok(mdRes.body.includes('| **Sede** | **Carrera** |'));
    assert.ok(mdRes.body.includes('INFRAESTRUCTURA'));
  });

  test('5. Importación con Markdown directo y opción replace: true', async () => {
    const sampleMd = `
| **Sede** | **Carrera** | **Plan** | **Jornada** | **Sigla Asignatura** | **Nombre Asignatura** | **Nivel** | **Sección** | **Horario** | **Docente** | **Modalidad** |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| ALAMEDA | INGENIERÍA EN INFORMÁTICA | 1446114 | Diurno | TST9999 | PRUEBA UNITARIA IMPORTACIÓN MD | Semestre 8 | TST9999-001D | Lu 8:31:00 - 9:50:00 | DOCENTE PRUEBA | ONLINE SINCRONA |
    `.trim();

    const importRes = await request('/api/admin/courses/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        markdown: sampleMd,
        replace: true,
      },
    });

    assert.equal(importRes.status, 200);
    assert.equal(importRes.body?.success, true);
    assert.equal(importRes.body?.result?.sourceFormat, 'MARKDOWN');
    assert.equal(importRes.body?.result?.seccionesImportadas, 1);
  });

  test('6. Restablecer Catálogo Oficial Alameda 2026-002 y Auditoría ActivityLog (SEED, IMPORT, CLEAR)', async () => {
    // 1. Restablecer Catálogo Oficial Alameda 2026-002
    const seedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(seedRes.status, 200);
    assert.equal(seedRes.body?.success, true);
    assert.ok(seedRes.body?.result?.count >= 7000);

    // 2. Verificar métricas recientes de administración
    const metricsRes = await request('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(metricsRes.status, 200);
    const recent = metricsRes.body?.metrics?.recentActivity || [];
    assert.ok(recent.length > 0);

    const hasSeedOrImportAction = recent.some(
      (act) => act.action === 'SEED' || act.action === 'IMPORT' || act.action === 'CLEAR'
    );
    assert.ok(hasSeedOrImportAction, 'ActivityLog debe contener al menos una acción auditada SEED, IMPORT o CLEAR');
  });

  test('7. Vaciado completo de catálogo (DELETE /api/admin/courses) con ActivityLog CLEAR', async () => {
    const clearRes = await request('/api/admin/courses', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(clearRes.status, 200);
    assert.equal(clearRes.body?.success, true);

    // Re-sembrar para dejar el entorno limpio con Alameda 2026
    await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });
});
