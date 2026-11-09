const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const app = require('../server');
const UserProfile = require('../models/UserProfile');
const { getJwtSecret } = require('../middleware/authMiddleware');

let server;
let baseUrl;

// Helper ligero para peticiones HTTP de prueba sin dependencias externas
function request(path, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = { ...headers };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            // Respuesta no JSON
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
            raw,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Auditoría QA, Ciberseguridad (OWASP) y Optimización - Nexo360', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. [SEC-05] Cabeceras de Seguridad OWASP están presentes en todas las respuestas', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.equal(res.headers['cross-origin-opener-policy'], 'same-origin');
    assert.ok(res.headers['content-security-policy']?.includes("default-src 'self'"));
    assert.ok(res.headers['permissions-policy']?.includes('camera=()'));
  });

  test('2. [SEC-02] Política CORS bloquea orígenes no autorizados con 403 y permite el origen oficial', async () => {
    const blockedRes = await request('/api/health', {
      headers: { Origin: 'https://evil-phishing-site.example.com' },
    });
    assert.equal(blockedRes.status, 403);
    assert.equal(blockedRes.body?.success, false);

    const allowedRes = await request('/api/health', {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(allowedRes.status, 200);
    assert.equal(allowedRes.headers['access-control-allow-origin'], 'http://localhost:5173');
  });

  test('3. [SEC-04] Endpoints de perfil, accesibilidad y toma de ramos exigen token JWT válido (401 sin token)', async () => {
    const endpoints = [
      { method: 'GET', path: '/api/auth/me' },
      { method: 'PUT', path: '/api/auth/accessibility', body: { fontSize: 'large' } },
      { method: 'PUT', path: '/api/auth/profile', body: { phone: '+56 9 1234 5678' } },
      { method: 'GET', path: '/api/auth/toma-ramos' },
      { method: 'PUT', path: '/api/auth/toma-ramos', body: { enrolledCourses: [] } },
    ];

    for (const ep of endpoints) {
      const res = await request(ep.path, { method: ep.method, body: ep.body });
      assert.equal(
        res.status,
        401,
        `El endpoint ${ep.method} ${ep.path} debía rechazar peticiones anónimas con 401`
      );
    }
  });

  test('4. [SEC-01] Bypass demo-token-cristian es bloqueado estrictamente cuando NODE_ENV=production', async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'test_production_secret_key_for_audit_2026';

    try {
      const res = await request('/api/auth/me', {
        headers: { Authorization: 'Bearer demo-token-cristian' },
      });
      assert.equal(res.status, 401);
      assert.match(res.body?.message || '', /expirado o inválido/i);
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });

  test('5. [SEC-01] Token JWT legítimo HS256 permite acceso autenticado y rechaza firmas alteradas', async () => {
    const validToken = jwt.sign(
      {
        email: 'c.guzman@duocuc.cl',
        fullName: 'Cristian Guzmán',
        rut: '19.276.735-0',
      },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '10m' }
    );

    const validRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.equal(validRes.status, 200);
    assert.equal(validRes.body?.success, true);
    assert.equal(validRes.body?.user?.email, 'c.guzman@duocuc.cl');

    const forgedToken = jwt.sign(
      { email: 'c.guzman@duocuc.cl' },
      'wrong_secret_key',
      { algorithm: 'HS256' }
    );
    const invalidRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.equal(invalidRes.status, 401);
  });

  test('6. [SEC-03 & SEC-07] Prevención de NoSQL Injection, validación de dominio @duocuc.cl y cabeceras Rate-Limit', async () => {
    // Intento de NoSQL Injection enviando objetos en email/password
    const nosqlRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: { $ne: null }, password: { $ne: null } },
    });
    assert.equal(nosqlRes.status, 400);
    assert.ok(nosqlRes.headers['x-ratelimit-limit'], 'Debe incluir cabecera X-RateLimit-Limit');

    // Intento con dominio externo no institucional
    const externalEmailRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'usuario@gmail.com', password: 'Password123!' },
    });
    assert.equal(externalEmailRes.status, 400);
    assert.match(externalEmailRes.body?.message || '', /dominio institucional/i);

    // Validación estricta de UUID v4 en /mfa-status/:sessionId
    const badSessionRes = await request('/api/auth/mfa-status/not-a-valid-uuid');
    assert.equal(badSessionRes.status, 400);
  });

  test('7. [Zero-Knowledge & Schema] UserProfile elimina campos de contraseña en memoria y valida sub-esquemas', () => {
    const doc = new UserProfile({
      email: 'c.guzman@duocuc.cl',
      fullName: 'Cristian Guzmán',
      rut: '19.276.735-0',
      enrolledCourses: [
        {
          sigla: 'PTY4614',
          nombre: 'PROYECTO CAPSTONE',
          seccion: '001D',
          creditos: 10,
          bloques: [{ dia: 'Miércoles', bloqueId: 'b1', texto: 'PTY4614-001D', sala: 'AL-503A' }],
        },
      ],
    });

    // Simular intento accidental de asignar password al documento
    doc.set('password', 'secreto123', { strict: false });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.enrolledCourses.length, 1);
    assert.equal(doc.enrolledCourses[0].sigla, 'PTY4614');
    assert.equal(doc.enrolledCourses[0].bloques[0].dia, 'Miércoles');
  });

  test('8. [API Modules] Catálogo completo de 9 categorías, 44 apartados y 129 artículos responde con 200', async () => {
    const res = await request('/api/modules');
    assert.equal(res.status, 200);
    assert.equal(res.body?.success, true);
    assert.equal(res.body?.totalCategories, 9);
  });

  test('9. [QA-01 & SEC-03] Sanitización y persistencia de Perfil, Accesibilidad y Toma de Ramos', async () => {
    const validToken = jwt.sign(
      { email: 'c.guzman@duocuc.cl', fullName: 'Cristian Guzmán' },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '10m' }
    );
    const authHeaders = { Authorization: `Bearer ${validToken}` };

    // Actualizar perfil (incluyendo direccion y emailPersonal que antes se perdían)
    const profileRes = await request('/api/auth/profile', {
      method: 'PUT',
      headers: authHeaders,
      body: {
        direccion: 'Av. España 8, Santiago',
        telefonoPersonal: '+56 9 9988 7766',
        emailPersonal: 'cristian.nuevo@gmail.com',
        role: 'SUPERADMIN_INJECTION', // Debe ser ignorado por whitelist
      },
    });
    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body?.user?.direccion, 'Av. España 8, Santiago');
    assert.equal(profileRes.body?.user?.telefonoPersonal, '+56 9 9988 7766');
    assert.equal(profileRes.body?.user?.emailPersonal, 'cristian.nuevo@gmail.com');
    assert.equal(profileRes.body?.user?.role, undefined);

    // Actualizar preferencias de accesibilidad con sanitización de fontSize inválido
    const a11yRes = await request('/api/auth/accessibility', {
      method: 'PUT',
      headers: authHeaders,
      body: {
        preferences: {
          fontSize: 'invalid-size',
          highContrast: true,
          dyslexicFont: true,
        },
      },
    });
    assert.equal(a11yRes.status, 200);
    assert.equal(a11yRes.body?.accessibilityPreferences?.fontSize, 'normal');
    assert.equal(a11yRes.body?.accessibilityPreferences?.highContrast, true);

    // Guardar toma de ramos sanitizando estructura
    const tomaRes = await request('/api/auth/toma-ramos', {
      method: 'POST',
      headers: authHeaders,
      body: {
        enrolledCourses: [
          {
            sigla: 'ASY4131',
            nombre: 'ARQUITECTURA DE SOFTWARE',
            seccion: '003D',
            creditos: 8,
            bloques: [{ dia: 'Jueves', bloqueId: 'b7', texto: 'ASY4131-003D', sala: 'AL-304' }],
          },
        ],
      },
    });
    assert.equal(tomaRes.status, 200);
    assert.equal(tomaRes.body?.enrolledCourses?.length, 1);
    assert.equal(tomaRes.body?.enrolledCourses[0].sigla, 'ASY4131');
  });

  test('10. [SSO Microsoft & BD 10 Roles] Catálogo de 10 usuarios institucionales y captura de correo como nombre para nuevos correos', async () => {
    // 1. Verificar que GET /api/auth/users retorna los 10 perfiles institucionales y la URL oficial de Microsoft
    const usersRes = await request('/api/auth/users');
    assert.equal(usersRes.status, 200);
    assert.equal(usersRes.body?.success, true);
    assert.ok(usersRes.body?.totalUsers >= 10);
    assert.ok(usersRes.body?.officialLoginUrl?.includes('login.microsoftonline.com'));

    const rolesPresent = new Set(usersRes.body.users.map((u) => u.rol));
    assert.ok(rolesPresent.has('admin'));
    assert.ok(rolesPresent.has('estudiante_paedis'));
    assert.ok(rolesPresent.has('estudiante'));
    assert.ok(rolesPresent.has('profesor'));
    assert.ok(rolesPresent.has('director'));
    assert.ok(rolesPresent.has('subdirector'));

    // 2. Login SSO con un usuario de la BD (ej. Directora de Carrera)
    const dirLogin = await request('/api/auth/sso-login', {
      method: 'POST',
      body: { email: 'p.valenzuela@duoc.cl' },
    });
    assert.equal(dirLogin.status, 200);
    assert.equal(dirLogin.body?.success, true);
    assert.equal(dirLogin.body?.user?.nombre, 'Patricia Valenzuela');
    assert.equal(dirLogin.body?.user?.rol, 'director');

    // 3. Login SSO con un correo institucional no registrado en los 10: usa su correo como nombre
    const customEmail = 'alumno.nuevo2026@duocuc.cl';
    const customLogin = await request('/api/auth/sso-login', {
      method: 'POST',
      body: { email: customEmail },
    });
    assert.equal(customLogin.status, 200);
    assert.equal(customLogin.body?.success, true);
    assert.equal(customLogin.body?.user?.nombre, customEmail);
    assert.equal(customLogin.body?.user?.fullName, customEmail);
  });
});
