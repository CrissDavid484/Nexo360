const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const ActivityLog = require('../models/ActivityLog');
const { getJwtSecret } = require('../middleware/authMiddleware');
const SEED_USERS = require('../data/seedUsers.json');
const {
  DEFAULT_SEDE,
  createDeterministicRut,
  sanitizeAccessibilityPreferences,
} = require('../utils/validationUtils');

const DEFAULT_SEED_PASSWORD = `Duoc${new Date().getFullYear()}!`;

function buildOfficialVivoDuocAuthUrl() {
  if (process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL) {
    return process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
  }
  const baseUrl =
    'https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize';
  const params = new URLSearchParams({
    client_id: process.env.VIVO_DUOC_CLIENT_ID || '674913e2-e170-4787-833f-e307f87db6e5',
    nonce: '23077c7bfb49e35770b10965bcbb9df5',
    redirect_uri: 'https://experienciavivo.duoc.cl/auth/openidc/callback',
    response_type: 'code',
    scope:
      'openid profile email offline_access api://674913e2-e170-4787-833f-e307f87db6e5/access',
    state: '181261858bac94807f59900cdd53d715',
    sso_reload: 'true',
  });
  return `${baseUrl}?${params.toString()}`;
}

const OFFICIAL_VIVO_DUOC_OAUTH_URL = buildOfficialVivoDuocAuthUrl();

// Respaldo en memoria exclusivo si MongoDB no estuviese disponible
const inMemoryUsers = new Map();
const inMemoryLogs = [];

for (const seedUser of SEED_USERS) {
  inMemoryUsers.set(seedUser.email.toLowerCase(), {
    _id: `seed_${seedUser.role}_${seedUser.email.split('@')[0]}`,
    ...seedUser,
  });
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
 * Construye plantilla unificada de perfil por defecto para nuevos correos institucionales.
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
    attendanceRate: 88.9,
    hasUsedSimulator: false,
    simulatorUsageCount: 0,
    career: 'Ingeniería en Informática',
    carrera: 'Ingeniería en Informática',
    campus: DEFAULT_SEDE,
    sede: DEFAULT_SEDE,
    accessibilityPreferences: sanitizeAccessibilityPreferences({}),
    isRegisteredInDb: false,
    ...overrides,
  };
}

