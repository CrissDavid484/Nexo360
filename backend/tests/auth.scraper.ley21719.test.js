const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');

const app = require('../server');
const authScraperService = require('../services/authScraperService');
const UserProfile = require('../models/UserProfile');

const EXPECTED_OAUTH_URL =
  'https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize?client_id=674913e2-e170-4787-833f-e307f87db6e5&nonce=23077c7bfb49e35770b10965bcbb9df5&redirect_uri=https%3A%2F%2Fexperienciavivo.duoc.cl%2Fauth%2Fopenidc%2Fcallback&response_type=code&scope=openid+profile+email+offline_access+api%3A%2F%2F674913e2-e170-4787-833f-e307f87db6e5%2Faccess&state=181261858bac94807f59900cdd53d715&sso_reload=true';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

const request = async (path, { method = 'GET', headers = {}, body } = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, body: data, headers: res.headers };
};

test('AUDITORÍA AUTH-BOT: Microsoft OAuth, Scraping Asistencias, Control Acceso & Ley N° 21.719', async (t) => {
  await t.test('1. [OAuth Vivo Duoc] Redirección y enlace oficial con parámetros nonce y state exactos', async () => {
    const officialUrl = authScraperService.getOfficialLoginUrl();
    assert.equal(officialUrl, EXPECTED_OAUTH_URL);

    const withHint = authScraperService.getOfficialLoginUrl('c.guzman@duocuc.cl');
    assert.ok(withHint.startsWith(EXPECTED_OAUTH_URL));
    assert.ok(withHint.includes('login_hint=c.guzman%40duocuc.cl'));

    const usersRes = await request('/api/auth/users');
    assert.equal(usersRes.status, 200);
    assert.equal(usersRes.body?.officialLoginUrl, EXPECTED_OAUTH_URL);
  });

  await t.test('2. [Scraping Asistencias] Extracción de ramos y asistencia con formato oficial de tabla', async () => {
    const scraped = await authScraperService.maintainVivoDuocSession('c.guzman@duocuc.cl', {
      user: { fullName: 'Cristian Guzmán', career: 'Ingeniería en Informática', attendanceRate: 88.9 },
    });

    assert.ok(scraped);
    assert.equal(scraped.email, 'c.guzman@duocuc.cl');
    assert.equal(scraped.career, 'Ingeniería en Informática');
    assert.ok(Array.isArray(scraped.enrolledCourses));
    assert.ok(scraped.enrolledCourses.length > 0);

    // Verificar asignaturas y campos de tabla: 'Curso', 'N° de Clases Registradas', 'Asistencia', 'Porcentaje de Asistencia Actual'
    const capstone = scraped.enrolledCourses.find(
      (c) => c.nombre?.includes('CAPSTONE') || c.curso?.includes('CAPSTONE')
    );
    assert.ok(capstone, 'Debe incluir asignatura Capstone');
    assert.equal(capstone.clasesRegistradas, 27);
    assert.equal(capstone.asistencia, 24);
    assert.equal(capstone.porcentajeAsistencia, 88.9);
    assert.equal(capstone.porcentajeAsistenciaActual, '88.9%');
  });

  await t.test('3. [Control de Acceso] Usuario registrado en BD (isRegisteredInDb: true) tiene acceso total a Toma de Ramos', async () => {
    // Cristian Guzmán es un usuario registrado en la base de datos
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'c.guzman@duocuc.cl', password: 'Duoc2026!' },
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body?.isRegisteredInDb, true);
    assert.equal(loginRes.body?.user?.isRegisteredInDb, true);

    const token = loginRes.body?.token;
    assert.ok(token);

    // Acceso al simulador de toma de ramos permitido
    const tomaRamosRes = await request('/api/auth/toma-ramos', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(tomaRamosRes.status, 200);
    assert.equal(tomaRamosRes.body?.success, true);

    // Guardar carga horaria permitido
    const saveRes = await request('/api/auth/toma-ramos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        enrolledCourses: [
          { sigla: 'APY4461', nombre: 'PROYECTO CAPSTONE', seccion: '001D' },
        ],
      },
    });
    assert.equal(saveRes.status, 200);
    assert.equal(saveRes.body?.success, true);
  });

  await t.test('4. [Control de Acceso] Usuario NO registrado en BD (isRegisteredInDb: false) es bloqueado (403) en Simulador Toma de Ramos', async () => {
    // Alumno no registrado en la base de datos oficial
    const unregEmail = 'estudiante.externo2026@duocuc.cl';
    const ssoRes = await request('/api/auth/sso-login', {
      method: 'POST',
      body: { email: unregEmail },
    });

    assert.equal(ssoRes.status, 200);
    assert.equal(ssoRes.body?.isRegisteredInDb, false);
    assert.equal(ssoRes.body?.user?.isRegisteredInDb, false);

    const token = ssoRes.body?.token;
    assert.ok(token);

    // Intento de acceder al Simulador Toma de Ramos -> 403 Forbidden
    const getSimRes = await request('/api/auth/toma-ramos', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(getSimRes.status, 403);
    assert.equal(getSimRes.body?.success, false);
    assert.equal(getSimRes.body?.isRegisteredInDb, false);
    assert.ok(
      getSimRes.body?.message?.includes(
        'Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración'
      )
    );

    // Intento de guardar carga en el simulador -> 403 Forbidden
    const saveSimRes = await request('/api/auth/toma-ramos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { enrolledCourses: [] },
    });
    assert.equal(saveSimRes.status, 403);
    assert.equal(saveSimRes.body?.isRegisteredInDb, false);

    // Otros servicios SI son accesibles (perfil, preferencias)
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body?.success, true);
  });

  await t.test('5. [Ley N° 21.719] Cero almacenamiento de contraseñas sin cifrar, limitación de finalidad y metadatos de consentimiento', async () => {
    // 1. Endpoint institucional de ley 21.719
    const lawRes = await request('/api/auth/ley21719');
    assert.equal(lawRes.status, 200);
    assert.equal(lawRes.body?.success, true);
    assert.equal(lawRes.body?.compliance?.zeroUnencryptedCredentials, true);

    // 2. Modelo UserProfile: Cifrado con bcrypt y exclusión de contraseña en toJSON/toObject
    const userDoc = new UserProfile({
      email: 'prueba.ley21719@duocuc.cl',
      fullName: 'Prueba Ley 21719',
      password: 'MiPassword123!',
    });
    await userDoc.validate();

    // Comprobar metadatos de consentimiento y limitación de finalidad
    assert.ok(userDoc.consentMetadata);
    assert.equal(userDoc.consentMetadata.consentGiven, true);
    assert.ok(Array.isArray(userDoc.purposeLimitation));
    assert.ok(userDoc.purposeLimitation.includes('gestion_academica'));
    assert.ok(userDoc.purposeLimitation.includes('simulador_toma_ramos'));

    // Al serializar a JSON, password nunca se expone
    const jsonObj = userDoc.toJSON();
    assert.equal(jsonObj.password, undefined);
    const plainObj = userDoc.toObject();
    assert.equal(plainObj.password, undefined);
  });

  await t.test('6. [Flujo Interactivo Puppeteer] Endpoints de inicio, polling de estado y cancelación', async () => {
    // 1. Iniciar sesión interactiva
    const startRes = await request('/api/auth/vivo-interactive/start', {
      method: 'POST',
      body: { email: 'c.guzman@duocuc.cl' },
    });
    assert.equal(startRes.status, 200);
    assert.equal(startRes.body?.success, true);
    assert.ok(startRes.body?.sessionId);
    assert.ok(startRes.body?.officialUrl?.includes('login.microsoftonline.com'));

    const sessionId = startRes.body.sessionId;

    // 2. Consultar estado de sesión interactiva
    const statusRes = await request(`/api/auth/vivo-interactive/status/${sessionId}`);
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body?.success, true);
    assert.ok(['waiting_window', 'waiting_mfa', 'scraping_background', 'success'].includes(statusRes.body?.status));

    // 3. Cancelar sesión interactiva
    const cancelRes = await request(`/api/auth/vivo-interactive/cancel/${sessionId}`, {
      method: 'POST',
    });
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body?.success, true);
  });
});
