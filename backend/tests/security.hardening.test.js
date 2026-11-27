const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = require('../server');
const entraIdAdapter = require('../services/adapters/entraIdAdapter');
const authService = require('../services/authService');
const UserProfile = require('../models/UserProfile');
const { getJwtSecret, resolveUserFromHeader } = require('../middleware/authMiddleware');
const { request, setBaseUrl } = require('./testHelper');

let server;

function generateRsaKeyPairAndJwk(kid = 'test-entra-key-1') {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk = publicKey.export({ format: 'jwk' });
  jwk.kid = kid;
  jwk.use = 'sig';
  jwk.alg = 'RS256';
  return { publicKey, privateKey, jwk, jwks: { keys: [jwk] } };
}

function signMockEntraIdToken(privateKey, claims, kid = 'kid-rsa-2026') {
  return jwt.sign(claims, privateKey, {
    algorithm: 'RS256',
    keyid: kid,
  });
}

function withEnv(vars, fn) {
  const backup = {};
  for (const [k, v] of Object.entries(vars)) {
    backup[k] = Object.prototype.hasOwnProperty.call(process.env, k) ? process.env[k] : undefined;
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  const restore = () => {
    for (const [k, v] of Object.entries(backup)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.finally(restore);
    }
    restore();
    return res;
  } catch (err) {
    restore();
    throw err;
  }
}

describe('Bloque 1 — Hardening de Seguridad y Autenticación P0 (Nexo360)', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        setBaseUrl(`http://127.0.0.1:${port}`);
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. [EntraID Adapter] Sin defaults heredados de Vivo Duoc; isConfigured y fail-closed cuando falta configuración', async () => {
    await withEnv(
      {
        AZURE_ENTRA_TENANT_ID: undefined,
        AZURE_ENTRA_CLIENT_ID: undefined,
        AZURE_ENTRA_CLIENT_SECRET: undefined,
        AZURE_ENTRA_REDIRECT_URI: undefined,
        AZURE_ENTRA_ALLOWED_DOMAINS: undefined,
      },
      async () => {
        assert.equal(entraIdAdapter.tenantId, '');
        assert.equal(entraIdAdapter.clientId, '');
        assert.equal(entraIdAdapter.redirectUri, '');
        assert.equal(entraIdAdapter.isConfigured(), false);
        assert.deepEqual(entraIdAdapter.allowedDomains, [
          'duocuc.cl',
          'profesor.duoc.cl',
          'duoc.cl',
        ]);

        assert.throws(
          () => entraIdAdapter.createAuthorizationRequest(),
          (err) => err.code === 'OIDC_NOT_CONFIGURED'
        );

        await assert.rejects(
          () => entraIdAdapter.exchangeCodeForTokens('fake-code'),
          (err) => err.code === 'OIDC_NOT_CONFIGURED'
        );

        const statusRes = await request('/api/auth/oidc/status');
        assert.equal(statusRes.status, 200);
        assert.equal(statusRes.body?.enabled, false);

        const authRes = await request('/api/auth/oidc/authorize');
        assert.equal(authRes.status, 503);
        assert.equal(authRes.body?.code, 'OIDC_NOT_CONFIGURED');
      }
    );
  });

  test('2. [EntraID OIDC + PKCE + RS256] Validación criptográfica real, state single-use, nonce, tid, exp/nbf, dominio y callback', async () => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const clientId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const redirectUri = 'http://localhost:5173/auth/callback';
    const { privateKey, jwks } = generateRsaKeyPairAndJwk('kid-rsa-2026');
    const nowSec = Math.floor(Date.now() / 1000);

    await withEnv(
      {
        AZURE_ENTRA_TENANT_ID: tenantId,
        AZURE_ENTRA_CLIENT_ID: clientId,
        AZURE_ENTRA_REDIRECT_URI: redirectUri,
        AZURE_ENTRA_ALLOWED_DOMAINS: 'duocuc.cl,profesor.duoc.cl,duoc.cl',
      },
      async () => {
        assert.equal(entraIdAdapter.isConfigured(), true);

        // 2.1 Solicitud PKCE S256
        const authReq = entraIdAdapter.createAuthorizationRequest();
        assert.ok(authReq.url.includes(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`));
        assert.ok(authReq.url.includes('code_challenge_method=S256'));
        assert.ok(authReq.codeChallenge);

        const consumed = entraIdAdapter.consumeAuthorizationState(authReq.state);
        assert.equal(consumed.nonce, authReq.nonce);
        assert.ok(consumed.codeVerifier.length >= 32);

        // Single-use: segundo consumo del mismo state debe fallar
        assert.throws(
          () => entraIdAdapter.consumeAuthorizationState(authReq.state),
          (err) => err.code === 'OIDC_STATE_INVALID'
        );

        const expectedChallenge = crypto
          .createHash('sha256')
          .update(consumed.codeVerifier)
          .digest('base64url');
        assert.equal(expectedChallenge, authReq.codeChallenge);

        // 2.2 Token RS256 válido
        const validIdToken = signMockEntraIdToken(privateKey, {
          iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
          aud: clientId,
          tid: tenantId,
          nonce: consumed.nonce,
          email: 'c.guzman@duocuc.cl',
          name: 'Cristian Guzmán',
          iat: nowSec,
          nbf: nowSec - 10,
          exp: nowSec + 3600,
        });

        const profile = await entraIdAdapter.validateIdToken(validIdToken, {
          expectedNonce: consumed.nonce,
          jwksOverride: jwks,
        });
        assert.equal(profile.email, 'c.guzman@duocuc.cl');

        // 2.3 Rechazos criptográficos y de claims
        await assert.rejects(
          () =>
            entraIdAdapter.validateIdToken(validIdToken, {
              expectedNonce: 'nonce-incorrecto',
              jwksOverride: jwks,
            }),
          (err) => err.code === 'OIDC_NONCE_MISMATCH'
        );

        const wrongTidToken = signMockEntraIdToken(privateKey, {
          iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
          aud: clientId,
          tid: 'otro-tenant-no-autorizado',
          nonce: 'n1',
          email: 'c.guzman@duocuc.cl',
          exp: nowSec + 3600,
        });
        await assert.rejects(
          () =>
            entraIdAdapter.validateIdToken(wrongTidToken, {
              expectedNonce: 'n1',
              jwksOverride: jwks,
            }),
          (err) => err.code === 'OIDC_TENANT_MISMATCH'
        );

        const wrongDomainToken = signMockEntraIdToken(privateKey, {
          iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
          aud: clientId,
          tid: tenantId,
          nonce: 'n1',
          email: 'atacante@gmail.com',
          exp: nowSec + 3600,
        });
        await assert.rejects(
          () =>
            entraIdAdapter.validateIdToken(wrongDomainToken, {
              expectedNonce: 'n1',
              jwksOverride: jwks,
            }),
          (err) => err.code === 'OIDC_DOMAIN_FORBIDDEN'
        );

        const expiredToken = signMockEntraIdToken(privateKey, {
          iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
          aud: clientId,
          tid: tenantId,
          nonce: 'n1',
          email: 'c.guzman@duocuc.cl',
          exp: nowSec - 120,
        });
        await assert.rejects(
          () =>
            entraIdAdapter.validateIdToken(expiredToken, {
              expectedNonce: 'n1',
              jwksOverride: jwks,
            }),
          (err) => err.code === 'OIDC_SIGNATURE_INVALID'
        );

        const hs256Forged = jwt.sign(
          {
            iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
            aud: clientId,
            tid: tenantId,
            nonce: 'n1',
            email: 'c.guzman@duocuc.cl',
            exp: nowSec + 3600,
          },
          'fake-secret',
          { algorithm: 'HS256' }
        );
        await assert.rejects(
          () =>
            entraIdAdapter.validateIdToken(hs256Forged, {
              expectedNonce: 'n1',
              jwksOverride: jwks,
            }),
          (err) => err.code === 'OIDC_ALG_INVALID'
        );

        // 2.4 Flujo completo HTTP GET /api/auth/oidc/authorize + POST /api/auth/oidc/callback con fetch mockeado
        const originalFetch = global.fetch;
        try {
          const authEndpointRes = await request('/api/auth/oidc/authorize');
          assert.equal(authEndpointRes.status, 200);
          assert.ok(authEndpointRes.body?.state);
          const issuedUrl = new URL(authEndpointRes.body.authorizeUrl);
          const issuedNonce = issuedUrl.searchParams.get('nonce');
          const issuedState = authEndpointRes.body.state;

          const callbackIdToken = signMockEntraIdToken(privateKey, {
            iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
            aud: clientId,
            tid: tenantId,
            nonce: issuedNonce,
            email: 'd.rojas@duocuc.cl',
            name: 'Daniela Rojas',
            iat: nowSec,
            exp: nowSec + 3600,
          });

          global.fetch = async (url) => {
            const urlStr = String(url);
            if (urlStr.includes('/oauth2/v2.0/token')) {
              return new Response(
                JSON.stringify({ id_token: callbackIdToken, access_token: 'mock-access' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
            if (urlStr.includes('/discovery/v2.0/keys')) {
              return new Response(JSON.stringify(jwks), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            throw new Error(`Unexpected fetch URL in test: ${urlStr}`);
          };

          const callbackRes = await request('/api/auth/oidc/callback', {
            method: 'POST',
            body: {
              code: 'auth-code-from-entra',
              state: issuedState,
              email: 'admin.nexo360@duoc.cl', // debe ser ignorado en favor del id_token verificado
            },
          });
          assert.equal(callbackRes.status, 200);
          assert.equal(callbackRes.body?.user?.email, 'd.rojas@duocuc.cl');
          assert.ok(callbackRes.body?.token);

          // Replay del mismo state debe fallar con 401
          const replayRes = await request('/api/auth/oidc/callback', {
            method: 'POST',
            body: { code: 'auth-code-from-entra', state: issuedState },
          });
          assert.equal(replayRes.status, 401);
        } finally {
          global.fetch = originalFetch;
          entraIdAdapter._jwksCache = null;
        }
      }
    );
  });

  test('3. [SSO & Demo Accounts] Rechaza correos arbitrarios y tokens no verificados en /sso-login; /demo-accounts restringido', async () => {
    // 3.1 Sin ENABLE_DEMO_ACCOUNTS: /demo-accounts => 404 y /sso-login con correo arbitrario => 401
    await withEnv({ NODE_ENV: 'test', ENABLE_DEMO_ACCOUNTS: 'false' }, async () => {
      const demoRes = await request('/api/auth/demo-accounts');
      assert.equal(demoRes.status, 404);

      const ssoArbitrary = await request('/api/auth/sso-login', {
        method: 'POST',
        body: { email: 'cualquiera.inventado@duocuc.cl' },
      });
      assert.equal(ssoArbitrary.status, 401);

      const ssoSeedDenied = await request('/api/auth/sso-login', {
        method: 'POST',
        body: { email: 'c.guzman@duocuc.cl' },
      });
      assert.equal(ssoSeedDenied.status, 401);
    });

    // 3.2 Con ENABLE_DEMO_ACCOUNTS=true en non-prod: /demo-accounts mínimo sin PII y /sso-login rechaza correo arbitrario
    await withEnv({ NODE_ENV: 'test', ENABLE_DEMO_ACCOUNTS: 'true' }, async () => {
      const demoRes = await request('/api/auth/demo-accounts');
      assert.equal(demoRes.status, 200);
      assert.ok(Array.isArray(demoRes.body?.accounts) && demoRes.body.accounts.length > 0);
      for (const acc of demoRes.body.accounts) {
        assert.deepEqual(Object.keys(acc).sort(), ['email', 'fullName', 'roleLabel']);
        assert.equal(acc.isPaedis, undefined);
        assert.equal(acc.accessibilityPreferences, undefined);
        assert.equal(acc.rut, undefined);
      }

      const arbitraryDemoRes = await request('/api/auth/sso-login', {
        method: 'POST',
        body: { email: 'no.existe.arbitrario@duocuc.cl' },
      });
      assert.equal(arbitraryDemoRes.status, 401);
    });

    // 3.3 En NODE_ENV=production: rechaza 401/503 incluso si ENABLE_DEMO_ACCOUNTS=true y /demo-accounts => 404
    await withEnv(
      {
        NODE_ENV: 'production',
        ENABLE_DEMO_ACCOUNTS: 'true',
        JWT_SECRET: 'prod_secret_for_security_hardening_test_2026',
      },
      async () => {
        const prodDemo = await request('/api/auth/demo-accounts');
        assert.equal(prodDemo.status, 404);

        const prodSso = await request('/api/auth/sso-login', {
          method: 'POST',
          body: { email: 'c.guzman@duocuc.cl' },
        });
        assert.ok(prodSso.status === 401 || prodSso.status === 503);
      }
    );
  });

  test('4. [AuthService] Sin DEFAULT_SEED_PASSWORD ni plaintext fallback; sin auto-creación; 503 en prod sin Mongo; tokenVersion', async () => {
    // 4.1 verifyUserPassword rechaza texto plano y ausencia de hash
    const plainRejected = await authService.verifyUserPassword(
      { password: 'MiPasswordPlana123!' },
      'MiPasswordPlana123!'
    );
    assert.equal(plainRejected, false);

    const noHashRejected = await authService.verifyUserPassword({}, `Duoc${new Date().getFullYear()}!`);
    assert.equal(noHashRejected, false);

    const bcryptHash = await bcrypt.hash('ClaveSegura2026!', 10);
    const validHashOk = await authService.verifyUserPassword(
      { password: bcryptHash },
      'ClaveSegura2026!'
    );
    assert.equal(validHashOk, true);

    // 4.2 Contraseña temporal criptográfica aleatoria (no usa RUT ni datos personales)
    const temp1 = authService.generateRandomTempPassword();
    const temp2 = authService.generateRandomTempPassword();
    assert.notEqual(temp1, temp2);
    assert.ok(temp1.length >= 16);

    // 4.3 Usuario desconocido -> 401 sin auto-creación
    await assert.rejects(
      () => authService.loginWithPassword('desconocido.no.creado@duocuc.cl', 'Cualquier123!'),
      (err) => err.statusCode === 401
    );
    assert.equal(await authService.findRegisteredUser('desconocido.no.creado@duocuc.cl'), null);

    // 4.4 Usuario bloqueado -> 403
    const blockedEmail = `bloqueado.test.${Date.now()}@duocuc.cl`;
    authService.registerUser({
      _id: `blocked_${Date.now()}`,
      email: blockedEmail,
      fullName: 'Usuario Bloqueado',
      role: 'estudiante',
      password: bcryptHash,
      isBlocked: true,
    });
    await assert.rejects(
      () => authService.loginWithPassword(blockedEmail, 'ClaveSegura2026!'),
      (err) => err.statusCode === 403
    );
    authService.removeUserFromMemory(blockedEmail);

    // 4.5 Producción sin MongoDB conectado -> 503 (cero fallback silencioso en memoria)
    await withEnv(
      { NODE_ENV: 'production', JWT_SECRET: 'prod_secret_for_security_hardening_test_2026' },
      async () => {
        await assert.rejects(
          () => authService.loginWithPassword('c.guzman@duocuc.cl', 'ClaveSegura2026!'),
          (err) => err.statusCode === 503
        );
      }
    );

    // 4.6 Cambio de contraseña incrementa tokenVersion y revoca JWT anterior
    const userEmail = `tokenver.test.${Date.now()}@duocuc.cl`;
    authService.registerUser({
      _id: `tv_${Date.now()}`,
      email: userEmail,
      fullName: 'Usuario TokenVersion',
      role: 'estudiante',
      password: bcryptHash,
      tokenVersion: 0,
    });

    const loginRes = await authService.loginWithPassword(userEmail, 'ClaveSegura2026!');
    assert.equal(loginRes.user.tokenVersion, 0);

    const decodedIssued = jwt.verify(loginRes.token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: 'nexo360-api',
      audience: 'nexo360-client',
    });
    assert.equal(decodedIssued.tokenVersion, 0);

    await authService.changeUserPassword(userEmail, 'ClaveSegura2026!', 'NuevaClaveFuerte2026!');
    const updatedUser = await authService.findRegisteredUser(userEmail);
    assert.equal(updatedUser.tokenVersion, 1);

    const oldTokenMeRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${loginRes.token}` },
    });
    assert.equal(oldTokenMeRes.status, 401);

    authService.removeUserFromMemory(userEmail);
  });

  test('5. [JWT & Fail-Closed Middleware] iss/aud inválidos, demo-token solo en test, usuario borrado 401, bloqueado 403, cambio rol/permisos 403, Mongo caído prod 503', async () => {
    const secret = getJwtSecret();

    // 5.1 JWT firmado sin iss/aud o con iss/aud incorrectos -> 401
    const missingClaimsJwt = jwt.sign(
      { id: 'seed_admin_c_guzman', email: 'c.guzman@duocuc.cl', role: 'admin' },
      secret,
      { algorithm: 'HS256', expiresIn: '10m' }
    );
    const wrongIssRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${missingClaimsJwt}` },
    });
    assert.equal(wrongIssRes.status, 401);

    const wrongAudJwt = jwt.sign(
      { id: 'seed_admin_c_guzman', email: 'c.guzman@duocuc.cl', role: 'admin' },
      secret,
      { algorithm: 'HS256', issuer: 'nexo360-api', audience: 'otro-cliente', expiresIn: '10m' }
    );
    const wrongAudRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${wrongAudJwt}` },
    });
    assert.equal(wrongAudRes.status, 401);

    // 5.2 demo-token-cristian solo permitido en NODE_ENV === 'test'
    await withEnv({ NODE_ENV: 'development' }, async () => {
      const devDemoRes = await request('/api/auth/me', {
        headers: { Authorization: 'Bearer demo-token-cristian' },
      });
      assert.equal(devDemoRes.status, 401);
    });

    // 5.3 Usuario borrado -> 401 fail-closed (no usa payload del JWT)
    const ghostEmail = `borrado.${Date.now()}@duocuc.cl`;
    const ghostJwt = authService.generateJwt({
      id: 'ghost_1',
      email: ghostEmail,
      role: 'admin',
      fullName: 'Usuario Borrado',
      tokenVersion: 0,
    });
    const ghostRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${ghostJwt}` },
    });
    assert.equal(ghostRes.status, 401);

    // 5.4 Usuario bloqueado en tiempo real -> 403 con JWT vigente
    const blockedLiveEmail = `live.blocked.${Date.now()}@duocuc.cl`;
    authService.registerUser({
      _id: 'live_blocked_1',
      email: blockedLiveEmail,
      fullName: 'Live Blocked',
      role: 'estudiante',
      isBlocked: false,
      tokenVersion: 0,
    });
    const liveJwt = authService.generateJwt({
      id: 'live_blocked_1',
      email: blockedLiveEmail,
      role: 'estudiante',
      tokenVersion: 0,
    });
    assert.equal(
      (await request('/api/auth/me', { headers: { Authorization: `Bearer ${liveJwt}` } })).status,
      200
    );
    authService.updateUserFieldsInMemory(blockedLiveEmail, { isBlocked: true });
    assert.equal(
      (await request('/api/auth/me', { headers: { Authorization: `Bearer ${liveJwt}` } })).status,
      403
    );
    authService.removeUserFromMemory(blockedLiveEmail);

    // 5.5 Permisos revocados en rol admin (permissions: []) -> 403 incluso siendo role: 'admin'
    const adminRevokedEmail = `admin.revoked.${Date.now()}@duoc.cl`;
    authService.registerUser({
      _id: 'admin_revoked_1',
      email: adminRevokedEmail,
      fullName: 'Admin Sin Permisos',
      role: 'admin',
      permissions: [],
      tokenVersion: 0,
    });
    const adminRevokedJwt = authService.generateJwt({
      id: 'admin_revoked_1',
      email: adminRevokedEmail,
      role: 'admin',
      permissions: ['full_access', 'audit_logs', 'manage_users'], // claim stale en JWT debe ser ignorado
      tokenVersion: 0,
    });

    const revokedMetricsRes = await request('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${adminRevokedJwt}` },
    });
    assert.equal(revokedMetricsRes.status, 403);

    const revokedLogsRes = await request('/api/admin/activity-logs', {
      headers: { Authorization: `Bearer ${adminRevokedJwt}` },
    });
    assert.equal(revokedLogsRes.status, 403);

    // Cambio de rol en BD/store (admin -> estudiante) revoca acceso admin inmediatamente
    authService.updateUserFieldsInMemory(adminRevokedEmail, {
      role: 'estudiante',
      permissions: undefined,
    });
    const demotedRes = await request('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${adminRevokedJwt}` },
    });
    assert.equal(demotedRes.status, 403);
    authService.removeUserFromMemory(adminRevokedEmail);

    // 5.6 MongoDB desconectado en NODE_ENV === 'production' -> 503
    const validAdminJwt = authService.generateJwt({
      id: 'seed_admin_c_guzman',
      email: 'c.guzman@duocuc.cl',
      role: 'admin',
      tokenVersion: 0,
    });
    await withEnv(
      { NODE_ENV: 'production', JWT_SECRET: secret },
      async () => {
        const prodDisconnectedRes = await request('/api/auth/me', {
          headers: { Authorization: `Bearer ${validAdminJwt}` },
        });
        assert.equal(prodDisconnectedRes.status, 503);
      }
    );

    // 5.7 Error de consulta MongoDB con readyState === 1 -> status 'unavailable' (503)
    const connDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    const origFindOne = UserProfile.findOne;
    try {
      Object.defineProperty(mongoose.connection, 'readyState', {
        configurable: true,
        get: () => 1,
      });
      UserProfile.findOne = () => ({
        lean: async () => {
          throw new Error('Mongo network error');
        },
      });
      const resolved = await resolveUserFromHeader(`Bearer ${validAdminJwt}`);
      assert.equal(resolved.status, 'unavailable');

      const dbFailRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${validAdminJwt}` },
      });
      assert.equal(dbFailRes.status, 503);
    } finally {
      UserProfile.findOne = origFindOne;
      if (connDescriptor) {
        Object.defineProperty(mongoose.connection, 'readyState', connDescriptor);
      } else {
        delete mongoose.connection.readyState;
      }
    }
  });

  test('6. [RBAC & Escalación] GET /api/auth/users protegido, escalación vertical/horizontal 403, Admin TI bloqueado en PAEDIS 403', async () => {
    const studentToken = authService.generateJwt({
      id: 'seed_est_m_contreras',
      email: 'm.contreras@duocuc.cl',
      role: 'estudiante',
      tokenVersion: 0,
    });
    const coordToken = authService.generateJwt({
      id: 'seed_coord_paedis',
      email: 'coord.paedis@duoc.cl',
      role: 'coordinador_paedis',
      tokenVersion: 0,
    });
    const adminToken = authService.generateJwt({
      id: 'seed_admin_c_guzman',
      email: 'c.guzman@duocuc.cl',
      role: 'admin',
      tokenVersion: 0,
    });

    // 6.1 GET /api/auth/users: anónimo 401, estudiante 403, coordinador 200, admin 200
    assert.equal((await request('/api/auth/users')).status, 401);
    assert.equal(
      (await request('/api/auth/users', { headers: { Authorization: `Bearer ${studentToken}` } })).status,
      403
    );
    assert.equal(
      (await request('/api/auth/users', { headers: { Authorization: `Bearer ${coordToken}` } })).status,
      200
    );
    assert.equal(
      (await request('/api/auth/users', { headers: { Authorization: `Bearer ${adminToken}` } })).status,
      200
    );

    // 6.2 Escalación vertical: estudiante intentando rutas admin -> 403
    assert.equal(
      (await request('/api/admin/students', { headers: { Authorization: `Bearer ${studentToken}` } })).status,
      403
    );
    assert.equal(
      (await request('/api/admin/activity-logs', { headers: { Authorization: `Bearer ${studentToken}` } })).status,
      403
    );

    // 6.3 Admin TI bloqueado de expediente confidencial PAEDIS -> 403 (Ley N° 21.719)
    const adminPaedisRes = await request('/api/admin/paedis/d.rojas@duocuc.cl/case', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { notasConfidencialesPaedis: 'Intento de acceso TI' },
    });
    assert.equal(adminPaedisRes.status, 403);

    // 6.4 Escalación horizontal: estudiante en PUT /api/auth/profile no puede alterar cuenta de otro usuario
    const victimBefore = await authService.findRegisteredUser('d.rojas@duocuc.cl');
    const victimPhoneBefore = victimBefore.phone;
    const horizRes = await request('/api/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        email: 'd.rojas@duocuc.cl',
        phone: '+56 9 9999 0000',
      },
    });
    assert.equal(horizRes.status, 200);
    assert.equal(horizRes.body?.user?.email, 'm.contreras@duocuc.cl');
    const victimAfter = await authService.findRegisteredUser('d.rojas@duocuc.cl');
    assert.equal(victimAfter.phone, victimPhoneBefore);
  });

  test('7. [PAEDIS Migration] syncPaedisRecordsMigration selecciona campos clínicos (+select) y toPaedisRestricted lee notasConfidenciales canónicas', async () => {
    const PaedisRecord = require('../models/PaedisRecord');
    const restricted = authService.toPaedisRestricted(
      { email: 'd.rojas@duocuc.cl', fullName: 'Daniela Rojas', role: 'estudiante_paedis' },
      {
        diagnosticoDeclarado: 'Hipoacusia',
        notasConfidenciales: 'Nota clínica canónica',
        estadoCaso: 'APROBADO',
        fichaDocenteEstado: 'PREPARADA',
      }
    );
    assert.equal(restricted.notasConfidenciales, 'Nota clínica canónica');
    assert.equal(restricted.notasConfidencialesPaedis, 'Nota clínica canónica');
    assert.equal(restricted.estadoCaso, 'APROBADO');
    assert.equal(restricted.fichaDocenteEstado, 'PREPARADA');

    const connDescriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    const origFind = UserProfile.find;
    const origFindOneAndUpdate = PaedisRecord.findOneAndUpdate;
    let capturedSelect = null;
    const capturedUpserts = [];

    try {
      Object.defineProperty(mongoose.connection, 'readyState', {
        configurable: true,
        get: () => 1,
      });
      UserProfile.find = () => ({
        select(sel) {
          capturedSelect = sel;
          return this;
        },
        lean: async () => [
          {
            _id: 'uid_paedis_1',
            email: 'paedis.migracion@duocuc.cl',
            fullName: 'Estudiante Migrado',
            isPaedis: true,
            diagnosticoDeclarado: 'Diagnóstico Preservar',
            notasConfidencialesPaedis: 'Notas Confidenciales Preservar',
            ajustesAprobados: [],
          },
        ],
      });
      PaedisRecord.findOneAndUpdate = async (filter, update) => {
        capturedUpserts.push({ filter, update });
        return update.$setOnInsert;
      };

      const res = await authService.syncPaedisRecordsMigration();
      assert.equal(res.migrated, 1);
      assert.ok(capturedSelect && capturedSelect.includes('+diagnosticoDeclarado'));
      assert.ok(capturedSelect.includes('+notasConfidencialesPaedis'));
      const insertDoc = capturedUpserts[0]?.update?.$setOnInsert;
      assert.equal(insertDoc.studentId, 'uid_paedis_1');
      assert.equal(insertDoc.studentName, 'Estudiante Migrado');
      assert.equal(insertDoc.diagnosticoDeclarado, 'Diagnóstico Preservar');
      assert.equal(insertDoc.notasConfidenciales, 'Notas Confidenciales Preservar');
      assert.equal(insertDoc.notasConfidencialesPaedis, 'Notas Confidenciales Preservar');
    } finally {
      UserProfile.find = origFind;
      PaedisRecord.findOneAndUpdate = origFindOneAndUpdate;
      if (connDescriptor) {
        Object.defineProperty(mongoose.connection, 'readyState', connDescriptor);
      } else {
        delete mongoose.connection.readyState;
      }
    }
  });
});
