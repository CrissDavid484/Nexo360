const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');
const authService = require('../services/authService');
const { request, setBaseUrl } = require('./testHelper');

let server;

describe('Catálogo de Asignaturas Alameda 2026, Permisos RBAC y Auditoría ActivityLog', () => {
  before(async () => {
    authService.registerUser({
      _id: 'seed_tutor_v_soto',
      email: 'v.soto@duoc.cl',
      fullName: 'Valentina Soto',
      role: 'tutor_par',
      tokenVersion: 0,
    });
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        setBaseUrl(`http://127.0.0.1:${server.address().port}`);
        resolve();
      });
    });
  });

  after(async () => {
    authService.removeUserFromMemory('v.soto@duoc.cl');
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  const adminToken = authService.generateJwt({
    id: 'seed_admin_c_guzman',
    email: 'c.guzman@duocuc.cl',
    role: 'admin',
    tokenVersion: 0,
  });

  const coordinadorToken = authService.generateJwt({
    id: 'seed_coord_paedis',
    email: 'coord.paedis@duoc.cl',
    role: 'coordinador_paedis',
    tokenVersion: 0,
  });

  const studentToken = authService.generateJwt({
    id: 'seed_est_d_rojas',
    email: 'd.rojas@duocuc.cl',
    role: 'estudiante_paedis',
    tokenVersion: 0,
  });

  const tutorToken = authService.generateJwt({
    id: 'seed_tutor_v_soto',
    email: 'v.soto@duoc.cl',
    role: 'tutor_par',
    tokenVersion: 0,
  });

  test('1. Permisos RBAC: Estudiantes y tutores son bloqueados (403) en endpoints destructivos/administrativos', async () => {
    const impRes = await request('/api/admin/courses/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { rows: [{ sigla: 'TEST101', nombre: 'CURSO TEST', seccion: 'TEST101-001D' }] },
    });
    assert.equal(impRes.status, 403);
    assert.match(impRes.body?.message, /Administrador/i);

    const seedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tutorToken}` },
    });
    assert.equal(seedRes.status, 403);

    const delRes = await request('/api/admin/courses', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(delRes.status, 403);
  });

  test('2. Permisos RBAC: Coordinador PAEDIS es bloqueado en seed de cursos (403), solo Administrador puede', async () => {
    const coordSeedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${coordinadorToken}` },
    });
    assert.equal(coordSeedRes.status, 403);

    const adminSeedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminSeedRes.status, 200);
    assert.equal(adminSeedRes.body?.success, true);
    assert.ok(adminSeedRes.body?.result?.count >= 7000);
  });

  test('3. Consulta de Asignaturas: Estudiantes y Tutores pueden consultar cursos para el simulador', async () => {
    const coursesRes = await request('/api/courses?carrera=INFORMATICA&limit=6', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(coursesRes.status, 200);
    assert.equal(coursesRes.body?.success, true);
    assert.ok(coursesRes.body?.courses?.length > 0);

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
    const seedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(seedRes.status, 200);
    assert.equal(seedRes.body?.success, true);
    assert.ok(seedRes.body?.result?.count >= 7000);

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

    const reseedRes = await request('/api/admin/courses/seed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(reseedRes.status, 200);
    assert.equal(reseedRes.body?.success, true);
  });
});
