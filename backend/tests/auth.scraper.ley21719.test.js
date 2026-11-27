const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const bcrypt = require('bcryptjs');

const app = require('../server');
const authService = require('../services/authService');
const UserProfile = require('../models/UserProfile');
const { request, setBaseUrl } = require('./testHelper');

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
  await t.test('1. [OAuth EntraID] Fail-closed sin config, configurable via env y /api/auth/users autenticado', async () => {
    const prevOauth = process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
    delete process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
    try {
      assert.equal(authService.getOfficialLoginUrl(), null);
      process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL = 'https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize?client_id=test-client';
      const withHint = authService.getOfficialLoginUrl('c.guzman@duocuc.cl');
      assert.ok(withHint.includes('login_hint=c.guzman%40duocuc.cl'));

      const anonRes = await request('/api/auth/users');
      assert.equal(anonRes.status, 401);

      const adminToken = authService.generateJwt({
        id: 'seed_admin_c_guzman',
        email: 'c.guzman@duocuc.cl',
        role: 'admin',
        tokenVersion: 0,
      });
      const usersRes = await request('/api/auth/users', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(usersRes.status, 200);
      assert.ok(usersRes.body?.officialLoginUrl?.includes('login.microsoftonline.com'));
    } finally {
      if (prevOauth === undefined) delete process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
      else process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL = prevOauth;
    }
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
    const regEmail = `registrado.toma.${Date.now()}@duocuc.cl`;
    const regPass = 'TomaRamos2026!';
    const hashedPassword = await bcrypt.hash(regPass, 10);
    authService.registerUser({
      _id: `reg_toma_${Date.now()}`,
      email: regEmail,
      fullName: 'Estudiante Registrado',
      role: 'estudiante',
      password: hashedPassword,
      isRegisteredInDb: true,
      tokenVersion: 0,
    });

    try {
      const loginRes = await request('/api/auth/login', {
        method: 'POST',
        body: { email: regEmail, password: regPass },
      });
      assert.equal(loginRes.status, 200);
      assert.equal(loginRes.body?.isRegisteredInDb, true);
      assert.equal(loginRes.body?.user?.isRegisteredInDb, true);

      const token = loginRes.body?.token;
      assert.ok(token);

      const tomaRamosRes = await request('/api/auth/toma-ramos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(tomaRamosRes.status, 200);
      assert.equal(tomaRamosRes.body?.success, true);

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
    } finally {
      authService.removeUserFromMemory(regEmail);
    }
  });

  await t.test('4. [Control de Acceso] Usuario NO registrado en BD (isRegisteredInDb: false) es bloqueado (403) en Simulador Toma de Ramos', async () => {
    // 1. /api/auth/sso-login debe rechazar un correo arbitrario no registrado (401)
    const unregEmail = 'estudiante.externo2026@duocuc.cl';
    const ssoRes = await request('/api/auth/sso-login', {
      method: 'POST',
      body: { email: unregEmail },
    });
    assert.equal(ssoRes.status, 401);

    // 2. Usuario OIDC provisionado con isRegisteredInDb: false puede ver /me pero es bloqueado (403) en Toma de Ramos
    const oidcRes = await authService.completeOidcLogin({
      email: unregEmail,
      fullName: 'Estudiante Externo OIDC',
      inferredRole: 'estudiante',
    });
    assert.equal(oidcRes.isRegisteredInDb, false);
    const token = oidcRes.token;

    try {
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

      const saveSimRes = await request('/api/auth/toma-ramos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { enrolledCourses: [] },
      });
      assert.equal(saveSimRes.status, 403);
      assert.equal(saveSimRes.body?.isRegisteredInDb, false);

      const meRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(meRes.status, 200);
      assert.equal(meRes.body?.success, true);
    } finally {
      authService.removeUserFromMemory(unregEmail);
    }
  });

  await t.test('5. [Ley N° 21.719] Cero almacenamiento de contraseñas sin cifrar, limitación de finalidad y metadatos de consentimiento', async () => {
    const lawRes = await request('/api/auth/ley21719');
    assert.equal(lawRes.status, 200);
    assert.equal(lawRes.body?.success, true);
    assert.equal(lawRes.body?.compliance?.zeroUnencryptedCredentials, true);

    const userDoc = new UserProfile({
      email: 'prueba.ley21719@duocuc.cl',
      fullName: 'Prueba Ley 21719',
      password: 'MiPassword123!',
    });
    await userDoc.validate();

    assert.ok(userDoc.consentMetadata);
    assert.equal(userDoc.consentMetadata.consentGiven, false);
    assert.equal(userDoc.consentMetadata.consentDate, null);
    assert.equal(userDoc.consentMetadata.legalBasis, 'PENDIENTE_REVISION_INSTITUCIONAL');
    assert.equal(userDoc.consentMetadata.informationDelivered, false);
    assert.ok(Array.isArray(userDoc.purposeLimitation));
    assert.ok(userDoc.purposeLimitation.includes('gestion_academica'));
    assert.ok(userDoc.purposeLimitation.includes('simulador_toma_ramos'));

    const jsonObj = userDoc.toJSON();
    assert.equal(jsonObj.password, undefined);
    const plainObj = userDoc.toObject();
    assert.equal(plainObj.password, undefined);
  });

  await t.test('6. [Autenticación Directa y Cohesión de BD] Login con bcrypt y Demo SSO controlado en non-prod', async () => {
    const prevDemo = process.env.ENABLE_DEMO_ACCOUNTS;
    process.env.ENABLE_DEMO_ACCOUNTS = 'true';
    try {
      const loginResult = await authService.loginWithPassword('c.guzman@duocuc.cl', `Duoc${new Date().getFullYear()}!`);
      assert.ok(loginResult.token);
      assert.equal(loginResult.user.email, 'c.guzman@duocuc.cl');
      assert.equal(loginResult.isRegisteredInDb, true);

      const ssoResult = await authService.completeDemoSsoLogin('c.guzman@duocuc.cl');
      assert.ok(ssoResult.token);
      assert.equal(ssoResult.user.email, 'c.guzman@duocuc.cl');
      assert.equal(ssoResult.isRegisteredInDb, true);
    } finally {
      if (prevDemo === undefined) delete process.env.ENABLE_DEMO_ACCOUNTS;
      else process.env.ENABLE_DEMO_ACCOUNTS = prevDemo;
    }
  });

  await t.test('7. [Flujo de Recuperación y Cambio de Contraseña] Token seguro, Anti-enumeración y Ley 21.719', async () => {
    const emailService = require('../services/emailService');
    const resetEmail = `reset.flow.${Date.now()}@duocuc.cl`;
    const initPwd = 'InicialSegura2026!';
    authService.registerUser({
      _id: `reset_flow_${Date.now()}`,
      email: resetEmail,
      fullName: 'Usuario Reset Flow',
      role: 'estudiante',
      password: await bcrypt.hash(initPwd, 10),
      tokenVersion: 0,
      isRegisteredInDb: true,
    });

    try {
      const forgotRes = await request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: resetEmail },
      });
      assert.equal(forgotRes.status, 200);
      assert.equal(forgotRes.body?.success, true);

      const forgotGhostRes = await request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: 'fantasma.noexiste@duocuc.cl' },
      });
      assert.equal(forgotGhostRes.status, 200);
      assert.equal(forgotGhostRes.body?.success, true);
      assert.equal(forgotGhostRes.body?.message, forgotRes.body?.message);

      const outbox = emailService.getOutbox();
      const resetMail = outbox.find((m) => m.resetToken && m.resetUrl?.includes(encodeURIComponent(resetEmail)));
      assert.ok(resetMail, 'Debe haber un correo con resetToken en el outbox');
      const token = resetMail.resetToken;

      const newPwd = 'NuevaPasswordSegura2026!';
      const resetRes = await request('/api/auth/reset-password', {
        method: 'POST',
        body: {
          email: resetEmail,
          token,
          newPassword: newPwd,
        },
      });
      assert.equal(resetRes.status, 200);
      assert.equal(resetRes.body?.success, true);

      const reuseRes = await request('/api/auth/reset-password', {
        method: 'POST',
        body: {
          email: resetEmail,
          token,
          newPassword: 'OtraPasswordMas2026!',
        },
      });
      assert.equal(reuseRes.status, 400);

      const loginNewRes = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: resetEmail,
          password: newPwd,
        },
      });
      assert.equal(loginNewRes.status, 200);
      const userToken = loginNewRes.body?.token;

      const changeRes = await request('/api/auth/change-password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          currentPassword: newPwd,
          newPassword: 'Duoc2026!Final',
        },
      });
      assert.equal(changeRes.status, 200);
      assert.equal(changeRes.body?.success, true);

      // tokenVersion incrementado debe revocar el token previo tras cambio de contraseña
      const revokedMeRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      assert.equal(revokedMeRes.status, 401);
    } finally {
      authService.removeUserFromMemory(resetEmail);
    }
  });
});
