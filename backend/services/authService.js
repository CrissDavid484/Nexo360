const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const ActivityLog = require('../models/ActivityLog');
const emailService = require('./emailService');
const entraIdAdapter = require('./adapters/entraIdAdapter');
const { getJwtSecret, STAFF_ROLE_DEFAULTS } = require('../middleware/authMiddleware');
const SEED_USERS = require('../data/seedUsers.json');
const {
  DEFAULT_SEDE,
  createDeterministicRut,
  escapeRegex,
  sanitizeAccessibilityPreferences,
  validatePasswordStrength,
} = require('../utils/validationUtils');

const SENSITIVE_LOG_KEY_REGEX = /pass|token|jwt|secret|diagnostico|notas|ajuste/i;
const IN_MEMORY_LOG_CAP = 200;

function isDemoSeedingEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_ACCOUNTS === 'true';
}

function getDemoSeedPassword() {
  if (!isDemoSeedingEnabled()) return null;
  return process.env.DEMO_SEED_PASSWORD || `Duoc${new Date().getFullYear()}!`;
}

function generateRandomTempPassword() {
  return `Nexo${crypto.randomBytes(12).toString('base64url')}1!`;
}

function isUserBlockedOrInactive(user) {
  return (
    user.isBlocked === true ||
    user.isActive === false ||
    user.academicStatus === 'desercion_bloqueada'
  );
}

/**
 * Elimina recursivamente de metadata cualquier clave que coincida con credenciales o datos clínicos (Ley N° 21.719).
 */
function sanitizeLogMetadata(value, depth = 0) {
  if (depth > 5 || value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogMetadata(item, depth + 1));
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (!SENSITIVE_LOG_KEY_REGEX.test(k)) {
        clean[k] = sanitizeLogMetadata(v, depth + 1);
      }
    }
    return clean;
  }
  return value;
}

function formatActivityLog(doc = {}) {
  const rawMeta =
    doc.metadata && typeof doc.metadata === 'object' && !Array.isArray(doc.metadata)
      ? sanitizeLogMetadata(doc.metadata)
      : {};
  return {
    id: String(doc._id || doc.id || crypto.randomUUID()),
    action: String(doc.action || ''),
    userEmail: String(doc.userEmail || ''),
    userName: String(doc.userName || doc.userEmail || 'Usuario'),
    userRole: String(doc.userRole || 'estudiante'),
    details: String(doc.details || ''),
    metadata: rawMeta,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  };
}

function createAuthError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Respaldo en memoria exclusivo para entornos no productivos cuando MongoDB no está conectado
const inMemoryUsers = new Map();
const inMemoryLogs = [];
const SEED_EMAIL_SET = new Set(SEED_USERS.map((u) => u.email.toLowerCase()));

if (process.env.NODE_ENV !== 'production') {
  for (const seedUser of SEED_USERS) {
    inMemoryUsers.set(seedUser.email.toLowerCase(), {
      _id: `seed_${seedUser.role}_${seedUser.email.split('@')[0]}`,
      _isSeedDemo: true,
      tokenVersion: 0,
      isBlocked: false,
      isActive: true,
      ...seedUser,
    });
  }
}

/**
 * Derivación de nombre legible a partir del correo institucional Duoc UC.
 */
function resolveNameFromEmail(email = '') {
  const [localPart] = String(email || '').trim().toLowerCase().split('@');
  if (!localPart) return 'Estudiante Duoc UC';
  if (localPart === 'c.guzman' || localPart === 'cri.guzmang') return 'Cristian Guzmán';
  if (localPart === 'an.ordenesd') return 'Angelo Órdenes';

  const segments = localPart.split(/[._-]/).filter(Boolean);
  return segments.map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1)).join(' ');
}

/**
 * Construye plantilla unificada de perfil por defecto para cuentas verificadas.
 */
function buildDefaultStudentProfile(cleanEmail, overrides = {}) {
  const derivedName = resolveNameFromEmail(cleanEmail);
  return {
    email: cleanEmail,
    fullName: derivedName,
    nombre: derivedName,
    rut: createDeterministicRut(cleanEmail),
    role: 'estudiante',
    roleLabel: 'Estudiante Regular Duoc UC',
    isPaedis: false,
    academicStatus: 'activo',
    statusReason: 'Estudiante regular activo',
    attendanceRate: null,
    hasUsedSimulator: false,
    simulatorUsageCount: 0,
    career: 'Ingeniería en Informática',
    carrera: 'Ingeniería en Informática',
    campus: DEFAULT_SEDE,
    sede: DEFAULT_SEDE,
    accessibilityPreferences: sanitizeAccessibilityPreferences({}),
    isRegisteredInDb: false,
    tokenVersion: 0,
    isBlocked: false,
    isActive: true,
    ...overrides,
  };
}

class AuthService {
  getOfficialLoginUrl(email = '') {
    if (process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL) {
      const base = process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
      const clean = typeof email === 'string' ? email.trim().toLowerCase() : '';
      return clean ? `${base}${base.includes('?') ? '&' : '?'}login_hint=${encodeURIComponent(clean)}` : base;
    }
    if (entraIdAdapter.isConfigured()) {
      const clean = typeof email === 'string' ? email.trim().toLowerCase() : '';
      return clean
        ? `${entraIdAdapter.authorizeEndpoint}?login_hint=${encodeURIComponent(clean)}`
        : entraIdAdapter.authorizeEndpoint;
    }
    return null;
  }

  generateRandomTempPassword() {
    return generateRandomTempPassword();
  }

  isSeededDemoEmail(email = '') {
    return SEED_EMAIL_SET.has(String(email || '').trim().toLowerCase());
  }

  getDemoAccountsSummary() {
    return SEED_USERS.map((u) => ({
      email: u.email,
      fullName: u.fullName,
      roleLabel: u.roleLabel,
    }));
  }

