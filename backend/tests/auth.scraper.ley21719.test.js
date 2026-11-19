const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../server');
const authService = require('../services/authService');
const UserProfile = require('../models/UserProfile');
const { request, setBaseUrl } = require('./testHelper');

const EXPECTED_OAUTH_URL =
  'https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize?client_id=674913e2-e170-4787-833f-e307f87db6e5&nonce=23077c7bfb49e35770b10965bcbb9df5&redirect_uri=https%3A%2F%2Fexperienciavivo.duoc.cl%2Fauth%2Fopenidc%2Fcallback&response_type=code&scope=openid+profile+email+offline_access+api%3A%2F%2F674913e2-e170-4787-833f-e307f87db6e5%2Faccess&state=181261858bac94807f59900cdd53d715&sso_reload=true';

let server;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      setBaseUrl(`http://127.0.0.1:${port}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('AUDITORÍA AUTH-NATIVO: Microsoft OAuth, Cohesión MongoDB, Control Acceso & Ley N° 21.719', async (t) => {
  await t.test('1. [OAuth Vivo Duoc] Redirección y enlace oficial con parámetros nonce y state exactos', async () => {
    const officialUrl = authService.getOfficialLoginUrl();
    assert.equal(officialUrl, EXPECTED_OAUTH_URL);

    const withHint = authService.getOfficialLoginUrl('c.guzman@duocuc.cl');
    assert.ok(withHint.startsWith(EXPECTED_OAUTH_URL));
    assert.ok(withHint.includes('login_hint=c.guzman%40duocuc.cl'));

    const usersRes = await request('/api/auth/users');
    assert.equal(usersRes.status, 200);
    assert.equal(usersRes.body?.officialLoginUrl, EXPECTED_OAUTH_URL);
  });

  await t.test('2. [Cohesión de Perfil] Formateo 1:1 con modelos y datos de usuario', async () => {
    const formatted = authService.formatUserResponse({
      email: 'c.guzman@duocuc.cl',
      fullName: 'Cristian Guzmán',
      career: 'Ingeniería en Informática',
      campus: 'Sede Alameda',
      attendanceRate: 88.9,
      rut: '19.276.735-0',
    });

    assert.ok(formatted);
    assert.equal(formatted.email, 'c.guzman@duocuc.cl');
    assert.equal(formatted.fullName, 'Cristian Guzmán');
    assert.equal(formatted.nombre, 'Cristian Guzmán');
    assert.equal(formatted.career, 'Ingeniería en Informática');
    assert.equal(formatted.carrera, 'Ingeniería en Informática');
    assert.equal(formatted.campus, 'Sede Alameda');
    assert.equal(formatted.sede, 'Sede Alameda');
    assert.equal(formatted.rut, '19.276.735-0');
    assert.equal(formatted.attendanceRate, 88.9);
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

  await t.test('6. [Autenticación Directa y Cohesión de BD] Login y SSO nativos sin demoras ni procesos de scraping', async () => {
    // 1. Inicio de sesión con contraseña cifrada
    const loginResult = await authService.loginWithPassword('c.guzman@duocuc.cl', 'Duoc2026!');
    assert.ok(loginResult.token);
    assert.equal(loginResult.user.email, 'c.guzman@duocuc.cl');
    assert.equal(loginResult.isRegisteredInDb, true);

    // 2. Inicio de sesión SSO instantáneo
    const ssoResult = await authService.completeSsoLogin('c.guzman@duocuc.cl');
    assert.ok(ssoResult.token);
    assert.equal(ssoResult.user.email, 'c.guzman@duocuc.cl');
    assert.equal(ssoResult.isRegisteredInDb, true);
  });

  await t.test('7. [Flujo de Recuperación y Cambio de Contraseña] Token seguro, Anti-enumeración y Ley 21.719', async () => {
    const emailService = require('../services/emailService');

    // 1. Forgot password para usuario existente (retorna 200 y genera outbox)
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'c.guzman@duocuc.cl' },
    });
    assert.equal(forgotRes.status, 200);
    assert.equal(forgotRes.body?.success, true);

    // Anti-enumeración: usuario inexistente también retorna 200 con mensaje idéntico
    const forgotGhostRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'fantasma.noexiste@duocuc.cl' },
    });
    assert.equal(forgotGhostRes.status, 200);
    assert.equal(forgotGhostRes.body?.success, true);
    assert.equal(forgotGhostRes.body?.message, forgotRes.body?.message);

    // Obtener token del outbox (o preview)
    const outbox = emailService.getOutbox();
    const resetMail = outbox.slice().reverse().find((m) => m.resetToken);
    assert.ok(resetMail, 'Debe haber un correo con resetToken en el outbox');
    const token = resetMail.resetToken;

    // 2. Reset password con token válido
    const newPwd = 'NuevaPasswordSegura2026!';
    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: 'c.guzman@duocuc.cl',
        token,
        newPassword: newPwd,
      },
    });
    assert.equal(resetRes.status, 200);
    assert.equal(resetRes.body?.success, true);

    // 3. Token reutilizado debe ser rechazado
    const reuseRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: 'c.guzman@duocuc.cl',
        token,
        newPassword: 'OtraPasswordMas2026!',
      },
    });
    assert.equal(reuseRes.status, 400);

    // 4. Iniciar sesión con la nueva contraseña
    const loginNewRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'c.guzman@duocuc.cl',
        password: newPwd,
      },
    });
    assert.equal(loginNewRes.status, 200);
    const userToken = loginNewRes.body?.token;

    // 5. Cambio de contraseña autenticado (PUT /api/auth/change-password)
    const changeRes = await request('/api/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        currentPassword: newPwd,
        newPassword: 'Duoc2026!',
      },
    });
    assert.equal(changeRes.status, 200);
    assert.equal(changeRes.body?.success, true);

    // 6. Verificar que passwordResetTokenHash nunca se expone en toJSON
    const userMeRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(userMeRes.status, 200);
    assert.equal(userMeRes.body?.user?.passwordResetTokenHash, undefined);
    assert.equal(userMeRes.body?.user?.password, undefined);
  });
});
