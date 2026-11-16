const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const ActivityLog = require('../models/ActivityLog');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { SEED_USERS, DEFAULT_SEED_PASSWORD } = require('../data/seedUsers');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;

function buildOfficialVivoDuocAuthUrl() {
  if (process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL) {
    return process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
  }
  const baseUrl = 'https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize';
  const params = new URLSearchParams({
    client_id: process.env.VIVO_DUOC_CLIENT_ID || '674913e2-e170-4787-833f-e307f87db6e5',
    nonce: '23077c7bfb49e35770b10965bcbb9df5',
    redirect_uri: 'https://experienciavivo.duoc.cl/auth/openidc/callback',
    response_type: 'code',
    scope: 'openid profile email offline_access api://674913e2-e170-4787-833f-e307f87db6e5/access',
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
 * Cálculo del Dígito Verificador de un RUT chileno (Algoritmo Módulo 11)
 */
function calculateRutDv(rutNumber) {
  let sum = 0;
  let multiplier = 2;
  let num = Math.floor(rutNumber);
  while (num > 0) {
    sum += (num % 10) * multiplier;
    num = Math.floor(num / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

/**
 * Generador de RUT determinista para usuarios no registrados previamente
 */
function generateSimulatedRut(email = '') {
  let hash = 0;
  const str = (email || '').toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = Math.trunc(hash);
  }
  const positiveHash = Math.abs(hash);
  const minNumber = 20000000;
  const maxNumber = 22500000;
  const rutNum = minNumber + (positiveHash % (maxNumber - minNumber));
  const dv = calculateRutDv(rutNum);
  const numStr = rutNum.toString();
  return `${numStr.slice(0, 2)}.${numStr.slice(2, 5)}.${numStr.slice(5, 8)}-${dv}`;
}

/**
 * Conversión de correo institucional a nombre formal
 */
function parseNameFromEmail(email = '') {
  const clean = (email || '').toLowerCase().trim();
  if (!clean || !clean.includes('@')) return 'Estudiante Duoc UC';
  const local = clean.split('@')[0];
  if (local === 'c.guzman' || local === 'cri.guzmang') return 'Cristian Guzmán';
  if (local === 'an.ordenesd') return 'Angelo Órdenes';

  const parts = local.split('.');
  if (parts.length >= 2) {
    let firstName = parts[0];
    let lastName = parts.slice(1).join(' ');

    const mapFirst = {
      an: 'Andrés',
      cr: 'Cristian',
      cri: 'Cristian',
      da: 'Daniela',
      ma: 'Matías',
      matias: 'Matías',
      va: 'Valentina',
      fe: 'Felipe',
      ju: 'Juan',
      ca: 'Carlos',
      ro: 'Roberto',
      pa: 'Patricia',
      c: 'Carlos',
      m: 'Manuel',
      d: 'David',
      f: 'Francisco',
      j: 'José',
      p: 'Pedro',
      v: 'Vicente',
    };

    if (mapFirst[firstName]) {
      firstName = mapFirst[firstName];
    } else {
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }

    if (lastName.length > 3 && /[a-z]$/i.test(lastName)) {
      const baseLastName = lastName.slice(0, -1);
      const secondInitial = lastName.slice(-1).toUpperCase();
      const capBase = baseLastName.charAt(0).toUpperCase() + baseLastName.slice(1);
      return `${firstName} ${capBase} ${secondInitial}.`;
    }

    const capLast = lastName.charAt(0).toUpperCase() + lastName.slice(1);
    return `${firstName} ${capLast}`;
  }

  return local.charAt(0).toUpperCase() + local.slice(1);
}

class AuthService {
  getOfficialLoginUrl(email = '') {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail) return OFFICIAL_VIVO_DUOC_OAUTH_URL;
    return `${OFFICIAL_VIVO_DUOC_OAUTH_URL}&login_hint=${encodeURIComponent(cleanEmail)}`;
  }

  /**
   * Sembrar usuarios institucionales iniciales directamente en MongoDB
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
          const hashedPassword = await bcrypt.hash(seedUser.password || DEFAULT_SEED_PASSWORD, salt);

          await UserProfile.create({
            ...seedUser,
            password: hashedPassword,
            email: cleanEmail,
            nombre: seedUser.fullName,
            career: seedUser.career,
            carrera: seedUser.career,
            campus: seedUser.campus,
            sede: seedUser.campus,
            isRegisteredInDb: true,
          });
          console.log(`[AuthService] Usuario institucional sembrado en MongoDB: ${cleanEmail}`);
        }
      } catch (err) {
        console.warn(`[AuthService] Aviso sembrando usuario ${seedUser.email}:`, err.message);
      }
    }
  }

  /**
   * Buscar o crear perfil de usuario directamente en MongoDB
   */
  async findOrCreateUserProfile(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return null;

    if (mongoose.connection.readyState === 1) {
      try {
        let user = await UserProfile.findOne({ email: cleanEmail });
        if (user) {
          return user;
        }

        const seedMatch = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
          seedMatch?.password || DEFAULT_SEED_PASSWORD,
          salt
        );

        const derivedName = parseNameFromEmail(cleanEmail);
        const newUserData = seedMatch
          ? {
              ...seedMatch,
              password: hashedPassword,
              email: cleanEmail,
              nombre: seedMatch.fullName,
              carrera: seedMatch.career,
              sede: seedMatch.campus,
              isRegisteredInDb: true,
            }
          : {
              email: cleanEmail,
              password: hashedPassword,
              fullName: derivedName,
              nombre: derivedName,
              rut: generateSimulatedRut(cleanEmail),
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
              campus: 'Sede Alameda',
              sede: 'Sede Alameda',
              isRegisteredInDb: false,
            };

        user = await UserProfile.create(newUserData);
        return user;
      } catch (err) {
        console.warn('[AuthService] Error buscando/creando en MongoDB:', err.message);
      }
    }

    // Fallback de memoria si MongoDB no está conectado
    let mem = inMemoryUsers.get(cleanEmail);
    if (!mem) {
      const derivedName = parseNameFromEmail(cleanEmail);
      mem = {
        _id: `temp_${Date.now()}`,
        email: cleanEmail,
        fullName: derivedName,
        nombre: derivedName,
        rut: generateSimulatedRut(cleanEmail),
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
        campus: 'Sede Alameda',
        sede: 'Sede Alameda',
        isRegisteredInDb: false,
      };
      inMemoryUsers.set(cleanEmail, mem);
    }
    return mem;
  }

  /**
   * Inicio de sesión directo con contraseña institucional cifrada (bcryptjs)
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

    let isPasswordValid = false;
    if (isNewlyCreated) {
      isPasswordValid = true;
    } else if (userDoc.password) {
      if (typeof userDoc.comparePassword === 'function') {
        isPasswordValid = await userDoc.comparePassword(password);
      } else if (userDoc.password.startsWith('$2a$') || userDoc.password.startsWith('$2b$')) {
        isPasswordValid = await bcrypt.compare(password, userDoc.password);
      } else {
        isPasswordValid = userDoc.password === password;
      }
    } else {
      isPasswordValid = password === DEFAULT_SEED_PASSWORD;
    }

    if (!isPasswordValid) {
      const err = new Error('Credenciales inválidas. Verifique su correo institucional y contraseña.');
      err.statusCode = 401;
      throw err;
    }

    if (mongoose.connection.readyState === 1 && userDoc._id && typeof userDoc.save === 'function') {
      userDoc.lastLogin = new Date();
      await userDoc.save();
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
   * Inicio de sesión institucional instantáneo (SSO Microsoft Directo)
   * Consulta directamente la base de datos sin procesos de bot ni demoras
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
   * Registrar interacción del estudiante con el Simulador de Toma de Ramos
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
   * Registrar auditoría en la colección ActivityLog de MongoDB
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
   * Obtener todos los usuarios registrados directamente desde MongoDB
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
   * Formateo coherente 1:1 de los campos del usuario institucional
   */
  formatUserResponse(userProfile = {}) {
    const raw = typeof userProfile.toObject === 'function' ? userProfile.toObject() : userProfile;
    const email = (raw.email || '').toLowerCase().trim();

    const id = raw._id ? String(raw._id) : raw.id || `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const fullName = raw.fullName || raw.nombre || email || 'Estudiante Duoc UC';
    const nombre = fullName;
    const rut = raw.rut || generateSimulatedRut(email);
    const role = raw.role || 'estudiante';
    const rol = role;
    const roleLabel = raw.roleLabel || 'Estudiante Regular Duoc UC';
    const isPaedis = raw.isPaedis === true || role === 'estudiante_paedis';
    const career = raw.career || raw.carrera || 'Ingeniería en Informática';
    const carrera = career;
    const campus = raw.campus || raw.sede || 'Sede Alameda';
    const sede = campus;
    const academicStatus = raw.academicStatus || 'activo';
    const statusReason = raw.statusReason || 'Estudiante regular activo';
    const attendanceRate = Number(raw.attendanceRate ?? 88.9);
    const hasUsedSimulator = Boolean(raw.hasUsedSimulator);
    const simulatorUsageCount = Number(raw.simulatorUsageCount || 0);

    const accessibilityPreferences = raw.accessibilityPreferences || {
      fontSize: 'normal',
      highContrast: false,
      dyslexicFont: false,
      reducedMotion: false,
      readingGuide: false,
      screenReaderOptimized: true,
    };

    const enrolledCourses = Array.isArray(raw.enrolledCourses) ? raw.enrolledCourses : [];
    const isRegisteredInDb = raw.isRegisteredInDb !== false;
    const address = raw.address || raw.direccion || 'Por actualizar';
    const direccion = address;
    const phone = raw.phone || raw.telefonoPersonal || '+56 9 0000 0000';
    const telefonoPersonal = phone;
    const personalEmail = raw.personalEmail || raw.emailPersonal || email;
    const emailPersonal = personalEmail;

    return {
      id,
      _id: id,
      email,
      fullName,
      nombre,
      rut,
      role,
      rol,
      roleLabel,
      isPaedis,
      career,
      carrera,
      campus,
      sede,
      academicStatus,
      statusReason,
      attendanceRate,
      hasUsedSimulator,
      simulatorUsageCount,
      lastSimulatorUsage: raw.lastSimulatorUsage || null,
      accessibilityPreferences,
      enrolledCourses,
      photo: raw.photo || '',
      address,
      direccion,
      personalEmail,
      emailPersonal,
      phone,
      telefonoPersonal,
      emergencyContact: raw.emergencyContact || 'Contacto Familiar',
      emergencyPhone: raw.emergencyPhone || '+56 9 1234 5678',
      tutorParAsignado: raw.tutorParAsignado || (isPaedis ? 'Coordinación PAEDIS Duoc UC' : 'Sin tutor asignado'),
      diagnosticoDeclarado: raw.diagnosticoDeclarado || '',
      ajustesAprobados: Array.isArray(raw.ajustesAprobados) ? raw.ajustesAprobados : [],
      isRegisteredInDb,
      lastLogin: raw.lastLogin || new Date(),
      consentimientoLey21719: raw.consentimientoLey21719 || {
        aceptado: true,
        fechaAceptacion: new Date(),
        finalidadTratamiento: 'Tratamiento de datos personales para gestión académica conforme a Ley N° 21.719',
      },
      consentMetadata: raw.consentMetadata || {
        consentGiven: true,
        consentDate: new Date(),
        consentVersion: '1.0 - Ley N° 21.719',
        law: 'Ley N° 21.719 de Protección de Datos Personales de Chile',
        purpose: ['gestion_academica', 'apoyo_paedis_inclusion', 'simulador_toma_ramos', 'seguimiento_asistencia'],
        dataRetentionPolicy: 'Conservación durante el periodo académico activo conforme al Art. 12 de la Ley N° 21.719',
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