class AuthService {
  getOfficialLoginUrl(email = '') {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail) return OFFICIAL_VIVO_DUOC_OAUTH_URL;
    return `${OFFICIAL_VIVO_DUOC_OAUTH_URL}&login_hint=${encodeURIComponent(cleanEmail)}`;
  }

  /**
   * Sembrar usuarios institucionales iniciales directamente en MongoDB.
   */
  async seedInstitutionalUsers() {
    if (mongoose.connection.readyState !== 1) {
      console.log('[AuthService] MongoDB no conectado. Omitiendo seed institucional en BD.');
      return;
    }

    for (const seedUser of SEED_USERS) {
      try {
        const cleanEmail = seedUser.email.toLowerCase();
        const existing = await UserProfile.findOne({ email: cleanEmail });
        if (!existing) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(
            seedUser.password || DEFAULT_SEED_PASSWORD,
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
          });
          console.log(`[AuthService] Usuario institucional sembrado en MongoDB: ${cleanEmail}`);
        } else if (!existing.courseAttendance || existing.courseAttendance.length === 0) {
          if (Array.isArray(seedUser.courseAttendance) && seedUser.courseAttendance.length > 0) {
            existing.courseAttendance = seedUser.courseAttendance;
            if (seedUser.satIntervention) {
              existing.satIntervention = seedUser.satIntervention;
            }
            await existing.save();
            console.log(`[AuthService] Actualizada asistencia SAT en MongoDB para: ${cleanEmail}`);
          }
        }
      } catch (err) {
        console.warn(`[AuthService] Aviso sembrando usuario ${seedUser.email}:`, err.message);
      }
    }
  }

  /**
   * Buscar o crear perfil de usuario directamente en MongoDB (con respaldo en memoria).
   */
  async findOrCreateUserProfile(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return null;

    if (mongoose.connection.readyState === 1) {
      try {
        const existingUser = await UserProfile.findOne({ email: cleanEmail });
        if (existingUser) {
          return existingUser;
        }

        const seedMatch = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
          seedMatch?.password || DEFAULT_SEED_PASSWORD,
          salt
        );

        const newUserData = seedMatch
          ? {
              ...seedMatch,
              password: hashedPassword,
              email: cleanEmail,
              nombre: seedMatch.fullName,
              carrera: seedMatch.career,
              sede: seedMatch.campus || DEFAULT_SEDE,
              accessibilityPreferences: sanitizeAccessibilityPreferences(
                seedMatch.accessibilityPreferences
              ),
              isRegisteredInDb: true,
            }
          : buildDefaultStudentProfile(cleanEmail, { password: hashedPassword });

        return await UserProfile.create(newUserData);
      } catch (err) {
        console.warn('[AuthService] Error buscando/creando en MongoDB:', err.message);
      }
    }

    let mem = inMemoryUsers.get(cleanEmail);
    if (!mem) {
      mem = buildDefaultStudentProfile(cleanEmail, { _id: `temp_${Date.now()}` });
      inMemoryUsers.set(cleanEmail, mem);
    }
    return mem;
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
    } else {
      inMemoryUsers.set(
        cleanEmail,
        buildDefaultStudentProfile(cleanEmail, {
          _id: `temp_${Date.now()}`,
          accessibilityPreferences: normalizedPrefs,
        })
      );
    }

    if (mongoose.connection.readyState === 1) {
      const updatedUser = await UserProfile.findOneAndUpdate(
        { email: { $eq: cleanEmail } },
        { $set: { accessibilityPreferences: normalizedPrefs } },
        { new: true, upsert: true, runValidators: true }
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
        { new: true, upsert: true, runValidators: true }
      );
      return { persistedInDb: true, user: updatedUser };
    }

    return { persistedInDb: false, user: mem || null };
  }

  /**
   * Inicio de sesión directo con contraseña institucional cifrada (bcryptjs).
   */
  async loginWithPassword(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      const err = new Error('Por favor ingrese su correo institucional y contraseña.');
      err.statusCode = 400;
      throw err;
    }

    let userDoc = null;
    let isNewlyCreated = false;

    if (mongoose.connection.readyState === 1) {
      try {
        userDoc = await UserProfile.findOne({ email: cleanEmail }).select('+password');
      } catch (err) {
        console.warn('[AuthService] Error consultando credenciales en MongoDB:', err.message);
      }
    }

    if (!userDoc) {
      userDoc = inMemoryUsers.get(cleanEmail);
    }

    if (!userDoc) {
      userDoc = await this.findOrCreateUserProfile(cleanEmail);
      isNewlyCreated = true;
    }

    const isPasswordValid = await this.verifyUserPassword(userDoc, password, isNewlyCreated);
    if (!isPasswordValid) {
      const err = new Error('Credenciales inválidas. Verifique su correo institucional y contraseña.');
      err.statusCode = 401;
      throw err;
    }

    if (mongoose.connection.readyState === 1 && userDoc._id && typeof userDoc.save === 'function') {
      try {
        userDoc.lastLogin = new Date();
        await userDoc.save();
      } catch (saveErr) {
        console.warn('[AuthService] No se pudo actualizar lastLogin en MongoDB:', saveErr.message);
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

  async verifyUserPassword(userDoc, password, isNewlyCreated) {
    if (isNewlyCreated) return true;
    if (!userDoc.password) return password === DEFAULT_SEED_PASSWORD;
    if (typeof userDoc.comparePassword === 'function') {
      return userDoc.comparePassword(password);
    }
    if (userDoc.password.startsWith('$2a$') || userDoc.password.startsWith('$2b$')) {
      return bcrypt.compare(password, userDoc.password);
    }
    return userDoc.password === password;
  }

  /**
   * Inicio de sesión institucional instantáneo (SSO Microsoft Directo).
   */
  async completeSsoLogin(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Correo inválido para inicio de sesión.');
    }

    const user = await this.findOrCreateUserProfile(cleanEmail);
    const formatted = this.formatUserResponse(user);
    const token = this.generateJwt(formatted);

    await this.logActivity({
      userId: formatted.id,
      userEmail: cleanEmail,
      userName: formatted.fullName,
      userRole: formatted.role,
      action: 'login',
      details: 'Inicio de sesión institucional completado directamente vía SSO Microsoft.',
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
      } catch (err) {
        console.warn('[AuthService] Error actualizando uso de simulador:', err.message);
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
    const logEntry = {
      userId: userId ? String(userId) : undefined,
      userEmail: (userEmail || '').toLowerCase(),
      userName: userName || userEmail || 'Usuario',
      userRole: userRole || 'estudiante',
      action: action || 'login',
      details: details || '',
      metadata,
      createdAt: new Date(),
    };

    inMemoryLogs.unshift(logEntry);
    if (inMemoryLogs.length > 50) inMemoryLogs.pop();

    if (mongoose.connection.readyState === 1) {
      try {
        await ActivityLog.create(logEntry);
      } catch (err) {
        console.warn('[AuthService] Error guardando log en MongoDB:', err.message);
      }
    }
  }

  getRecentLogs(limit = 10) {
    return inMemoryLogs.slice(0, limit);
  }

  /**
   * Obtener todos los usuarios registrados directamente desde MongoDB (con respaldo en memoria).
   */
  async getAllUsers() {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await UserProfile.find({}).lean();
        if (docs && docs.length > 0) {
          return docs.map((d) => this.formatUserResponse(d));
        }
      } catch (err) {
        console.warn('[AuthService] Error consultando usuarios en MongoDB:', err.message);
      }
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
    const career = raw.career || raw.carrera || 'Ingeniería en Informática';
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
      fullName,
      nombre: fullName,
      rut,
      role,
      rol: role,
      roleLabel,
      isPaedis,
      career,
      carrera: career,
      campus,
      sede: campus,
      academicStatus: raw.academicStatus || 'activo',
      statusReason: raw.statusReason || 'Estudiante regular activo',
      attendanceRate: Number(raw.attendanceRate ?? 88.9),
      hasUsedSimulator: Boolean(raw.hasUsedSimulator),
      simulatorUsageCount: Number(raw.simulatorUsageCount || 0),
      lastSimulatorUsage: raw.lastSimulatorUsage || null,
      accessibilityPreferences,
      enrolledCourses: Array.isArray(raw.enrolledCourses) ? raw.enrolledCourses : [],
      courseAttendance: Array.isArray(raw.courseAttendance) ? raw.courseAttendance : [],
      satIntervention: raw.satIntervention || {
        riskLevel: 'NONE',
        assignedTo: 'Coordinación PAEDIS',
        slaDeadline: null,
        status: 'PENDING',
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
      isRegisteredInDb: raw.isRegisteredInDb !== false,
      lastLogin: raw.lastLogin || new Date(),
      consentimientoLey21719: raw.consentimientoLey21719 || {
        aceptado: true,
        fechaAceptacion: new Date(),
        finalidadTratamiento:
          'Tratamiento de datos personales para gestión académica conforme a Ley N° 21.719',
      },
      consentMetadata: raw.consentMetadata || {
        consentGiven: true,
        consentDate: new Date(),
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
    };
  }

  registerUser(userData) {
    if (!userData || !userData.email) return;
    const cleanEmail = userData.email.toLowerCase().trim();
    inMemoryUsers.set(cleanEmail, userData);
  }

  generateJwt(user) {
    const payload = {
      id: user.id || user._id,
      _id: user.id || user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName || user.nombre,
      isPaedis: user.isPaedis,
      isRegisteredInDb: user.isRegisteredInDb !== false,
      career: user.career,
      campus: user.campus,
    };
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
  }
}

module.exports = new AuthService();
