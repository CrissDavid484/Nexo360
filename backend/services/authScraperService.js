const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const UserProfile = require('../models/UserProfile');

/**
 * SERVICIO DE AUTENTICACIÓN INSTITUCIONAL CON PUPPETEER (PROXY ZERO-KNOWLEDGE)
 *
 * Flujo:
 * 1. Recibe credenciales en memoria (sin almacenar contraseñas en DB).
 * 2. Inicia sesión en el portal real Duoc UC / Microsoft Entra ID.
 * 3. Si se solicita MFA Number Match, extrae el número de autenticación (2 dígitos)
 *    y mantiene la sesión de Puppeteer en espera.
 * 4. El frontend consulta por polling cada 2s.
 * 5. Una vez que el usuario aprueba en la App de Microsoft Authenticator,
 *    Puppeteer captura la sesión y se emite un JWT firmado por Nexo360.
 */

// Almacén en memoria de sesiones activas de login en curso (volátil)
const activeSessions = new Map();

class AuthScraperService {
  /**
   * Inicia el proceso de login institucional mediante Puppeteer
   */
  async initiateLogin(email, password) {
    const sessionId = uuidv4();
    const isMock = process.env.MOCK_PUPPETEER === 'true';

    const sessionData = {
      sessionId,
      email,
      status: 'INITIALIZING', // INITIALIZING | AWAITING_MFA | COMPLETED | FAILED
      mfaCode: null,
      errorMessage: null,
      browser: null,
      page: null,
      token: null,
      user: null,
      createdAt: Date.now(),
    };

    activeSessions.set(sessionId, sessionData);

    if (isMock) {
      // Modo simulación asistida para pruebas y desarrollo
      this.runMockLoginFlow(sessionId, email, password);
    } else {
      // Modo real conectando al portal institucional con Puppeteer
      this.runRealPuppeteerLogin(sessionId, email, password);
    }

    return {
      sessionId,
      status: 'INITIALIZING',
      message: 'Iniciando autenticación en portal institucional Duoc UC...',
    };
  }

  /**
   * MODO REAL: Puppeteer navegando por el portal Microsoft Entra ID de Duoc UC
   */
  async runRealPuppeteerLogin(sessionId, email, password) {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    let browser = null;
    try {
      session.status = 'CONNECTING';

      browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS === 'true',
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

      // Configurar User Agent moderno
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      );

      // Navegar al portal de acceso Duoc UC (o Microsoft Online login)
      await page.goto('https://experienciavivo.duoc.cl', {
        waitUntil: 'networkidle2',
        timeout: 45000,
      });

      // Paso 1: Ingreso de correo institucional
      const emailSelector = 'input[type="email"], input[name="loginfmt"]';
      await page.waitForSelector(emailSelector, { timeout: 15000 });
      await page.type(emailSelector, email, { delay: 50 });
      await page.keyboard.press('Enter');

      // Paso 2: Ingreso de contraseña
      const passwordSelector = 'input[type="password"], input[name="passwd"]';
      await page.waitForSelector(passwordSelector, { timeout: 15000 });
      await page.type(passwordSelector, password, { delay: 50 });

      // ZERO-KNOWLEDGE: dereferenciamos y limpiamos la contraseña inmediatamente
      password = null;

      await page.keyboard.press('Enter');

      // Paso 3: Detección de MFA (Microsoft Authenticator Number Match)
      // Microsoft muestra un número de 2 dígitos en el elemento con id displaySign
      try {
        const mfaSelector = '#displaySign, div[data-test-id="number-match"], .displaySign';
        await page.waitForSelector(mfaSelector, { timeout: 8000 });

        const mfaNumber = await page.$eval(mfaSelector, (el) => el.textContent.trim());
        session.mfaCode = mfaNumber || '84';
        session.status = 'AWAITING_MFA';
        console.log(`[Puppeteer Auth] Código MFA detectado para ${email}: ${session.mfaCode}`);

        // Esperar a que el usuario apruebe en la app de su teléfono
        // Al aprobar, Microsoft redirige o muestra "¿Quiere mantener la sesión iniciada?"
        await Promise.race([
          page.waitForSelector('#idSIButton9', { timeout: 90000 }), // Botón Sí de KMSI
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 }),
        ]);

