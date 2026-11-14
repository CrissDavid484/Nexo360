const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const ActivityLog = require('../models/ActivityLog');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { SEED_USERS, DEFAULT_SEED_PASSWORD } = require('../data/seedUsers');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;

/**
 * SERVICIO DE AUTENTICACIÓN INSTITUCIONAL Y GESTIÓN DE USUARIOS NEXO360
 * Base de Datos Nativa con bcrypt, roles, estados académicos y registro de actividad
 */

const inMemoryUsers = new Map();
const inMemoryLogs = [];

// Precargar usuarios en memoria para respaldo inmediato si MongoDB no está activo
for (const seedUser of SEED_USERS) {
  inMemoryUsers.set(seedUser.email.toLowerCase(), {
    _id: `seed_${seedUser.role}_${seedUser.email.split('@')[0]}`,
    ...seedUser,
  });
}

class AuthScraperService {
  getOfficialLoginUrl(email = '') {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const base = 'https://login.microsoftonline.com/72fd0b5a-8a6a-4cff-89f6-bde961f7e250/oauth2/v2.0/authorize?client_id=674913e2-e170-4787-833f-e307f87db6e5&nonce=05f0ed614ee974e04f8096c70660da67&redirect_uri=https%3A%2F%2Fexperienciavivo.duoc.cl%2Fauth%2Fopenidc%2Fcallback&response_type=code&scope=openid+profile+email+offline_access+api%3A%2F%2F674913e2-e170-4787-833f-e307f87db6e5%2Faccess&state=45c6f7423b9a772dc296a3d5e4f1739f&sso_reload=true';
    if (!cleanEmail) return base;
    return `${base}&login_hint=${encodeURIComponent(cleanEmail)}`;
  }

  async completeSsoLogin(email) {
    const user = await this.findOrCreateUserProfile(email);
    const formatted = this.formatUserResponse(user);
    const token = this.generateJwt(formatted);
    return {
      token,
      user: formatted,
      officialLoginUrl: this.getOfficialLoginUrl(email),
    };
  }

  /**
   * Sembrar usuarios institucionales con contraseñas encriptadas en MongoDB
   */
  async seedInstitutionalUsers() {
    if (mongoose.connection.readyState !== 1) {
      return SEED_USERS.map((u) => this.formatUserResponse(inMemoryUsers.get(u.email.toLowerCase())));
    }

    const seeded = [];
    const defaultSalt = await bcrypt.genSalt(10);
    const defaultHashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, defaultSalt);

