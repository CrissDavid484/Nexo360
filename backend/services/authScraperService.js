const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { SEED_USERS, OFFICIAL_MICROSOFT_DUOC_LOGIN_URL } = require('../data/seedUsers');

/**
 * SERVICIO DE AUTENTICACIÓN INSTITUCIONAL DUOC UC (SSO MICROSOFT + BASE DE DATOS EDUCATIVA DE 10 ROLES)
 *
 * Flujo Principal (Redirección SSO Oficial + Base de Datos Propia):
 * 1. El usuario no ingresa su contraseña en Nexo360; es redirigido al login oficial de Microsoft Entra ID de Duoc UC.
 * 2. Al retornar a Nexo360, se identifica mediante su correo institucional contra la base de datos MongoDB.
 * 3. Si pertenece a los 10 usuarios institucionales precargados (admin, estudiante PAEDIS, estudiante regular,
 *    tutor par, profesor, director, subdirector, coordinador PAEDIS, administrativo), carga su perfil y rol completo.
 * 4. Si ingresa con cualquier otro correo institucional, captura el correo y lo asigna como su nombre.
 */

const activeSessions = new Map();
const MAX_CONCURRENT_SESSIONS = 50;
const SESSION_TTL_MS = 5 * 60 * 1000;

// Almacén en memoria inicializado con los 10 usuarios de la BD para respaldo inmediato si MongoDB no está activo
const inMemoryUsers = new Map();
for (const seedUser of SEED_USERS) {
  inMemoryUsers.set(seedUser.email.toLowerCase(), {
    _id: `seed_${seedUser.role}_${seedUser.email.split('@')[0]}`,
    ...seedUser,
  });
}

const sessionCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      if (session.browser) {
        session.browser.close().catch(() => {});
      }
      activeSessions.delete(id);
    }
  }
}, 60000);

if (typeof sessionCleanupInterval.unref === 'function') {
  sessionCleanupInterval.unref();
}