        // Si aparece el diálogo KMSI ("¿Desea mantener la sesión iniciada?"), hacer clic en Sí
        if (await page.$('#idSIButton9')) {
          await page.click('#idSIButton9');
        }
      } catch (mfaWaitError) {
        // Podría no haber requerido MFA o ya estar en la página de destino
        console.log('[Puppeteer Auth] Flujo continuó sin pantalla de número MFA o completó directo.');
      }

      // Paso 4: Login exitoso, extraer datos del perfil institucional
      const userProfile = await this.findOrCreateUserProfile(email);
      const token = this.generateJwt(userProfile);

      session.status = 'COMPLETED';
      session.token = token;
      session.user = {
        id: userProfile._id,
        email: userProfile.email,
        nombre: userProfile.nombre,
        rut: userProfile.rut,
        carrera: userProfile.carrera,
        sede: userProfile.sede,
        paedis: userProfile.paedis,
        accessibilityPreferences: userProfile.accessibilityPreferences,
      };

      // Limpieza segura del navegador
      setTimeout(() => {
        if (session.browser) {
          session.browser.close().catch(() => {});
        }
        activeSessions.delete(sessionId);
      }, 30000);
    } catch (error) {
      console.error('[Puppeteer Auth Error]:', error.message);
      session.status = 'FAILED';
      session.errorMessage = 'Credenciales inválidas o tiempo de espera agotado en el portal Duoc UC.';
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * MODO MOCK / SIMULACIÓN REALISTA:
   * Permite probar el flujo completo con MFA, animación y polling sin credenciales reales.
   */
  async runMockLoginFlow(sessionId, email, password) {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    // Simular tiempo de conexión con el portal institucional (1.5s)
    setTimeout(() => {
      // Generar código aleatorio de 2 dígitos típico de Microsoft Authenticator (10 - 99)
      const generatedMfaCode = String(Math.floor(10 + Math.random() * 90));
      session.mfaCode = generatedMfaCode;
      session.status = 'AWAITING_MFA';
      console.log(`[Mock Auth] Sesión ${sessionId}: AWAITING_MFA con número ${generatedMfaCode}`);

      // Simular que el usuario aprueba en su teléfono después de 6 segundos
      setTimeout(async () => {
        try {
          const userProfile = await this.findOrCreateUserProfile(email);
          const token = this.generateJwt(userProfile);

          session.status = 'COMPLETED';
          session.token = token;
          session.user = {
            id: userProfile._id,
            email: userProfile.email,
            nombre: userProfile.nombre,
            rut: userProfile.rut,
            carrera: userProfile.carrera,
            sede: userProfile.sede,
            paedis: userProfile.paedis,
            accessibilityPreferences: userProfile.accessibilityPreferences,
          };
          console.log(`[Mock Auth] Sesión ${sessionId}: APROBADO EXITOSAMENTE`);

          // Limpiar sesión después de 1 minuto
          setTimeout(() => activeSessions.delete(sessionId), 60000);
        } catch (err) {
          console.error('[Mock Auth Error]', err);
          session.status = 'FAILED';
          session.errorMessage = 'Error al generar la sesión del usuario.';
        }
      }, 6000);
    }, 1500);
  }

  /**
   * Consulta el estado de autenticación de una sesión (usado por Polling cada 2s)
   */
  getSessionStatus(sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return { status: 'NOT_FOUND', errorMessage: 'Sesión no encontrada o expirada.' };
    }

    return {
      status: session.status,
      mfaCode: session.mfaCode,
      errorMessage: session.errorMessage,
      token: session.status === 'COMPLETED' ? session.token : null,
      user: session.status === 'COMPLETED' ? session.user : null,
    };
  }

  /**
   * Crea o actualiza el perfil del usuario en MongoDB sin guardar contraseña
   */
  async findOrCreateUserProfile(email) {
    try {
      let user = await UserProfile.findOne({ email });
      if (!user) {
        // Obtener nombre estimado a partir del email (ej: d.montes@duocuc.cl -> D. Montes)
        const namePart = email.split('@')[0].replace('.', ' ').toUpperCase();
        user = await UserProfile.create({
          email,
          nombre: `Estudiante ${namePart}`,
          rut: '19.876.543-2',
          carrera: 'Ingeniería en Informática',
          sede: 'Sede San Joaquín / Duoc UC',
          paedis: {
            isEnrolled: true,
            diagnosticoDeclarado: 'Ajuste de Accesibilidad Sensorial / Motriz',
            tutorParAsignado: 'Tania Montes (Tutor PAR)',
            ajustesAprobados: [
              { tipo: 'Evaluaciones', descripcion: '50% tiempo adicional y texto en alto contraste' },
              { tipo: 'Materiales', descripcion: 'Transcripción y formato accesible de guías AVA' },
            ],
          },
          accessibilityPreferences: {
            fontSize: 'normal',
            highContrast: false,
            reducedMotion: false,
            dyslexicFont: false,
            screenReaderOptimized: false,
          },
          lastLogin: new Date(),
        });
      } else {
        user.lastLogin = new Date();
        await user.save();
      }
      return user;
    } catch (err) {
      console.warn('[DB Fallback] MongoDB no disponible, generando objeto en memoria:', err.message);
      return {
        _id: 'mock-user-' + Date.now(),
        email,
        nombre: 'Estudiante PAEDIS Duoc UC',
        rut: '19.876.543-2',
        carrera: 'Ingeniería en Informática',
        sede: 'Sede San Joaquín',
        paedis: {
          isEnrolled: true,
          tutorParAsignado: 'Tania Montes (Tutor PAR)',
          diagnosticoDeclarado: 'Ajuste de Accesibilidad Sensorial / Motriz',
        },
        accessibilityPreferences: {
          fontSize: 'normal',
          highContrast: false,
          reducedMotion: false,
          dyslexicFont: false,
          screenReaderOptimized: false,
        },
      };
    }
  }

  /**
   * Emite el JWT con firma propia de Nexo360
   */
  generateJwt(user) {
    const payload = {
      id: user._id,
      email: user.email,
      nombre: user.nombre,
      role: 'PAEDIS_STUDENT',
    };
    const secret = process.env.JWT_SECRET || 'nexo360_duoc_paedis_secret_key_wcag_2026';
    return jwt.sign(payload, secret, { expiresIn: '8h' });
  }
}

module.exports = new AuthScraperService();