    for (const seedUser of SEED_USERS) {
      try {
        const hashedPassword = seedUser.password
          ? await bcrypt.hash(seedUser.password, defaultSalt)
          : defaultHashedPassword;

        const doc = await UserProfile.findOneAndUpdate(
          { email: seedUser.email.toLowerCase() },
          {
            $set: {
              fullName: seedUser.fullName,
              role: seedUser.role,
              roleLabel: seedUser.roleLabel,
              isPaedis: seedUser.isPaedis,
              academicStatus: seedUser.academicStatus || 'activo',
              statusReason: seedUser.statusReason || 'Estudiante regular activo',
              attendanceRate: seedUser.attendanceRate ?? 88.9,
              hasUsedSimulator: Boolean(seedUser.hasUsedSimulator),
              simulatorUsageCount: seedUser.simulatorUsageCount || 0,
              rut: seedUser.rut,
              career: seedUser.career,
              campus: seedUser.campus,
              tutorParAsignado: seedUser.tutorParAsignado,
              diagnosticoDeclarado: seedUser.diagnosticoDeclarado || '',
              ajustesAprobados: seedUser.ajustesAprobados || [],
            },
            $setOnInsert: {
              password: hashedPassword,
              photo: seedUser.photo || '',
              address: seedUser.address || 'Sede Central Duoc UC',
              personalEmail: seedUser.personalEmail || seedUser.email,
              phone: seedUser.phone || '+56 9 3016 6745',
              emergencyContact: seedUser.emergencyContact || 'Contacto Familiar',
              emergencyPhone: seedUser.emergencyPhone || '+56 9 1234 5678',
              accessibilityPreferences: seedUser.accessibilityPreferences || {
                fontSize: 'normal',
                highContrast: false,
                dyslexicFont: false,
                reducedMotion: false,
                screenReaderOptimized: true,
              },
              enrolledCourses: seedUser.enrolledCourses || [],
              lastLogin: new Date(),
            },
          },
          { upsert: true, new: true }
        );

        inMemoryUsers.set(seedUser.email.toLowerCase(), doc.toObject ? doc.toObject() : doc);
        seeded.push(this.formatUserResponse(doc));
      } catch (err) {
        console.warn(`[SeedUsers] Advertencia sembrando ${seedUser.email}:`, err.message);
      }
    }
    console.log(`[MongoDB] ${seeded.length} usuarios institucionales sincronizados con contraseñas encriptadas.`);
    return seeded;
  }

  /**
   * Autenticación con Correo y Contraseña contra la Base de Datos Nativa
   */
  async loginWithPassword(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    let userDoc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        userDoc = await UserProfile.findOne({ email: cleanEmail }).select('+password');
      } catch (err) {
        console.warn('[AuthService] Error buscando en MongoDB:', err.message);
      }
    }

    if (!userDoc) {
      userDoc = inMemoryUsers.get(cleanEmail);
    }

    // Si el usuario no existía pero pertenece al dominio institucional Duoc UC, crearlo dinámicamente
    let isNewlyCreated = false;
    if (!userDoc) {
      if (EMAIL_REGEX.test(cleanEmail)) {
        userDoc = await this.findOrCreateUserProfile(cleanEmail);
        isNewlyCreated = true;
      } else {
        const err = new Error('Usuario no encontrado en la base de datos de Nexo360.');
        err.statusCode = 404;
        throw err;
      }
    }

    // Validación de contraseña cifrada con bcrypt o clave por defecto
    let isPasswordValid = false;
    if (isNewlyCreated) {
      // Para nuevos usuarios institucionales que inician sesión por primera vez, registrar su contraseña ingresada
      isPasswordValid = true;
      if (password && mongoose.connection.readyState === 1 && userDoc && typeof userDoc.save === 'function') {
        const salt = await bcrypt.genSalt(10);
        userDoc.password = await bcrypt.hash(password, salt);
        await userDoc.save().catch(() => {});
      }
    } else if (userDoc.password) {
      isPasswordValid = await bcrypt.compare(password, userDoc.password);
    }

    // Permitir clave demo global o clave maestra de desarrollo
    if (!isPasswordValid && (password === DEFAULT_SEED_PASSWORD || password === 'Duoc2026!' || password === 'Nexo360!')) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      const err = new Error('Contraseña incorrecta. Verifique sus credenciales institucionales.');
      err.statusCode = 401;
      throw err;
    }

    // Actualizar fecha de último login
    const now = new Date();
    if (mongoose.connection.readyState === 1 && userDoc._id && typeof userDoc.save === 'function') {
      userDoc.lastLogin = now;
      await userDoc.save().catch(() => {});
    }

    // Registrar log de actividad
    await this.logActivity({
      userId: userDoc._id || userDoc.id,
      userEmail: cleanEmail,
      userName: userDoc.fullName || cleanEmail,
      userRole: userDoc.role || 'estudiante',
      action: 'login',
      details: 'Inicio de sesión exitoso en Nexo360',
    });

    const formattedUser = this.formatUserResponse(userDoc);
    const token = this.generateJwt(formattedUser);

    return {
      token,
      user: formattedUser,
    };
  }

  /**
   * Registro de actividad en la plataforma
   */
  async logActivity({ userId, userEmail, userName, userRole, action, details, metadata = {} }) {
    const logItem = {
      userId: userId || null,
      userEmail: (userEmail || '').toLowerCase(),
      userName: userName || userEmail || '',
      userRole: userRole || 'estudiante',
      action,
      details: details || '',
      metadata,
      createdAt: new Date(),
    };

    inMemoryLogs.unshift(logItem);
    if (inMemoryLogs.length > 500) inMemoryLogs.pop();

    if (mongoose.connection.readyState === 1) {
      try {
        await ActivityLog.create(logItem);
      } catch (err) {
        console.warn('[ActivityLog] No se pudo guardar en MongoDB:', err.message);
      }
    }
  }

  getRecentLogs(limit = 10) {
    return inMemoryLogs.slice(0, limit);
  }

  /**
   * Registrar que un estudiante utilizó el Simulador de Toma de Ramos
   */
  async recordSimulatorUsage(user) {
    if (!user || !user.email) return;
    const cleanEmail = user.email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        await UserProfile.findOneAndUpdate(
          { email: cleanEmail },
          {
            $set: {
              hasUsedSimulator: true,
              lastSimulatorUsage: new Date(),
            },
            $inc: { simulatorUsageCount: 1 },
          }
        );
      } catch (err) {
        console.warn('[SimulatorUsage] Error en MongoDB:', err.message);
      }
    }

    const mem = inMemoryUsers.get(cleanEmail);
    if (mem) {
      mem.hasUsedSimulator = true;
      mem.simulatorUsageCount = (mem.simulatorUsageCount || 0) + 1;
      mem.lastSimulatorUsage = new Date();
      inMemoryUsers.set(cleanEmail, mem);
    }

    await this.logActivity({
      userId: user._id || user.id,
      userEmail: cleanEmail,
      userName: user.fullName || user.nombre || cleanEmail,
      userRole: user.role || 'estudiante',
      action: 'used_simulator_toma_ramos',
      details: 'El estudiante interactuó con el Simulador de Toma de Ramos y planificó su carga horaria.',
    });
  }

  /**
   * Obtener todos los usuarios registrados
   */
  async getAllUsers() {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await UserProfile.find({}).sort({ createdAt: 1 }).lean();
        if (docs && docs.length > 0) {
          return docs.map((d) => this.formatUserResponse(d));
        }
      } catch (err) {
        console.warn('[AuthService] Fallback a memoria al listar usuarios:', err.message);
      }
    }

    return Array.from(inMemoryUsers.values()).map((u) => this.formatUserResponse(u));
  }

  /**
   * Obtener o crear perfil de usuario
   */
  async findOrCreateUserProfile(email) {
    const cleanEmail = (email || 'c.guzman@duocuc.cl').trim().toLowerCase();
    const seedMatch = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);

    if (mongoose.connection.readyState === 1) {
      try {
        let user = await UserProfile.findOne({ email: cleanEmail });
        if (user) return user;

        if (seedMatch) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, salt);
          user = await UserProfile.create({
            ...seedMatch,
            password: hashedPassword,
          });
          return user;
        }

        // Si es un correo institucional no registrado en SEED_USERS, crearlo en MongoDB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, salt);
        const isProf = cleanEmail.includes('profesor') || cleanEmail.includes('docente');
        const isAdmin = cleanEmail.includes('admin') || cleanEmail.includes('coordinador');
        const role = isAdmin ? 'administrador' : isProf ? 'profesor' : 'estudiante';
        const roleLabel = isAdmin ? 'Administrador del Sistema' : isProf ? 'Docente Duoc UC' : 'Estudiante Regular Duoc UC';
        const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase();

        user = await UserProfile.create({
          email: cleanEmail,
          fullName: namePart,
          nombre: namePart,
          role,
          roleLabel,
          password: hashedPassword,
          sede: 'ALAMEDA',
          carrera: isProf ? 'DOCENCIA GENERAL' : 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
          isPaedis: false,
          academicStatus: 'activo',
          attendanceRate: 88,
          hasUsedSimulator: false,
          simulatorUsageCount: 0,
        });
        return user;
      } catch (err) {
        console.warn('[AuthService] Error findOrCreate en MongoDB:', err.message);
      }
    }

    const mem = inMemoryUsers.get(cleanEmail);
    if (mem) return mem;

    const newMem = {
      _id: `user_${cleanEmail.replace(/[@.]/g, '_')}`,
      email: cleanEmail,
      fullName: cleanEmail,
      role: 'estudiante',
      roleLabel: 'Estudiante Regular Duoc UC',
      isPaedis: false,
      academicStatus: 'activo',
      attendanceRate: 85,
      hasUsedSimulator: false,
      simulatorUsageCount: 0,
    };
    inMemoryUsers.set(cleanEmail, newMem);
    return newMem;
  }

  formatUserResponse(userProfile = {}) {
    const email = (userProfile.email || userProfile.emailDuoc || 'c.guzman@duocuc.cl').toLowerCase().trim();
    const seedMatch = SEED_USERS.find((u) => u.email.toLowerCase() === email);

    const fullName =
      userProfile.fullName ||
      userProfile.nombre ||
      (seedMatch ? seedMatch.fullName : email);

    const role = userProfile.role || (seedMatch ? seedMatch.role : 'estudiante');
    const roleLabel =
      userProfile.roleLabel ||
      (seedMatch ? seedMatch.roleLabel : 'Estudiante Regular Duoc UC');

    const academicStatus =
      userProfile.academicStatus || (seedMatch ? seedMatch.academicStatus : 'activo');

    const statusReason =
      userProfile.statusReason ||
      (seedMatch ? seedMatch.statusReason : 'Estudiante regular activo');

    const attendanceRate =
      userProfile.attendanceRate !== undefined
        ? Number(userProfile.attendanceRate)
        : seedMatch
        ? seedMatch.attendanceRate
        : 88.9;

    const hasUsedSimulator =
      userProfile.hasUsedSimulator !== undefined
        ? Boolean(userProfile.hasUsedSimulator)
        : seedMatch
        ? Boolean(seedMatch.hasUsedSimulator)
        : false;

    const simulatorUsageCount =
      userProfile.simulatorUsageCount !== undefined
        ? Number(userProfile.simulatorUsageCount)
        : seedMatch
        ? seedMatch.simulatorUsageCount || 0
        : 0;

    const isPaedis =
      typeof userProfile.isPaedis === 'boolean'
        ? userProfile.isPaedis
        : seedMatch
        ? Boolean(seedMatch.isPaedis)
        : false;

    return {
      _id: userProfile._id || userProfile.id || `user_${email}`,
      id: userProfile._id || userProfile.id || `user_${email}`,
      email,
      emailDuoc: email,
      fullName,
      nombre: fullName,
      photo: userProfile.photo || '',
      role,
      rol: role,
      roleLabel,
      isPaedis,
      academicStatus,
      statusReason,
      attendanceRate,
      hasUsedSimulator,
      simulatorUsageCount,
      lastSimulatorUsage: userProfile.lastSimulatorUsage || null,
      rut: userProfile.rut || (seedMatch ? seedMatch.rut : '19.276.735-0'),
      career: userProfile.career || (seedMatch ? seedMatch.career : 'Ingeniería en Informática'),
      carrera: userProfile.career || (seedMatch ? seedMatch.career : 'Ingeniería en Informática'),
      campus: userProfile.campus || (seedMatch ? seedMatch.campus : 'Sede Alameda'),
      sede: userProfile.campus || (seedMatch ? seedMatch.campus : 'Sede Alameda'),
      address: userProfile.address || (seedMatch ? seedMatch.address : 'Las Moreras 12196'),
      direccion: userProfile.address || (seedMatch ? seedMatch.address : 'Las Moreras 12196'),
      personalEmail: userProfile.personalEmail || (seedMatch ? seedMatch.personalEmail : ''),
      emailPersonal: userProfile.personalEmail || (seedMatch ? seedMatch.personalEmail : ''),
      phone: userProfile.phone || (seedMatch ? seedMatch.phone : '+56 9 3016 6745'),
      telefonoPersonal: userProfile.phone || (seedMatch ? seedMatch.phone : '+56 9 3016 6745'),
      emergencyContact: userProfile.emergencyContact || (seedMatch ? seedMatch.emergencyContact : 'Contacto Familiar'),
      emergencyPhone: userProfile.emergencyPhone || (seedMatch ? seedMatch.emergencyPhone : '+56 9 1234 5678'),
      tutorParAsignado: userProfile.tutorParAsignado || (seedMatch ? seedMatch.tutorParAsignado : 'Inclusión y Bienestar Duoc UC'),
      diagnosticoDeclarado: userProfile.diagnosticoDeclarado || (seedMatch ? seedMatch.diagnosticoDeclarado : ''),
      ajustesAprobados: userProfile.ajustesAprobados || (seedMatch ? seedMatch.ajustesAprobados : []),
      accessibilityPreferences: userProfile.accessibilityPreferences || {
        fontSize: 'normal',
        highContrast: false,
        dyslexicFont: false,
        reducedMotion: false,
        screenReaderOptimized: true,
      },
      enrolledCourses: userProfile.enrolledCourses || (seedMatch ? seedMatch.enrolledCourses : []),
      lastLogin: userProfile.lastLogin || new Date(),
    };
  }

  generateJwt(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        fullName: user.fullName || user.nombre || user.email,
        role: user.role || user.rol || 'estudiante',
        roleLabel: user.roleLabel || 'Estudiante Duoc UC',
        isPaedis: Boolean(user.isPaedis),
        academicStatus: user.academicStatus || 'activo',
      },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '8h' }
    );
  }
}

module.exports = new AuthScraperService();
