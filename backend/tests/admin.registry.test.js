const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { request, setBaseUrl } = require('./testHelper');

let server;
let baseUrl;

describe('AUDITORÍA ADMIN-REGISTRY: Registro Ley 21.719, Roles RBAC, CRUD Carreras/Sedes & Semáforo Predictivo', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
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

  const adminToken = jwt.sign(
    { id: 'seed_admin_c_guzman', email: 'c.guzman@duocuc.cl', role: 'admin', fullName: 'Cristian Guzmán' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );
  const coordinatorToken = jwt.sign(
    { id: 'seed_coord_paedis', email: 'coord.paedis@duoc.cl', role: 'coordinador_paedis', fullName: 'Coordinador PAEDIS' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );
  const studentToken = jwt.sign(
    { id: 'seed_est_m_contreras', email: 'm.contreras@duocuc.cl', role: 'estudiante', fullName: 'Matías Contreras' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const coordinatorHeaders = { Authorization: `Bearer ${coordinatorToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  test('1. Permisos Admin Panel: Administrador y Coordinador PAEDIS acceden, Estudiante es bloqueado (403)', async () => {
    const resAdmin = await request('/api/admin/metrics', { headers: adminHeaders });
    assert.equal(resAdmin.status, 200);

    const resCoord = await request('/api/admin/metrics', { headers: coordinatorHeaders });
    assert.equal(resCoord.status, 200);

    const resStudent = await request('/api/admin/metrics', { headers: studentHeaders });
    assert.equal(resStudent.status, 403);
  });

  test('2. Restricción Exclusiva: SOLO Administrador puede crear usuario con rol Administrador', async () => {
    // Coordinador intenta crear Administrador -> 403 Forbidden
    const coordCreateAdmin = await request('/api/admin/students', {
      method: 'POST',
      headers: coordinatorHeaders,
      body: {
        email: 'nuevo.admin.denegado@duocuc.cl',
        fullName: 'Intento de Admin por Coordinador',
        role: 'admin',
      },
    });
    assert.equal(coordCreateAdmin.status, 403);
    assert.match(coordCreateAdmin.body?.message, /Solo un Administrador/);

    // Administrador crea usuario estudiante con contraseña por defecto DuocYYYY! y Ley 21.719
    const testEmail = `test.estudiante.${Date.now()}@duocuc.cl`;
    const adminCreateStudent = await request('/api/admin/students', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        email: testEmail,
        fullName: 'Estudiante Nuevo Ley 21.719',
        role: 'estudiante_paedis',
        rut: '22.333.444-5',
        career: 'Ingeniería en Informática',
        campus: 'Sede Alameda',
        consentimientoLey21719: {
          aceptado: true,
          finalidadTratamiento: 'Gestión académica inclusiva Duoc UC',
        },
      },
    });
    assert.equal(adminCreateStudent.status, 201);
    assert.equal(adminCreateStudent.body?.success, true);
    assert.equal(adminCreateStudent.body?.user?.isPaedis, true);
  });

  test('3. Roles permitidos: Rechazar roles que no sean los 4 institucionales válidos', async () => {
    const invalidRoleRes = await request('/api/admin/students', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        email: `invalid.role.${Date.now()}@duocuc.cl`,
        fullName: 'Usuario Rol Invalido',
        role: 'tutor_externo_no_permitido',
      },
    });
    assert.equal(invalidRoleRes.status, 400);
    assert.match(invalidRoleRes.body?.message, /roles institucionales permitidos/);
  });

  test('4. Dynamic Careers CRUD: Listar, agregar y eliminar carreras', async () => {
    // Listar carreras (orden alfabético)
    const listRes = await request('/api/admin/careers', { headers: adminHeaders });
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body?.careers));
    assert.ok(listRes.body.careers.length > 20);

    // Coordinador no puede crear carrera (requireAdmin)
    const newCareerName = `Ingeniería Espacial y Satelital Duoc UC ${Date.now()}`;
    const deniedCreate = await request('/api/admin/careers', {
      method: 'POST',
      headers: coordinatorHeaders,
      body: { name: newCareerName, school: 'Escuela de Informática y Telecomunicaciones' },
    });
    assert.equal(deniedCreate.status, 403);

    // Crear carrera (Admin)
    const createRes = await request('/api/admin/careers', {
      method: 'POST',
      headers: adminHeaders,
      body: { name: newCareerName, school: 'Escuela de Informática y Telecomunicaciones' },
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body?.success, true);
    assert.equal(createRes.body?.career?.name, newCareerName);

    // Coordinador no puede eliminar carrera (requireAdmin)
    const deniedDelete = await request(`/api/admin/careers/${encodeURIComponent(newCareerName)}`, {
      method: 'DELETE',
      headers: coordinatorHeaders,
    });
    assert.equal(deniedDelete.status, 403);

    // Eliminar carrera
    const deleteRes = await request(`/api/admin/careers/${encodeURIComponent(newCareerName)}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body?.success, true);
  });

  test('5. Dynamic Sedes CRUD: Listar, agregar y eliminar sedes', async () => {
    // Listar sedes
    const listRes = await request('/api/admin/sedes', { headers: adminHeaders });
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body?.sedes));
    assert.ok(listRes.body.sedes.length >= 1);
    assert.ok(
      listRes.body.sedes.some((s) => s.name === 'Sede Alameda'),
      'Debe incluir Sede Alameda como sede oficial'
    );

    // Coordinador no puede crear sede (requireAdmin)
    const newSedeName = `Sede Antártica Chilena ${Date.now()}`;
    const deniedCreate = await request('/api/admin/sedes', {
      method: 'POST',
      headers: coordinatorHeaders,
      body: { name: newSedeName, city: 'Punta Arenas' },
    });
    assert.equal(deniedCreate.status, 403);

    // Crear sede (Admin)
    const createRes = await request('/api/admin/sedes', {
      method: 'POST',
      headers: adminHeaders,
      body: { name: newSedeName, city: 'Punta Arenas' },
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body?.success, true);
    assert.equal(createRes.body?.sede?.name, newSedeName);

    // Coordinador no puede eliminar sede (requireAdmin)
    const deniedDelete = await request(`/api/admin/sedes/${encodeURIComponent(newSedeName)}`, {
      method: 'DELETE',
      headers: coordinatorHeaders,
    });
    assert.equal(deniedDelete.status, 403);

    // Eliminar sede
    const deleteRes = await request(`/api/admin/sedes/${encodeURIComponent(newSedeName)}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body?.success, true);
  });

  test('6. Modelo Predictivo Duoc UC: Asistencia <70% es RI/Alto Riesgo, 70-75% Moderado, >75% Bajo', async () => {
    const studentsRes = await request('/api/admin/students', { headers: adminHeaders });
    assert.equal(studentsRes.status, 200);
    const students = studentsRes.body?.students || [];

    // Matías Contreras tiene < 70% de asistencia o asignaturas con RI -> ALTO / RI
    const matias = students.find((s) => s.email === 'm.contreras@duocuc.cl');
    assert.ok(matias);
    assert.equal(matias.prediction?.riskLevel, 'ALTO');
    assert.equal(matias.prediction?.trafficLight, 'red');
    assert.match(matias.prediction?.predictionLabel, /RI|Alto Riesgo/);

    // Cristian Guzmán tiene > 75% -> BAJO
    const cristian = students.find((s) => s.email === 'c.guzman@duocuc.cl');
    assert.ok(cristian);
    assert.equal(cristian.prediction?.riskLevel, 'BAJO');
    assert.equal(cristian.prediction?.trafficLight, 'green');

    // Juan Pérez está en deserción -> DESERTOR
    const juan = students.find((s) => s.email === 'j.perez@duocuc.cl');
    assert.ok(juan);
    assert.equal(juan.prediction?.riskLevel, 'DESERTOR');
    assert.equal(juan.prediction?.trafficLight, 'red');

    // Felipe Morales está titulado -> TITULADO
    const felipe = students.find((s) => s.email === 'f.morales@duocuc.cl');
    assert.ok(felipe);
    assert.equal(felipe.prediction?.riskLevel, 'TITULADO');
    assert.equal(felipe.prediction?.trafficLight, 'green');
  });

  test('7. Sistema de Alerta Temprana (SAT): Asistencia por ramo, simulación semanal SAP y Ficha 360', async () => {
    // 1. GET /api/admin/sat-alerts
    const satRes = await request('/api/admin/sat-alerts', { headers: coordinatorHeaders });
    assert.equal(satRes.status, 200);
    assert.equal(satRes.body?.success, true);
    assert.ok(satRes.body?.metrics);
    assert.ok(Array.isArray(satRes.body?.students));

    // Verificación de ordenación por severidad reglamentaria (Rojo -> Amarillo -> Verde)
    const riskPriorityMap = {
      LEVEL_2_CRITICAL: 1,
      LEVEL_1_PREVENTIVE: 2,
      PAEDIS_JUSTIFIED: 3,
      NONE: 4,
    };
    for (let i = 0; i < satRes.body.students.length - 1; i++) {
      const curr = riskPriorityMap[satRes.body.students[i].satEvaluation?.riskLevel] || 5;
      const next = riskPriorityMap[satRes.body.students[i + 1].satEvaluation?.riskLevel] || 5;
      assert.ok(
        curr <= next,
        `Estudiante ${satRes.body.students[i].fullName} (${curr}) debe tener mayor o igual prioridad que ${satRes.body.students[i + 1].fullName} (${next})`
      );
    }

    // Matías Contreras debe estar en LEVEL_2_CRITICAL
    const matias = satRes.body.students.find((s) => s.email === 'm.contreras@duocuc.cl');
    assert.ok(matias, 'Matías Contreras debe estar en el listado SAT');
    assert.equal(matias.satEvaluation?.riskLevel, 'LEVEL_2_CRITICAL');

    // 2. PATCH /api/admin/sat-alerts/:userId/simulate (Modo Simulación SAP)
    const simRes = await request(`/api/admin/sat-alerts/${matias.id || matias._id}/simulate`, {
      method: 'PATCH',
      headers: coordinatorHeaders,
      body: {
        courseCode: 'PWY2101',
        action: 'paedis_justify',
      },
    });
    assert.equal(simRes.status, 200);
    assert.equal(simRes.body?.success, true);

    // 3. PATCH /api/admin/sat-alerts/:userId/intervention (Ciclo cerrado: AGREEMENT y Tutor PAEDIS Asignado 'Sí')
    const intervRes = await request(`/api/admin/sat-alerts/${matias.id || matias._id}/intervention`, {
      method: 'PATCH',
      headers: coordinatorHeaders,
      body: {
        assignedTo: 'Coordinación PAEDIS Duoc UC',
        status: 'AGREEMENT',
        tutorPaedisAsignado: 'Sí',
        notes: 'Estudiante contactado telefónicamente y derivado a tutor PAEDIS para apoyo curricular.',
      },
    });
    assert.equal(intervRes.status, 200);
    assert.equal(intervRes.body?.success, true);
    assert.equal(intervRes.body?.student?.satIntervention?.status, 'AGREEMENT');
    assert.equal(intervRes.body?.student?.satIntervention?.tutorPaedisAsignado, 'Sí');
    assert.equal(intervRes.body?.student?.tutorPaedisAsignado, 'Sí');

    // 4. Transición de ciclo cerrado a RESOLVED y Tutor PAEDIS Asignado 'No'
    const resolveRes = await request(`/api/admin/sat-alerts/${matias.id || matias._id}/intervention`, {
      method: 'PATCH',
      headers: coordinatorHeaders,
      body: {
        status: 'RESOLVED',
        tutorPaedisAsignado: 'No',
        notes: 'Caso regularizado con asistencia sobre el 75%.',
      },
    });
    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.body?.student?.satIntervention?.status, 'RESOLVED');
    assert.equal(resolveRes.body?.student?.satIntervention?.tutorPaedisAsignado, 'No');
    assert.equal(resolveRes.body?.student?.tutorPaedisAsignado, 'No');
  });

  test('8. Centro de Operaciones PAEDIS: Gestión de Ajustes Razonables, Ficha Docente Confidencial (Ley 21.719) y permisos RBAC', async () => {
    const targetEmail = 'd.rojas@duocuc.cl';

    // 1. Estudiante NO puede modificar expedientes PAEDIS (403 Forbidden)
    const deniedRes = await request(`/api/admin/paedis/${encodeURIComponent(targetEmail)}/case`, {
      method: 'PATCH',
      headers: studentHeaders,
      body: { tutorParAsignado: 'Intento no autorizado' },
    });
    assert.equal(deniedRes.status, 403);

    // 2. Coordinador PAEDIS actualiza expediente, ajustes, notas confidenciales y emite Ficha Docente
    const updateRes = await request(`/api/admin/paedis/${encodeURIComponent(targetEmail)}/case`, {
      method: 'PATCH',
      headers: coordinatorHeaders,
      body: {
        barreraPaedis: 'Auditiva / LSCh',
        acreditacionPaedis: 'Credencial RND SENADIS / COMPIN',
        tutorParAsignado: 'Intérprete LSCh Institucional',
        diagnosticoDeclarado: 'Hipoacusia bilateral moderada',
        notasConfidencialesPaedis: 'Entrevista inicial completada. Solicita apoyo LSCh en evaluaciones.',
        ajustesAprobados: [
          {
            tipo: 'Intérprete de Señas (LSCh)',
            descripcion: 'Acompañamiento de intérprete en clases y certámenes.',
          },
          {
            tipo: 'Tiempo extendido +50%',
            descripcion: '50% de tiempo adicional en evaluaciones teóricas.',
          },
        ],
        fichaDocenteNotificada: true,
        acusesDocentes: [
          {
            sigla: 'PRY2101',
            nombre: 'Taller de Base de Datos',
            profesor: 'Docente Sede Alameda',
            confirmado: true,
          },
        ],
      },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body?.success, true);
    assert.equal(updateRes.body?.student?.tutorParAsignado, 'Intérprete LSCh Institucional');
    assert.equal(updateRes.body?.student?.fichaDocenteNotificada, true);
    assert.equal(updateRes.body?.student?.ajustesAprobados?.length, 2);
    assert.equal(
      updateRes.body?.student?.notasConfidencialesPaedis,
      'Entrevista inicial completada. Solicita apoyo LSCh en evaluaciones.'
    );
    assert.equal(updateRes.body?.student?.acusesDocentes?.[0]?.confirmado, true);

    // 3. Verificar integración en Frontend AdminPanelView y PaedisCaseManagementSection
    const paedisCompPath = path.resolve(
      __dirname,
      '../../frontend/src/components/admin/PaedisCaseManagementSection.jsx'
    );
    const adminViewPath = path.resolve(
      __dirname,
      '../../frontend/src/components/views/AdminPanelView.jsx'
    );
    assert.ok(fs.existsSync(paedisCompPath), 'PaedisCaseManagementSection.jsx debe existir');
    const adminViewCode = fs.readFileSync(adminViewPath, 'utf8');
    assert.ok(adminViewCode.includes('PaedisCaseManagementSection'));
    assert.ok(adminViewCode.includes('Gestión PAEDIS & Ajustes'));
  });

  test('9. Registro Institucional: Nombres separados, Contraseña inicial (RUT + inicial apellido), Dominio institucional, Perfil PAEDIS automático y Correo de bienvenida', async () => {
    const emailService = require('../services/emailService');
    const prevOutboxCount = emailService.getOutbox().length;

    // 1. Registro de estudiante PAEDIS con nombres separados y dominio @duocuc.cl
    const studentRes = await request('/api/admin/students', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        firstName: 'Valentina',
        paternalLastName: 'Salazar',
        maternalLastName: 'Rojas',
        emailLocal: 'v.salazar',
        emailDomain: 'duocuc.cl',
        rut: '20.654.321-K',
        career: 'Ingeniería en Informática',
        campus: 'Sede Alameda',
        isPaedis: true,
        disabilityProfile: 'baja_vision',
      },
    });

    assert.equal(studentRes.status, 201);
    assert.equal(studentRes.body?.success, true);
    assert.equal(studentRes.body?.user?.fullName, 'Valentina Salazar Rojas');
    assert.equal(studentRes.body?.user?.email, 'v.salazar@duocuc.cl');
    assert.equal(studentRes.body?.user?.isPaedis, true);
    assert.equal(studentRes.body?.user?.disabilityProfile, 'baja_vision');
    assert.equal(studentRes.body?.user?.accessibilityPreferences?.highContrast, true);

    // 2. Verificar que se envió correo de bienvenida y se registró en outbox
    const currentOutbox = emailService.getOutbox();
    assert.ok(currentOutbox.length > prevOutboxCount, 'Debe registrarse correo de bienvenida en outbox');
    const latestMail = currentOutbox[currentOutbox.length - 1];
    assert.ok(latestMail.subject.includes('Bienvenido/a a Nexo360'));

    // 3. Login con contraseña inicial autogenerada: 20654321ks (RUT limpio + 's' de Salazar)
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'v.salazar@duocuc.cl',
        password: '20654321ks',
      },
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body?.user?.email, 'v.salazar@duocuc.cl');
    assert.equal(loginRes.body?.user?.mustChangePassword, true);

    // 4. Registro de funcionario (@profesor.duoc.cl) sin carrera obligatoria
    const staffRes = await request('/api/admin/students', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        firstName: 'Andrés',
        paternalLastName: 'Navarro',
        emailLocal: 'a.navarro',
        emailDomain: 'profesor.duoc.cl',
        rut: '16.789.012-3',
        role: 'coordinador_paedis',
        campus: 'Sede Alameda',
      },
    });
    assert.equal(staffRes.status, 201);
    assert.equal(staffRes.body?.user?.role, 'coordinador_paedis');
    assert.equal(staffRes.body?.user?.career || '', '');
  });

  test('10. Separación estricta de permisos RBAC: Coordinador PAEDIS vs Administrador TI', async () => {
    // 1. Coordinador PAEDIS recibe 403 al intentar eliminar un usuario
    const coordDeleteRes = await request('/api/admin/students/target_student_to_delete', {
      method: 'DELETE',
      headers: coordinatorHeaders,
    });
    assert.equal(coordDeleteRes.status, 403);
    assert.match(coordDeleteRes.body?.message, /Administrador/i);

    // 2. Coordinador PAEDIS recibe 403 al intentar importar ramos
    const coordImportRes = await request('/api/admin/courses/import', {
      method: 'POST',
      headers: coordinatorHeaders,
      body: { rows: [] },
    });
    assert.equal(coordImportRes.status, 403);
    assert.match(coordImportRes.body?.message, /Administrador/i);

    // 3. Coordinador PAEDIS recibe 403 al intentar crear un usuario staff/admin
    const coordCreateStaffRes = await request('/api/admin/students', {
      method: 'POST',
      headers: coordinatorHeaders,
      body: {
        email: `staff.coord.denegado.${Date.now()}@profesor.duoc.cl`,
        fullName: 'Profesor Intento Denegado',
        role: 'coordinador_paedis',
        rut: '17.888.999-0',
        campus: 'Sede Alameda',
      },
    });
    assert.equal(coordCreateStaffRes.status, 403);
    assert.match(
      coordCreateStaffRes.body?.message,
      /Coordinador PAEDIS solo tiene autorización para registrar cuentas de estudiantes/i
    );

    // 4. Administrador TI recibe 403 al intentar editar un expediente confidencial PAEDIS
    const adminEditPaedisRes = await request('/api/admin/paedis/d.rojas@duocuc.cl/case', {
      method: 'PATCH',
      headers: adminHeaders,
      body: {
        notasConfidencialesPaedis: 'Intento de edición por Administrador TI',
      },
    });
    assert.equal(adminEditPaedisRes.status, 403);
    assert.match(adminEditPaedisRes.body?.message, /Coordinador PAEDIS/i);

    // 5. Ley N° 21.719: Admin recibe lista de estudiantes con datos clínicos omitidos/enmascarados
    const adminGetStudentsRes = await request('/api/admin/students', {
      headers: adminHeaders,
    });
    assert.equal(adminGetStudentsRes.status, 200);
    const adminStudents = adminGetStudentsRes.body?.students || [];
    assert.ok(adminStudents.length > 0);
    adminStudents.forEach((student) => {
      assert.equal(student.diagnosticoDeclarado, undefined);
      assert.equal(student.notasConfidencialesPaedis, undefined);
      assert.equal(student.acreditacionPaedis, undefined);
      assert.equal(typeof student.isPaedis, 'boolean');
    });

    // 6. Ley N° 21.719: Coordinador PAEDIS sí puede consultar datos clínicos completos
    const coordGetStudentsRes = await request('/api/admin/students', {
      headers: coordinatorHeaders,
    });
    assert.equal(coordGetStudentsRes.status, 200);
    assert.ok(coordGetStudentsRes.body?.students?.length > 0);
  });
});