  /**
   * Sembrar usuarios institucionales iniciales directamente en MongoDB (solo en dev/test con ENABLE_DEMO_ACCOUNTS=true).
   */
  async seedInstitutionalUsers() {
    if (mongoose.connection.readyState !== 1) {
      console.log('[AuthService] MongoDB no conectado. Omitiendo seed institucional en BD.');
      return;
    }

    if (!isDemoSeedingEnabled()) {
      return;
    }

    const demoSeedPassword = getDemoSeedPassword();

    for (const seedUser of SEED_USERS) {
      try {
        const cleanEmail = seedUser.email.toLowerCase();
        const existing = await UserProfile.findOne({ email: cleanEmail });
        if (!existing) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(
            seedUser.password || demoSeedPassword,
            salt
          );

          await UserProfile.create({
            ...seedUser,
            password: hashedPassword,
            email: cleanEmail,
            nombre: seedUser.fullName,
            career: seedUser.career,
            carrera: seedUser.career,
            campus: seedUser.campus || DEFAULT_SEDE,
            sede: seedUser.campus || DEFAULT_SEDE,
            accessibilityPreferences: sanitizeAccessibilityPreferences(
              seedUser.accessibilityPreferences
            ),
            isRegisteredInDb: true,
            tokenVersion: 0,
            isBlocked: false,
            isActive: true,
          });
          console.log('[AuthService] Usuario institucional sembrado en MongoDB.');
        } else if (!existing.courseAttendance || existing.courseAttendance.length === 0) {
          if (Array.isArray(seedUser.courseAttendance) && seedUser.courseAttendance.length > 0) {
            existing.courseAttendance = seedUser.courseAttendance;
            if (seedUser.satIntervention) {
              existing.satIntervention = seedUser.satIntervention;
            }
            await existing.save();
            console.log('[AuthService] Asistencia SAT actualizada en MongoDB.');
          }
        }
      } catch {
        console.warn('[AuthService] Aviso sembrando usuario institucional en MongoDB.');
      }
    }
  }

  /**
   * Provisiona un usuario autenticado vía OIDC verificado con contraseña temporal aleatoria cifrada.
   */
  async findOrCreateVerifiedOidcUser(verifiedProfile) {
    const cleanEmail = String(verifiedProfile?.email || '').trim().toLowerCase();
    if (!cleanEmail) return null;

    const existing = await this.findRegisteredUser(cleanEmail, false);
    if (existing) {
      return existing;
    }

    const tempPassword = generateRandomTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const newUserData = buildDefaultStudentProfile(cleanEmail, {
      fullName: verifiedProfile.fullName || resolveNameFromEmail(cleanEmail),
      nombre: verifiedProfile.fullName || resolveNameFromEmail(cleanEmail),
      role: verifiedProfile.inferredRole || 'estudiante',
      password: hashedPassword,
      mustChangePassword: true,
      isRegisteredInDb: false,
    });

    if (mongoose.connection.readyState === 1) {
      return UserProfile.create(newUserData);
    }

    const memUser = { _id: `oidc_${Date.now()}`, ...newUserData };
    inMemoryUsers.set(cleanEmail, memUser);
    return memUser;
  }

  /**
   * Busca un usuario registrado sin auto-crearlo. Fail-closed en producción o ante fallo de BD.
   */
  async findRegisteredUser(cleanEmail, includeSecrets = false) {
    const normalized = String(cleanEmail || '').trim().toLowerCase();
    if (!normalized) return null;

    if (mongoose.connection.readyState === 1) {
      const query = UserProfile.findOne({ email: { $eq: normalized } });
      if (includeSecrets) {
        query.select('+password +passwordResetTokenHash +passwordResetExpires');
      }
      return query;
    }

    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    const mem = inMemoryUsers.get(normalized) || null;
    if (mem && includeSecrets && !mem.password && mem._isSeedDemo && isDemoSeedingEnabled()) {
      const seedPwd = getDemoSeedPassword();
      if (seedPwd) {
        const salt = await bcrypt.genSalt(10);
        mem.password = await bcrypt.hash(seedPwd, salt);
      }
    }
    return mem;
  }

  /**
   * Persiste una nueva contraseña cifrada e incrementa tokenVersion para invalidar sesiones previas.
   */
  async persistPasswordUpdate(cleanEmail, hashedPassword, clearResetFields = false) {
    const fields = {
      password: hashedPassword,
      mustChangePassword: false,
      ...(clearResetFields
        ? { passwordResetTokenHash: '', passwordResetExpires: null }
        : {}),
    };

    const mem = inMemoryUsers.get(cleanEmail);
    if (mem) {
      Object.assign(mem, fields);
      mem.tokenVersion = Number(mem.tokenVersion || 0) + 1;
    }

    if (mongoose.connection.readyState === 1) {
      await UserProfile.findOneAndUpdate(
        { email: { $eq: cleanEmail } },
        { $set: fields, $inc: { tokenVersion: 1 } },
        { returnDocument: 'after' }
      );
    }
  }

  /**
   * Actualiza y persiste preferencias de accesibilidad en MongoDB y memoria local.
   */
  async updateAccessibilityPreferences(email, sanitizedPreferences) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const normalizedPrefs = sanitizeAccessibilityPreferences(sanitizedPreferences);

    const existingMem = inMemoryUsers.get(cleanEmail);
    if (existingMem) {
      existingMem.accessibilityPreferences = normalizedPrefs;
    }

    if (mongoose.connection.readyState === 1) {
      const updatedUser = await UserProfile.findOneAndUpdate(
        { email: { $eq: cleanEmail } },
        { $set: { accessibilityPreferences: normalizedPrefs } },
        { returnDocument: 'after', runValidators: true }
      );

      return {
        persistedInDb: true,
        accessibilityPreferences: sanitizeAccessibilityPreferences(
          updatedUser?.accessibilityPreferences?.toObject?.() ||
            updatedUser?.accessibilityPreferences ||
            normalizedPrefs
        ),
      };
    }

    return {
      persistedInDb: false,
      accessibilityPreferences: normalizedPrefs,
    };
  }

  /**
   * Actualiza campos de perfil en MongoDB y mantiene sincronizada la caché en memoria.
   */
  async updateProfileFields(email, updateFields, incFields = null) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const mem = inMemoryUsers.get(cleanEmail);
    if (mem) {
      Object.assign(mem, updateFields);
      if (incFields && typeof incFields.simulatorUsageCount === 'number') {
        mem.simulatorUsageCount = (mem.simulatorUsageCount || 0) + incFields.simulatorUsageCount;
      }
    }

    if (mongoose.connection.readyState === 1) {
      const updateOp = incFields ? { $set: updateFields, $inc: incFields } : { $set: updateFields };
      const updatedUser = await UserProfile.findOneAndUpdate(
        { email: { $eq: cleanEmail } },
        updateOp,
        { returnDocument: 'after', runValidators: true }
      );
      return { persistedInDb: true, user: updatedUser };
    }

    return { persistedInDb: false, user: mem || null };
  }

  /**
   * Genera un token criptográfico de recuperación (30 min) y guarda su hash SHA-256.
   */
  async createPasswordResetToken(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw createAuthError(400, 'Correo institucional inválido.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const mem = inMemoryUsers.get(cleanEmail);
    if (mem) {
      mem.passwordResetTokenHash = tokenHash;
      mem.passwordResetExpires = expiresAt;
    }

    if (mongoose.connection.readyState === 1) {
      await UserProfile.findOneAndUpdate(
        { email: { $eq: cleanEmail } },
        {
          $set: {
            passwordResetTokenHash: tokenHash,
            passwordResetExpires: expiresAt,
          },
        },
        { returnDocument: 'after' }
      );
    }

    return rawToken;
  }

  /**
   * Inicia flujo de recuperación de contraseña sin enumeración de usuarios.
   */
  async requestPasswordReset(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const userDoc = await this.findRegisteredUser(cleanEmail, false);
    if (!userDoc) {
      return { delivered: false, deliveryMode: 'none', devPreview: null };
    }

    const resetToken = await this.createPasswordResetToken(cleanEmail);
    const fullName = userDoc.fullName || userDoc.nombre || cleanEmail;
    const emailResult = await emailService.sendPasswordResetEmail({
      to: cleanEmail,
      fullName,
      resetToken,
    });

    await this.logActivity({
      userId: userDoc._id || userDoc.id,
      userEmail: cleanEmail,
      userName: fullName,
      userRole: userDoc.role || 'estudiante',
      action: 'password_reset_requested',
      details: 'Solicitud de restablecimiento de contraseña registrada.',
    });

    const isNonProdFallback =
      process.env.NODE_ENV !== 'production' && emailResult.deliveryMode === 'fallback';
    return {
      delivered: emailResult.delivered,
      deliveryMode: emailResult.deliveryMode,
      devPreview: isNonProdFallback ? emailResult.devPreview : null,
    };
  }

  /**
   * Valida token de recuperación en tiempo constante, actualiza la contraseña cifrada e incrementa tokenVersion.
   */
  async resetPasswordWithToken(email, token, newPassword) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanToken = typeof token === 'string' ? token.trim() : '';

    if (!cleanEmail || !cleanToken) {
      throw createAuthError(400, 'Debe proporcionar su correo institucional y el código de recuperación.');
    }

    if (!validatePasswordStrength(newPassword)) {
      throw createAuthError(
        400,
        'La nueva contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra y un número.'
      );
    }

    const userDoc = await this.findRegisteredUser(cleanEmail, true);
    if (!userDoc || !userDoc.passwordResetTokenHash || !userDoc.passwordResetExpires) {
      throw createAuthError(400, 'El enlace o código de recuperación es inválido o ha expirado.');
    }

    if (new Date(userDoc.passwordResetExpires).getTime() <= Date.now()) {
      throw createAuthError(400, 'El enlace o código de recuperación ha expirado. Solicita uno nuevo.');
    }

    const candidateHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
    const storedBuf = Buffer.from(String(userDoc.passwordResetTokenHash), 'utf8');
    const candidateBuf = Buffer.from(candidateHash, 'utf8');
    if (
      storedBuf.length !== candidateBuf.length ||
      !crypto.timingSafeEqual(storedBuf, candidateBuf)
    ) {
      throw createAuthError(400, 'El enlace o código de recuperación es inválido o ha expirado.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.persistPasswordUpdate(cleanEmail, hashedPassword, true);

    await this.logActivity({
      userId: userDoc._id || userDoc.id,
      userEmail: cleanEmail,
      userName: userDoc.fullName || userDoc.nombre || cleanEmail,
      userRole: userDoc.role || 'estudiante',
      action: 'password_reset_completed',
      details: 'Contraseña restablecida exitosamente mediante token de recuperación.',
    });

    return { success: true };
  }

  /**
   * Cambia la contraseña de un usuario autenticado verificando su contraseña actual e incrementa tokenVersion.
   */
  async changeUserPassword(email, currentPassword, newPassword) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || typeof currentPassword !== 'string' || !currentPassword) {
      throw createAuthError(400, 'Debe ingresar su contraseña actual y la nueva contraseña.');
    }

    if (!validatePasswordStrength(newPassword)) {
      throw createAuthError(
        400,
        'La nueva contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra y un número.'
      );
    }

    if (newPassword === currentPassword) {
      throw createAuthError(400, 'La nueva contraseña debe ser diferente a la contraseña actual.');
    }

    const userDoc = await this.findRegisteredUser(cleanEmail, true);
    if (!userDoc) {
      throw createAuthError(404, 'Usuario no encontrado.');
    }

    const isCurrentValid = await this.verifyUserPassword(userDoc, currentPassword);
    if (!isCurrentValid) {
      throw createAuthError(401, 'La contraseña actual es incorrecta.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.persistPasswordUpdate(cleanEmail, hashedPassword, false);

    await this.logActivity({
      userId: userDoc._id || userDoc.id,
      userEmail: cleanEmail,
      userName: userDoc.fullName || userDoc.nombre || cleanEmail,
      userRole: userDoc.role || 'estudiante',
      action: 'password_changed',
      details: 'El usuario actualizó su contraseña desde su perfil.',
    });

    return { success: true };
  }

  /**
   * Inicio de sesión directo con contraseña institucional cifrada (bcrypt).
   * Sin auto-creación de cuentas y fail-closed en producción si MongoDB está desconectado.
   */
  async loginWithPassword(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw createAuthError(400, 'Por favor ingrese su correo institucional y contraseña.');
    }

    if (process.env.NODE_ENV === 'production' && mongoose.connection.readyState !== 1) {
      throw createAuthError(
        503,
        'Servicio de autenticación no disponible: base de datos desconectada.'
      );
    }

    let userDoc;
    try {
      userDoc = await this.findRegisteredUser(cleanEmail, true);
    } catch {
      throw createAuthError(
        503,
        'Servicio de autenticación temporalmente no disponible. Intente nuevamente.'
      );
    }

    if (!userDoc) {
      throw createAuthError(
        401,
        'Credenciales inválidas. Verifique su correo institucional y contraseña.'
      );
    }

    if (userDoc.isActivated === false) {
      throw createAuthError(
        403,
        'Cuenta pendiente de activación: Por favor revisa tu correo electrónico para definir tu contraseña institucional mediante el enlace de activación seguro.'
      );
    }

    const isPasswordValid = await this.verifyUserPassword(userDoc, password);
    if (!isPasswordValid) {
      throw createAuthError(
        401,
        'Credenciales inválidas. Verifique su correo institucional y contraseña.'
      );
    }

    if (isUserBlockedOrInactive(userDoc)) {
      throw createAuthError(
        403,
        'Acceso denegado: Esta cuenta institucional se encuentra deshabilitada o suspendida.'
      );
    }

    if (mongoose.connection.readyState === 1 && userDoc._id && typeof userDoc.save === 'function') {
      try {
        userDoc.lastLogin = new Date();
        await userDoc.save();
      } catch {
        console.warn('[AuthService] No se pudo actualizar lastLogin en MongoDB.');
      }
    }

    const formatted = this.formatUserResponse(userDoc);
    const token = this.generateJwt(formatted);

    await this.logActivity({
      userId: formatted.id,
      userEmail: cleanEmail,
      userName: formatted.fullName,
      userRole: formatted.role,
      action: 'login',
      details: 'Inicio de sesión institucional exitoso con contraseña cifrada (bcrypt).',
    });

    return {
      token,
      user: formatted,
      isRegisteredInDb: formatted.isRegisteredInDb !== false,
      officialLoginUrl: this.getOfficialLoginUrl(cleanEmail),
    };
  }

  /**
   * Verifica exclusivamente hashes bcrypt ($2a$/$2b$). Sin contraseñas por defecto ni texto plano.
   */
  async verifyUserPassword(userDoc, password) {
    if (!userDoc || typeof password !== 'string' || !password) return false;
    const stored = userDoc.password;
    if (typeof stored !== 'string' || (!stored.startsWith('$2a$') && !stored.startsWith('$2b$'))) {
      return false;
    }
    return bcrypt.compare(password, stored);
  }

  /**
   * Valida un token de activación de cuenta (de un solo uso, con vencimiento).
   */
  async verifyActivationToken(token) {
    if (!token || typeof token !== 'string' || !token.trim()) {
      throw createAuthError(400, 'Token de activación no proporcionado o inválido.');
    }
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    let userDoc;
    if (mongoose.connection.readyState === 1) {
      userDoc = await UserProfile.findOne({
        activationTokenHash: tokenHash,
        activationTokenExpiresAt: { $gt: new Date() },
      });
    } else {
      userDoc = Array.from(inMemoryUsers.values()).find(
        (u) =>
          u.activationTokenHash === tokenHash &&
          u.activationTokenExpiresAt &&
          new Date(u.activationTokenExpiresAt) > new Date()
      );
    }

    if (!userDoc) {
      throw createAuthError(400, 'Token de activación inválido, expirado o ya utilizado.');
    }

    if (isUserBlockedOrInactive(userDoc)) {
      throw createAuthError(403, 'Acceso denegado: Esta cuenta institucional se encuentra deshabilitada o suspendida.');
    }

    return {
      success: true,
      email: userDoc.email,
      fullName: userDoc.fullName || userDoc.nombre,
      role: userDoc.role,
      roleLabel: userDoc.roleLabel,
    };
  }

  /**
   * Activa una cuenta institucional permitiendo al titular definir su propia contraseña.
   */
  async activateAccountWithToken(token, newPassword) {
    if (!token || typeof token !== 'string' || !token.trim()) {
      throw createAuthError(400, 'Token de activación no proporcionado o inválido.');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw createAuthError(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasDigit) {
      throw createAuthError(
        400,
        'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número.'
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    let userDoc;
    if (mongoose.connection.readyState === 1) {
      userDoc = await UserProfile.findOne({
        activationTokenHash: tokenHash,
        activationTokenExpiresAt: { $gt: new Date() },
      }).select('+password +activationTokenHash');
    } else {
      userDoc = Array.from(inMemoryUsers.values()).find(
        (u) =>
          u.activationTokenHash === tokenHash &&
          u.activationTokenExpiresAt &&
          new Date(u.activationTokenExpiresAt) > new Date()
      );
    }

    if (!userDoc) {
      throw createAuthError(400, 'Token de activación inválido, expirado o ya utilizado.');
    }

    if (isUserBlockedOrInactive(userDoc)) {
      throw createAuthError(403, 'Acceso denegado: Esta cuenta institucional se encuentra deshabilitada o suspendida.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (mongoose.connection.readyState === 1 && typeof userDoc.save === 'function') {
      userDoc.password = hashedPassword;
      userDoc.activationTokenHash = null;
      userDoc.activationTokenExpiresAt = null;
      userDoc.isActivated = true;
      userDoc.mustChangePassword = false;
      userDoc.statusUpdatedAt = new Date();
      await userDoc.save();
    } else {
      userDoc.password = hashedPassword;
      userDoc.activationTokenHash = null;
      userDoc.activationTokenExpiresAt = null;
      userDoc.isActivated = true;
      userDoc.mustChangePassword = false;
      userDoc.statusUpdatedAt = new Date();
      inMemoryUsers.set(userDoc.email.toLowerCase(), userDoc);
    }

    await this.logActivity({
      userId: userDoc._id || userDoc.id,
      userEmail: userDoc.email,
      userName: userDoc.fullName || userDoc.nombre,
      userRole: userDoc.role,
      action: 'account_activated',
      details: 'Cuenta institucional activada exitosamente por el titular con contraseña propia. Trazabilidad Ley N° 21.719.',
    });

    return {
      success: true,
      message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña institucional.',
    };
  }

  /**
   * Completa inicio de sesión tras validación criptográfica OIDC de Microsoft Entra ID.
   */
  async completeOidcLogin(verifiedProfile) {
    const cleanEmail = String(verifiedProfile?.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw createAuthError(401, 'Token OIDC sin correo institucional válido.');
    }

    if (process.env.NODE_ENV === 'production' && mongoose.connection.readyState !== 1) {
      throw createAuthError(
        503,
        'Servicio de autenticación no disponible: base de datos desconectada.'
      );
    }

    const user = await this.findOrCreateVerifiedOidcUser(verifiedProfile);
    if (!user) {
      throw createAuthError(401, 'No se pudo resolver la identidad OIDC.');
    }

    if (isUserBlockedOrInactive(user)) {
      throw createAuthError(
        403,
        'Acceso denegado: Esta cuenta institucional se encuentra deshabilitada o suspendida.'
      );
    }

    if (mongoose.connection.readyState === 1 && user._id && typeof user.save === 'function') {
      try {
        user.lastLogin = new Date();
        await user.save();
      } catch {
        console.warn('[AuthService] No se pudo actualizar lastLogin OIDC en MongoDB.');
      }
    }

    const formatted = this.formatUserResponse(user);
    const token = this.generateJwt(formatted);

    await this.logActivity({
      userId: formatted.id,
      userEmail: cleanEmail,
      userName: formatted.fullName,
      userRole: formatted.role,
      action: 'login',
      details: 'Inicio de sesión institucional completado vía Microsoft Entra ID (OIDC RS256).',
    });

    return {
      token,
      user: formatted,
      isRegisteredInDb: formatted.isRegisteredInDb !== false,
      officialLoginUrl: this.getOfficialLoginUrl(cleanEmail),
    };
  }

  /**
   * Inicio de sesión demo exclusivo para entorno non-prod con ENABLE_DEMO_ACCOUNTS==='true' y cuentas semilla conocidas.
   */
  async completeDemoSsoLogin(email) {
    if (!isDemoSeedingEnabled()) {
      throw createAuthError(401, 'El acceso mediante cuentas demo está deshabilitado.');
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !this.isSeededDemoEmail(cleanEmail)) {
      throw createAuthError(
        401,
        'Cuenta no autorizada para acceso demo. Solo cuentas institucionales demo sembradas.'
      );
    }

    const user = await this.findRegisteredUser(cleanEmail, false);
    if (!user) {
      throw createAuthError(401, 'Cuenta demo no encontrada.');
    }

    if (isUserBlockedOrInactive(user)) {
      throw createAuthError(
        403,
        'Acceso denegado: Esta cuenta institucional se encuentra deshabilitada o suspendida.'
      );
    }

    const formatted = this.formatUserResponse(user);
    const token = this.generateJwt(formatted);

    await this.logActivity({
      userId: formatted.id,
      userEmail: cleanEmail,
      userName: formatted.fullName,
      userRole: formatted.role,
      action: 'login',
      details: 'Inicio de sesión demo institucional completado en entorno no productivo.',
    });

    return {
      token,
      user: formatted,
      isRegisteredInDb: formatted.isRegisteredInDb !== false,
      officialLoginUrl: this.getOfficialLoginUrl(cleanEmail),
    };
  }

  /**
   * Registrar interacción del estudiante con el Simulador de Toma de Ramos.
   */
  async recordSimulatorUsage(user) {
    if (!user || !user.email) return;
    const cleanEmail = user.email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        await UserProfile.findOneAndUpdate(
          { email: cleanEmail },
          {
            $set: { hasUsedSimulator: true, lastSimulatorUsage: new Date() },
            $inc: { simulatorUsageCount: 1 },
          }
        );
      } catch {
        console.warn('[AuthService] Error actualizando uso de simulador.');
      }
    }

    const mem = inMemoryUsers.get(cleanEmail);
    if (mem) {
      mem.hasUsedSimulator = true;
      mem.simulatorUsageCount = (mem.simulatorUsageCount || 0) + 1;
      mem.lastSimulatorUsage = new Date();
    }

    await this.logActivity({
      userId: user.id || user._id,
      userEmail: cleanEmail,
      userName: user.fullName || user.nombre || cleanEmail,
      userRole: user.role || 'estudiante',
      action: 'used_simulator_toma_ramos',
      details: 'El estudiante accedió e interactuó con el Simulador de Toma de Ramos.',
    });
  }

  /**
   * Registrar auditoría en la colección ActivityLog de MongoDB.
   */
  async logActivity({ userId, userEmail, userName, userRole, action, details, metadata = {} }) {
    const safeMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? sanitizeLogMetadata(metadata)
        : {};
    const logEntry = {
      id: crypto.randomUUID(),
      userId: userId ? String(userId) : undefined,
      userEmail: (userEmail || '').toLowerCase(),
      userName: userName || userEmail || 'Usuario',
      userRole: userRole || 'estudiante',
      action: action || 'login',
      details: details || '',
      metadata: safeMetadata,
      createdAt: new Date(),
    };

    inMemoryLogs.unshift(logEntry);
    if (inMemoryLogs.length > IN_MEMORY_LOG_CAP) inMemoryLogs.pop();

    if (mongoose.connection.readyState === 1) {
      try {
        await ActivityLog.create(logEntry);
      } catch {
        console.warn('[AuthService] Error guardando log en MongoDB.');
      }
    }
  }

  getRecentLogs(limit = 10) {
    return inMemoryLogs.slice(0, limit);
  }

  /**
   * Consulta paginada y filtrada de ActivityLog con sanitización de metadata y fallback en memoria.
   */
  async queryActivityLogs({ action, q, page = 1, limit = 25 } = {}) {
    const parsedPage = Number.parseInt(String(page ?? 1), 10);
    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const parsedLimit = Number.parseInt(String(limit ?? 25), 10);
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 25;
    const safeAction = typeof action === 'string' ? action.trim().slice(0, 80) : '';
    const rawQ = typeof q === 'string' ? q.trim().slice(0, 100) : '';
    const escapedQ = rawQ ? escapeRegex(rawQ, 100) : '';
    const skip = (safePage - 1) * safeLimit;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (safeAction) query.action = { $eq: safeAction };
        if (escapedQ) {
          const rx = { $regex: escapedQ, $options: 'i' };
          query.$or = [{ action: rx }, { userEmail: rx }, { userName: rx }, { details: rx }];
        }
        const [docs, total, distinctActions] = await Promise.all([
          ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
          ActivityLog.countDocuments(query),
          ActivityLog.distinct('action'),
        ]);
        return {
          logs: docs.map(formatActivityLog),
          total,
          page: safePage,
          limit: safeLimit,
          actions: distinctActions.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        };
      } catch {
        console.warn('[AuthService] Fallback a memoria consultando ActivityLog.');
      }
    }

    const allLogs = this.getRecentLogs(inMemoryLogs.length || IN_MEMORY_LOG_CAP);
    const actions = Array.from(
      new Set(allLogs.map((entry) => entry.action).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    const searchRx = escapedQ ? new RegExp(escapedQ, 'i') : null;
    const filtered = allLogs.filter((entry) => {
      if (safeAction && entry.action !== safeAction) return false;
      if (searchRx) {
        const hay = [entry.action, entry.userEmail, entry.userName, entry.details];
        if (!hay.some((field) => searchRx.test(String(field || '')))) return false;
      }
      return true;
    });

    return {
      logs: filtered.slice(skip, skip + safeLimit).map(formatActivityLog),
      total: filtered.length,
      page: safePage,
      limit: safeLimit,
      actions,
    };
  }

  /**
   * Obtener todos los usuarios registrados directamente desde MongoDB (con respaldo en memoria solo non-prod).
   */
  async getAllUsers() {
    if (mongoose.connection.readyState === 1) {
      const docs = await UserProfile.find({}).lean();
      return docs.map((d) => this.formatUserResponse(d));
    }

    if (process.env.NODE_ENV === 'production') {
      throw createAuthError(503, 'Base de datos no disponible en producción.');
    }

    return Array.from(inMemoryUsers.values()).map((u) => this.formatUserResponse(u));
  }

  /**
   * Formateo coherente 1:1 de los campos del usuario institucional.
   */
  formatUserResponse(userProfile = {}) {
    const raw = typeof userProfile.toObject === 'function' ? userProfile.toObject() : userProfile;
    const email = (raw.email || '').toLowerCase().trim();

    const id = raw._id ? String(raw._id) : raw.id || `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const fullName = raw.fullName || raw.nombre || email || 'Estudiante Duoc UC';
    const rut = raw.rut || createDeterministicRut(email);
    const role = raw.role || 'estudiante';
    const roleLabel = raw.roleLabel || 'Estudiante Regular Duoc UC';
    const isPaedis = raw.isPaedis === true || role === 'estudiante_paedis';
    const isStaffRole =
      role === 'admin' || role === 'administrador' || role === 'coordinador_paedis';
    const fallbackCareer = isStaffRole ? '' : 'Ingeniería en Informática';
    const career = raw.career || raw.carrera || fallbackCareer;
    const campus = raw.campus || raw.sede || DEFAULT_SEDE;
    const address = raw.address || raw.direccion || 'Por actualizar';
    const phone = raw.phone || raw.telefonoPersonal || '+56 9 0000 0000';
    const personalEmail = raw.personalEmail || raw.emailPersonal || email;

    const rawA11y =
      raw.accessibilityPreferences && typeof raw.accessibilityPreferences.toObject === 'function'
        ? raw.accessibilityPreferences.toObject()
        : raw.accessibilityPreferences;
    const accessibilityPreferences = sanitizeAccessibilityPreferences(rawA11y || {});

    return {
      id,
      _id: id,
      email,
      firstName: raw.firstName || '',
      paternalLastName: raw.paternalLastName || '',
      maternalLastName: raw.maternalLastName || '',
      fullName,
      nombre: fullName,
      rut,
      role,
      rol: role,
      roleLabel,
      isPaedis,
      disabilityProfile: raw.disabilityProfile || 'ninguna',
      mustChangePassword: Boolean(raw.mustChangePassword),
      tokenVersion: Number(raw.tokenVersion ?? 0),
      isBlocked: raw.isBlocked === true,
      isActive: raw.isActive !== false,
      career,
      carrera: career,
      campus,
      sede: campus,
      academicStatus: raw.academicStatus || 'activo',
      statusReason: raw.statusReason || 'Estudiante regular activo',
      attendanceRate:
        raw.attendanceRate !== undefined && raw.attendanceRate !== null && !Number.isNaN(Number(raw.attendanceRate))
          ? Number(raw.attendanceRate)
          : null,
      isActivated: raw.isActivated !== false,
      hasUsedSimulator: Boolean(raw.hasUsedSimulator),
      simulatorUsageCount: Number(raw.simulatorUsageCount || 0),
      lastSimulatorUsage: raw.lastSimulatorUsage || null,
      accessibilityPreferences,
      enrolledCourses: Array.isArray(raw.enrolledCourses) ? raw.enrolledCourses : [],
      courseAttendance: Array.isArray(raw.courseAttendance) ? raw.courseAttendance : [],
      satIntervention: raw.satIntervention
        ? {
            riskLevel: raw.satIntervention.riskLevel || 'NONE',
            assignedTo: raw.satIntervention.assignedTo || 'Coordinación PAEDIS',
            slaDeadline: raw.satIntervention.slaDeadline || null,
            status: raw.satIntervention.status || 'PENDING',
            tutorPaedisAsignado:
              raw.satIntervention.tutorPaedisAsignado ||
              (raw.tutorPaedisAsignado === 'Sí' || isPaedis ? 'Sí' : 'No'),
            notes: raw.satIntervention.notes || '',
            lastUpdated: raw.satIntervention.lastUpdated || new Date(),
          }
        : {
            riskLevel: 'NONE',
            assignedTo: 'Coordinación PAEDIS',
            slaDeadline: null,
            status: 'PENDING',
            tutorPaedisAsignado: isPaedis ? 'Sí' : 'No',
            notes: '',
            lastUpdated: new Date(),
          },
      photo: raw.photo || '',
      address,
      direccion: address,
      personalEmail,
      emailPersonal: personalEmail,
      phone,
      telefonoPersonal: phone,
      emergencyContact: raw.emergencyContact || 'Contacto Familiar',
      emergencyPhone: raw.emergencyPhone || '+56 9 1234 5678',
      tutorPaedisAsignado:
        raw.tutorPaedisAsignado ||
        raw.satIntervention?.tutorPaedisAsignado ||
        (isPaedis || (raw.tutorParAsignado && raw.tutorParAsignado !== 'Sin tutor asignado')
          ? 'Sí'
          : 'No'),
      tutorParAsignado:
        raw.tutorParAsignado || (isPaedis ? 'Coordinación PAEDIS Duoc UC' : 'Sin tutor asignado'),
      diagnosticoDeclarado: raw.diagnosticoDeclarado || '',
      ajustesAprobados: Array.isArray(raw.ajustesAprobados) ? raw.ajustesAprobados : [],
      barreraPaedis: raw.barreraPaedis || (isPaedis ? 'Visual / Sensorial' : ''),
      acreditacionPaedis: raw.acreditacionPaedis || (isPaedis ? 'Credencial RND SENADIS' : ''),
      notasConfidencialesPaedis: raw.notasConfidencialesPaedis || '',
      fichaDocenteNotificada: Boolean(raw.fichaDocenteNotificada),
      fechaNotificacionDocente: raw.fechaNotificacionDocente || null,
      acusesDocentes: Array.isArray(raw.acusesDocentes) ? raw.acusesDocentes : [],
      vigenciaSemestrePaedis: raw.vigenciaSemestrePaedis || '2026-1',
      fechaRenovacionSemestral: raw.fechaRenovacionSemestral || null,
      isRegisteredInDb: raw.isRegisteredInDb !== false,
      lastLogin: raw.lastLogin || new Date(),
      consentimientoLey21719: raw.consentimientoLey21719 || {
        aceptado: false,
        fechaAceptacion: null,
        finalidadTratamiento:
          'Tratamiento de datos personales para gestión académica conforme a Ley N° 21.719',
      },
      consentMetadata: raw.consentMetadata || {
        consentGiven: false,
        consentDate: null,
        consentVersion: '1.0 - Ley N° 21.719',
        law: 'Ley N° 21.719 de Protección de Datos Personales de Chile',
        purpose: [
          'gestion_academica',
          'apoyo_paedis_inclusion',
          'simulador_toma_ramos',
          'seguimiento_asistencia',
        ],
        dataRetentionPolicy:
          'Conservación durante el periodo académico activo conforme al Art. 12 de la Ley N° 21.719',
        arcoRightsNotice: 'Derechos ARCO garantizados por Duoc UC',
      },
      permissions: Array.isArray(raw.permissions)
        ? raw.permissions
        : (STAFF_ROLE_DEFAULTS[role]?.permissions || []),
      badges: Array.isArray(raw.badges)
        ? raw.badges
        : (STAFF_ROLE_DEFAULTS[role]?.badges || []),
    };
  }

  /**
   * Contrato de perfil público (estudiantes y vistas generales).
   * Excluye RUT, teléfono, email personal y expedientes clínicos confidenciales.
   */
  toPublicProfile(userProfile) {
    const formatted = this.formatUserResponse(userProfile);
    return {
      id: formatted.id,
      _id: formatted._id,
      email: formatted.email,
      fullName: formatted.fullName,
      nombre: formatted.nombre,
      firstName: formatted.firstName,
      paternalLastName: formatted.paternalLastName,
      maternalLastName: formatted.maternalLastName,
      role: formatted.role,
      rol: formatted.rol,
      roleLabel: formatted.roleLabel,
      career: formatted.career,
      carrera: formatted.carrera,
      campus: formatted.campus,
      sede: formatted.sede,
      academicStatus: formatted.academicStatus,
      statusReason: formatted.statusReason,
      photo: formatted.photo,
      isPaedis: formatted.isPaedis,
      isRegisteredInDb: formatted.isRegisteredInDb,
      accessibilityPreferences: formatted.accessibilityPreferences,
    };
  }

  /**
   * Contrato de perfil administrativo (Gestión académica y TI).
   * Contiene trazabilidad institucional pero excluye diagnósticos médicos y notas clínicas confidenciales.
   */
  toAdminView(userProfile) {
    const formatted = this.formatUserResponse(userProfile);
    const {
      diagnosticoDeclarado,
      notasConfidencialesPaedis,
      acreditacionPaedis,
      barreraPaedis,
      ...adminSafe
    } = formatted;
    return adminSafe;
  }

  /**
   * Contrato de perfil confidencial PAEDIS (Coordinación de Inclusión y titular).
   * Integra o combina expediente segregado PaedisRecord conforme a Ley N° 21.719.
   */
  toPaedisRestricted(userProfile, paedisRecord = null) {
    const formatted = this.formatUserResponse(userProfile);
    if (paedisRecord) {
      const rec = typeof paedisRecord.toObject === 'function' ? paedisRecord.toObject() : paedisRecord;
      const notes =
        rec.notasConfidenciales ||
        rec.notasConfidencialesPaedis ||
        formatted.notasConfidencialesPaedis;
      return {
        ...formatted,
        diagnosticoDeclarado: rec.diagnosticoDeclarado || formatted.diagnosticoDeclarado,
        ajustesAprobados: Array.isArray(rec.ajustesAprobados) ? rec.ajustesAprobados : formatted.ajustesAprobados,
        barreraPaedis: rec.barreraPaedis || formatted.barreraPaedis,
        acreditacionPaedis: rec.acreditacionPaedis || formatted.acreditacionPaedis,
        notasConfidenciales: notes,
        notasConfidencialesPaedis: notes,
        acusesDocentes: Array.isArray(rec.acusesDocentes) ? rec.acusesDocentes : formatted.acusesDocentes,
        ...(rec.estadoCaso ? { estadoCaso: rec.estadoCaso } : {}),
        ...(rec.fichaDocenteEstado ? { fichaDocenteEstado: rec.fichaDocenteEstado } : {}),
        ...(Array.isArray(rec.fichaDocenteHistorial)
          ? { fichaDocenteHistorial: rec.fichaDocenteHistorial }
          : {}),
      };
    }
    return formatted;
  }

  /**
   * Migración idempotente para sincronizar datos confidenciales en colección PaedisRecord.
   */
  async syncPaedisRecordsMigration() {
    if (mongoose.connection.readyState !== 1) return { migrated: 0 };
    try {
      const PaedisRecord = require('../models/PaedisRecord');
      const usersWithPaedis = await UserProfile.find({
        $or: [
          { isPaedis: true },
          { diagnosticoDeclarado: { $exists: true, $ne: '' } },
          { notasConfidencialesPaedis: { $exists: true, $ne: '' } },
          { role: 'estudiante_paedis' },
        ],
      })
        .select('+diagnosticoDeclarado +notasConfidencialesPaedis')
        .lean();

      let migratedCount = 0;
      for (const u of usersWithPaedis) {
        if (!u.email) continue;
        const cleanEmail = u.email.toLowerCase();
        const notes = u.notasConfidencialesPaedis || '';
        await PaedisRecord.findOneAndUpdate(
          { $or: [{ userEmail: cleanEmail }, { studentEmail: cleanEmail }] },
          {
            $setOnInsert: {
              userId: u._id,
              studentId: u._id,
              userEmail: cleanEmail,
              studentEmail: cleanEmail,
              studentName: u.fullName || u.nombre || '',
              diagnosticoDeclarado: u.diagnosticoDeclarado || '',
              ajustesAprobados: Array.isArray(u.ajustesAprobados) ? u.ajustesAprobados : [],
              barreraPaedis: u.barreraPaedis || 'Visual / Sensorial',
              acreditacionPaedis: u.acreditacionPaedis || 'Credencial RND SENADIS',
              notasConfidenciales: notes,
              notasConfidencialesPaedis: notes,
              acusesDocentes: Array.isArray(u.acusesDocentes) ? u.acusesDocentes : [],
              tutorPaedisAsignado: u.tutorPaedisAsignado || 'No',
              vigenciaSemestrePaedis: u.vigenciaSemestrePaedis || '2026-1',
              fichaDocenteEstado: u.fichaDocenteNotificada ? 'ENVIADA' : 'BORRADOR',
              fichaDocenteNotificada: Boolean(u.fichaDocenteNotificada),
            },
          },
          { upsert: true, returnDocument: 'after' }
        );
        migratedCount++;
      }
      return { migrated: migratedCount };
    } catch (err) {
      console.warn('[AuthService] Error en syncPaedisRecordsMigration:', err.message);
      return { migrated: 0, error: err.message };
    }
  }

  registerUser(userData) {
    if (!userData || !userData.email) return;
    const cleanEmail = userData.email.toLowerCase().trim();
    inMemoryUsers.set(cleanEmail, {
      tokenVersion: 0,
      isBlocked: false,
      isActive: true,
      ...userData,
      email: cleanEmail,
    });
  }

  removeUserFromMemory(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return false;
    return inMemoryUsers.delete(cleanEmail);
  }

  updateUserFieldsInMemory(email, fields) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const mem = inMemoryUsers.get(cleanEmail);
    if (!mem || !fields || typeof fields !== 'object') return null;
    Object.assign(mem, fields);
    return mem;
  }

  generateJwt(user) {
    const payload = {
      id: user.id || user._id,
      _id: user.id || user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName || user.nombre,
      permissions: Array.isArray(user.permissions) ? user.permissions : undefined,
      tokenVersion: Number(user.tokenVersion || 0),
      isPaedis: user.isPaedis,
      isRegisteredInDb: user.isRegisteredInDb !== false,
      career: user.career,
      campus: user.campus,
    };
    return jwt.sign(payload, getJwtSecret(), {
      algorithm: 'HS256',
      expiresIn: '7d',
      issuer: 'nexo360-api',
      audience: 'nexo360-client',
    });
  }
}

module.exports = new AuthService();