class AuthScraperService {
  getOfficialLoginUrl(email = '') {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail) {
      return OFFICIAL_MICROSOFT_DUOC_LOGIN_URL;
    }
    return `${OFFICIAL_MICROSOFT_DUOC_LOGIN_URL}&login_hint=${encodeURIComponent(cleanEmail)}`;
  }

  /**
   * Sembrar los 10 usuarios institucionales en MongoDB al iniciar el servidor
   */
  async seedInstitutionalUsers() {
    if (mongoose.connection.readyState !== 1) {
      return SEED_USERS.map((u) => this.formatUserResponse(inMemoryUsers.get(u.email.toLowerCase())));
    }

    const seeded = [];
    for (const seedUser of SEED_USERS) {
      try {
        const doc = await UserProfile.findOneAndUpdate(
          { email: seedUser.email.toLowerCase() },
          {
            $set: {
              fullName: seedUser.fullName,
              role: seedUser.role,
              roleLabel: seedUser.roleLabel,
              isPaedis: seedUser.isPaedis,
              rut: seedUser.rut,
              career: seedUser.career,
              campus: seedUser.campus,
              tutorParAsignado: seedUser.tutorParAsignado,
              ajustesAprobados: seedUser.ajustesAprobados,
            },
            $setOnInsert: {
              address: seedUser.address,
              personalEmail: seedUser.personalEmail,
              phone: seedUser.phone,
              emergencyContact: seedUser.emergencyContact,
              emergencyPhone: seedUser.emergencyPhone,
              accessibilityPreferences: seedUser.accessibilityPreferences,
              enrolledCourses: seedUser.enrolledCourses,
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
    console.log(`[MongoDB] ${seeded.length} usuarios institucionales (Admin, PAEDIS, Estudiante, Profesor, Director, Subdirector, etc.) listos.`);
    return seeded;
  }

  /**
   * Obtener todos los usuarios registrados en la base de datos (10 iniciales + nuevos capturados por correo)
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
   * Autenticación directa tras redirección oficial a Microsoft Entra ID Duoc UC
   */
  async completeSsoLogin(email) {
    const userProfile = await this.findOrCreateUserProfile(email);
    const formattedUser = this.formatUserResponse(userProfile);
    const token = this.generateJwt(formattedUser);

    return {
      token,
      user: formattedUser,
      officialLoginUrl: this.getOfficialLoginUrl(email),
    };
  }

  async startLoginProcess(email, password) {
    return this.initiateLogin(email, password);
  }

  async initiateLogin(email, password) {
    if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
      const err = new Error('El servidor de autenticación está procesando el máximo de sesiones concurrentes. Intente en unos segundos.');
      err.code = 'TOO_MANY_SESSIONS';
      throw err;
    }

    const sessionId = uuidv4();
    const isMock = process.env.MOCK_PUPPETEER !== 'false';
    const initialMfaCode = String(Math.floor(10 + Math.random() * 90));

    const sessionData = {
      sessionId,
      email,
      status: 'AWAITING_MFA',
      mfaCode: initialMfaCode,
      errorMessage: null,
      browser: null,
      page: null,
      token: null,
      user: null,
      createdAt: Date.now(),
    };

    activeSessions.set(sessionId, sessionData);

    if (isMock) {
      this.runMockLoginFlow(sessionId, email);
    } else {
      this.runRealPuppeteerLogin(sessionId, email, password);
    }

    return {
      sessionId,
      status: 'AWAITING_MFA',
      mfaCode: initialMfaCode,
      mfaNumber: initialMfaCode,
      officialLoginUrl: this.getOfficialLoginUrl(email),
      message: 'Iniciando autenticación en portal institucional Duoc UC...',
    };
  }

  async runMockLoginFlow(sessionId, email) {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    const timer = setTimeout(async () => {
      const currentSession = activeSessions.get(sessionId);
      if (!currentSession) return;

      try {
        const userProfile = await this.findOrCreateUserProfile(email);
        const formatted = this.formatUserResponse(userProfile);
        const token = this.generateJwt(formatted);

        currentSession.status = 'COMPLETED';
        currentSession.token = token;
        currentSession.user = formatted;
        console.log(`[AuthService] Sesión ${sessionId} autenticada y respaldada para ${email}`);
      } catch (err) {
        console.error('[AuthService] Error en flujo MFA:', err.message);
        currentSession.status = 'FAILED';
        currentSession.errorMessage = 'Error al generar la sesión del estudiante.';
      } finally {
        const cleanupTimer = setTimeout(() => activeSessions.delete(sessionId), 60000);
        if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();
      }
    }, 4000);

    if (typeof timer.unref === 'function') timer.unref();
  }

  async runRealPuppeteerLogin(sessionId, email, password) {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    let browser = null;
    try {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      session.browser = browser;
      const page = await browser.newPage();
      session.page = page;

      await page.goto(this.getOfficialLoginUrl(email), {
        waitUntil: 'networkidle2',
        timeout: 45000,
      });

      const emailSelector = 'input[type="email"], input[name="loginfmt"]';
      await page.waitForSelector(emailSelector, { timeout: 15000 });
      await page.type(emailSelector, email, { delay: 50 });
      await page.keyboard.press('Enter');

      const passwordSelector = 'input[type="password"], input[name="passwd"]';
      await page.waitForSelector(passwordSelector, { timeout: 15000 });
      await page.type(passwordSelector, password, { delay: 50 });

      password = null;
      await page.keyboard.press('Enter');

      try {
        const mfaSelector = '#displaySign, div[data-test-id="number-match"], .displaySign';
        await page.waitForSelector(mfaSelector, { timeout: 8000 });
        const mfaNumber = await page.$eval(mfaSelector, (el) => el.textContent.trim());
        if (mfaNumber) {
          session.mfaCode = mfaNumber;
        }
        session.status = 'AWAITING_MFA';

        await Promise.race([
          page.waitForSelector('#idSIButton9', { timeout: 90000 }),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 }),
        ]);

        if (await page.$('#idSIButton9')) {
          await page.click('#idSIButton9');
        }
      } catch {
        // Flujo continuó directo
      }

      const userProfile = await this.findOrCreateUserProfile(email);
      const formatted = this.formatUserResponse(userProfile);
      const token = this.generateJwt(formatted);

      session.status = 'COMPLETED';
      session.token = token;
      session.user = formatted;
    } catch (error) {
      password = null;
      console.error('[Puppeteer Auth Error]:', error.message);
      session.status = 'FAILED';
      session.errorMessage = 'Credenciales inválidas o tiempo de espera agotado en el portal Duoc UC.';
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
        session.browser = null;
        session.page = null;
      }
      const cleanupTimer = setTimeout(() => activeSessions.delete(sessionId), 30000);
      if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();
    }
  }

  getSessionStatus(sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      status: session.status,
      mfaCode: session.mfaCode,
      mfaNumber: session.mfaCode,
      errorMessage: session.errorMessage,
      token: session.status === 'COMPLETED' ? session.token : null,
      user: session.status === 'COMPLETED' ? session.user : null,
      email: session.email,
    };
  }

  clearSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (session?.browser) {
      session.browser.close().catch(() => {});
    }
    activeSessions.delete(sessionId);
  }

  inferDefaultRoleFromEmail(email = '') {
    const clean = email.toLowerCase().trim();
    if (clean.endsWith('@profesor.duoc.cl')) {
      return {
        role: 'profesor',
        roleLabel: 'Profesor / Docente Duoc UC',
        career: 'Docencia Institucional Duoc UC',
      };
    }
    if (clean.endsWith('@duoc.cl')) {
      return {
        role: 'administrativo',
        roleLabel: 'Funcionario / Gestión Institucional',
        career: 'Administración y Servicios Duoc UC',
      };
    }
    return {
      role: 'estudiante',
      roleLabel: 'Estudiante Regular Duoc UC',
      career: 'Carrera Institucional Duoc UC',
    };
  }

  formatUserResponse(userProfile = {}) {
    const email = (userProfile.email || userProfile.emailDuoc || 'c.guzman@duocuc.cl').toLowerCase().trim();
    const seedMatch = SEED_USERS.find((u) => u.email.toLowerCase() === email);
    const inferred = this.inferDefaultRoleFromEmail(email);

    // Si está en la BD como uno de los 10 usuarios, usa su nombre oficial; si es un correo externo nuevo, usa su correo como nombre
    const fullName =
      userProfile.fullName ||
      userProfile.nombre ||
      (seedMatch ? seedMatch.fullName : email);

    const roleLabel =
      userProfile.roleLabel ||
      (seedMatch ? seedMatch.roleLabel : inferred.roleLabel);

    const isPaedis =
      typeof userProfile.isPaedis === 'boolean'
        ? userProfile.isPaedis
        : seedMatch
        ? Boolean(seedMatch.isPaedis)
        : false;

    const career =
      userProfile.career ||
      userProfile.carrera ||
      (seedMatch ? seedMatch.career : inferred.career);

    const campus =
      userProfile.campus ||
      userProfile.sede ||
      (seedMatch ? seedMatch.campus : 'Sede Alameda');

    const address =
      userProfile.address ||
      userProfile.direccion ||
      (seedMatch ? seedMatch.address : 'Sin dirección registrada');

    const personalEmail =
      userProfile.personalEmail ||
      userProfile.emailPersonal ||
      (seedMatch ? seedMatch.personalEmail : email);

    const phone =
      userProfile.phone ||
      userProfile.telefonoPersonal ||
      (seedMatch ? seedMatch.phone : '+56 9 0000 0000');

    const ajustesAprobados = Array.isArray(userProfile.ajustesAprobados)
      ? userProfile.ajustesAprobados
      : seedMatch
      ? seedMatch.ajustesAprobados
      : [];

    const responseObj = {
      _id: userProfile._id || `user_${email}`,
      id: userProfile._id || `user_${email}`,
      email,
      emailDuoc: email,
      fullName,
      nombre: fullName,
      rol: userProfile.role || (seedMatch ? seedMatch.role : inferred.role),
      roleLabel,
      isPaedis,
      isPreRegisteredUser: Boolean(seedMatch),
      rut: userProfile.rut || (seedMatch ? seedMatch.rut : 'Sin RUT registrado'),
      career,
      carrera: career,
      campus,
      sede: campus,
      address,
      direccion: address,
      personalEmail,
      emailPersonal: personalEmail,
      phone,
      telefonoPersonal: phone,
      emergencyContact:
        userProfile.emergencyContact ||
        (seedMatch ? seedMatch.emergencyContact : 'No registrado'),
      emergencyPhone:
        userProfile.emergencyPhone ||
        (seedMatch ? seedMatch.emergencyPhone : 'No registrado'),
      tutorParAsignado:
        userProfile.tutorParAsignado ||
        (seedMatch ? seedMatch.tutorParAsignado : 'Acompañamiento General Duoc UC'),
      ajustesAprobados,
      accessibilityPreferences: userProfile.accessibilityPreferences ||
        (seedMatch ? seedMatch.accessibilityPreferences : {
          fontSize: 'normal',
          highContrast: false,
          dyslexicFont: false,
          reducedMotion: false,
          screenReaderOptimized: true,
        }),
      enrolledCourses:
        userProfile.enrolledCourses ||
        (seedMatch ? seedMatch.enrolledCourses : []),
    };

    if (userProfile.role !== undefined) {
      responseObj.role = userProfile.role;
    }

    return responseObj;
  }

  async findOrCreateUserProfile(email) {
    const cleanEmail = (email || 'c.guzman@duocuc.cl').trim().toLowerCase();
    const seedMatch = SEED_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    const inferred = this.inferDefaultRoleFromEmail(cleanEmail);

    // REGLA SOLICITADA POR EL USUARIO:
    // Si el correo pertenece a uno de los 10 usuarios de nuestra BD, usa su nombre y rol real.
    // Si no está entre los 10 usuarios, se captura su correo y ese correo pasa a ser su nombre.
    const defaultProfileData = seedMatch
      ? { ...seedMatch }
      : {
          email: cleanEmail,
          fullName: cleanEmail, // Su correo es su nombre cuando no está entre los 10 precargados
          role: inferred.role,
          roleLabel: inferred.roleLabel,
          isPaedis: false,
          rut: 'En validación institucional',
          career: inferred.career,
          campus: 'Sede Alameda',
          address: 'Por actualizar en Mi Perfil',
          personalEmail: cleanEmail,
          phone: '+56 9 0000 0000',
          emergencyContact: 'Por actualizar',
          emergencyPhone: '+56 9 0000 0000',
          tutorParAsignado: 'Usuario autenticado por correo institucional',
          ajustesAprobados: [],
          accessibilityPreferences: {
            fontSize: 'normal',
            highContrast: false,
            dyslexicFont: false,
            reducedMotion: false,
            screenReaderOptimized: true,
          },
          enrolledCourses: [],
        };

    // Actualizar en memoria siempre para disponibilidad inmediata
    const existingMem = inMemoryUsers.get(cleanEmail) || {};
    const mergedMem = {
      _id: existingMem._id || `local_${cleanEmail}`,
      ...defaultProfileData,
      ...existingMem,
      email: cleanEmail,
      fullName: existingMem.fullName || defaultProfileData.fullName,
      role: existingMem.role || defaultProfileData.role,
      roleLabel: existingMem.roleLabel || defaultProfileData.roleLabel,
      isPaedis:
        typeof existingMem.isPaedis === 'boolean'
          ? existingMem.isPaedis
          : defaultProfileData.isPaedis,
      lastLogin: new Date(),
    };
    inMemoryUsers.set(cleanEmail, mergedMem);

    if (mongoose.connection.readyState !== 1) {
      return mergedMem;
    }

    try {
      const user = await UserProfile.findOneAndUpdate(
        { email: cleanEmail },
        {
          $set: { lastLogin: new Date() },
          $setOnInsert: {
            fullName: defaultProfileData.fullName,
            role: defaultProfileData.role,
            roleLabel: defaultProfileData.roleLabel,
            isPaedis: defaultProfileData.isPaedis,
            rut: defaultProfileData.rut,
            career: defaultProfileData.career,
            campus: defaultProfileData.campus,
            address: defaultProfileData.address,
            personalEmail: defaultProfileData.personalEmail,
            phone: defaultProfileData.phone,
            emergencyContact: defaultProfileData.emergencyContact,
            emergencyPhone: defaultProfileData.emergencyPhone,
            tutorParAsignado: defaultProfileData.tutorParAsignado,
            ajustesAprobados: defaultProfileData.ajustesAprobados,
            accessibilityPreferences: defaultProfileData.accessibilityPreferences,
            enrolledCourses: defaultProfileData.enrolledCourses,
          },
        },
        { upsert: true, new: true }
      );
      return user;
    } catch (err) {
      console.warn('[DB Fallback] MongoDB no disponible temporalmente:', err.message);
      return mergedMem;
    }
  }

  generateJwt(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        fullName: user.fullName || user.nombre || user.email,
        role: user.role || user.rol || 'estudiante',
        roleLabel: user.roleLabel || 'Estudiante Duoc UC',
      },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '8h' }
    );
  }
}

module.exports = new AuthScraperService();
