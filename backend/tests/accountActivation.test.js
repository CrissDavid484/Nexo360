const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');

test('AUDITORÍA SEGURIDAD P0: Flujo Criptográfico de Activación de Cuentas y Cero Contraseñas Predecibles', async (t) => {
  const uniqueId = Date.now();
  const testEmail = `activacion.estudiante.${uniqueId}@duocuc.cl`;
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const validExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // 1. Crear usuario en estado pendiente de activación con contraseña inutilizable
  const randomUnusable = crypto.randomBytes(32).toString('hex');
  const hashedUnusable = await bcrypt.hash(randomUnusable, 10);
  const userDoc = {
    _id: `user_act_${uniqueId}`,
    email: testEmail,
    fullName: 'Estudiante Activación Segura',
    nombre: 'Estudiante Activación Segura',
    role: 'estudiante',
    roleLabel: 'Estudiante Duoc UC',
    password: hashedUnusable,
    mustChangePassword: true,
    isActivated: false,
    activationTokenHash: tokenHash,
    activationTokenExpiresAt: validExpiresAt,
    attendanceRate: null,
    isRegisteredInDb: true,
    tokenVersion: 0,
    academicStatus: 'activo',
    isBlocked: false,
    isActive: true,
  };
  authService.registerUser(userDoc);

  await t.test('1. Cuenta pendiente de activación no puede iniciar sesión con contraseñas derivadas ni arbitrarias (403)', async () => {
    // Intento de login con RUT o cualquier clave
    await assert.rejects(
      () => authService.loginWithPassword(testEmail, '201234567g'),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /pendiente de activación/i);
        return true;
      }
    );
  });

  await t.test('2. Validación de token de activación válido devuelve metadatos del usuario', async () => {
    const verified = await authService.verifyActivationToken(rawToken);
    assert.equal(verified.success, true);
    assert.equal(verified.email, testEmail);
    assert.equal(verified.fullName, 'Estudiante Activación Segura');
  });

  await t.test('3. Token modificado o inválido es rechazado (400)', async () => {
    await assert.rejects(
      () => authService.verifyActivationToken('token_modificado_falso_123'),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /inválido/i);
        return true;
      }
    );
  });

  await t.test('4. Activación con contraseña débil es rechazada (mínimo 8 caracteres, mayúscula, minúscula y número)', async () => {
    await assert.rejects(
      () => authService.activateAccountWithToken(rawToken, 'debil1'),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /al menos 8 caracteres/i);
        return true;
      }
    );

    await assert.rejects(
      () => authService.activateAccountWithToken(rawToken, 'sololetrasminusculas'),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /mayúscula, una minúscula y un número/i);
        return true;
      }
    );
  });

  await t.test('5. Activación exitosa con contraseña fuerte define la credencial e invalida el token', async () => {
    const activateRes = await authService.activateAccountWithToken(rawToken, 'ClaveSegura2026!');
    assert.equal(activateRes.success, true);
    assert.match(activateRes.message, /activada exitosamente/i);

    // Comprobar que el usuario ahora está activo
    const updated = await authService.findRegisteredUser(testEmail, true);
    assert.equal(updated.isActivated, true);
    assert.equal(updated.mustChangePassword, false);
    assert.equal(updated.activationTokenHash, null);
    assert.equal(updated.activationTokenExpiresAt, null);
  });

  await t.test('6. Token reutilizado es rechazado inmediatamente (uso único)', async () => {
    await assert.rejects(
      () => authService.activateAccountWithToken(rawToken, 'OtraClaveSegura2026!'),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /inválido, expirado o ya utilizado/i);
        return true;
      }
    );
  });

  await t.test('7. Login con la nueva contraseña establecida por el titular es exitoso', async () => {
    const loginResult = await authService.loginWithPassword(testEmail, 'ClaveSegura2026!');
    assert.ok(loginResult.token, 'Debe emitir token JWT');
    assert.equal(loginResult.user.email, testEmail);
    assert.equal(loginResult.user.mustChangePassword, false);
  });

  await t.test('8. Token expirado es rechazado', async () => {
    const expiredEmail = `expirado.${uniqueId}@duocuc.cl`;
    const expiredRaw = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex');
    authService.registerUser({
      _id: `user_exp_${uniqueId}`,
      email: expiredEmail,
      fullName: 'Usuario Token Expirado',
      password: 'password_inutil',
      isActivated: false,
      activationTokenHash: expiredHash,
      activationTokenExpiresAt: new Date(Date.now() - 3600000), // Expirado hace 1 hora
      academicStatus: 'activo',
      isBlocked: false,
      isActive: true,
    });

    await assert.rejects(
      () => authService.verifyActivationToken(expiredRaw),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /expirado/i);
        return true;
      }
    );
  });

  await t.test('9. Cuenta bloqueada no puede ser activada', async () => {
    const blockedEmail = `bloqueado.${uniqueId}@duocuc.cl`;
    const blockedRaw = crypto.randomBytes(32).toString('hex');
    const blockedHash = crypto.createHash('sha256').update(blockedRaw).digest('hex');
    authService.registerUser({
      _id: `user_blk_${uniqueId}`,
      email: blockedEmail,
      fullName: 'Usuario Bloqueado',
      password: 'password_inutil',
      isActivated: false,
      activationTokenHash: blockedHash,
      activationTokenExpiresAt: validExpiresAt,
      academicStatus: 'activo',
      isBlocked: true,
      isActive: false,
    });

    await assert.rejects(
      () => authService.activateAccountWithToken(blockedRaw, 'ClaveNueva2026!'),
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /deshabilitada o suspendida/i);
        return true;
      }
    );
  });
});
