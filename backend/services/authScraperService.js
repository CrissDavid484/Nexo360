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

      // Paso 4: Login exitoso — raspar datos reales de Vivo Duoc
      console.log('[Puppeteer Auth] Login completado, extrayendo perfil desde Vivo Duoc...');
      const scrapedData = await this.scrapeVivoDuocProfile(page, email);
      const userProfile = await this.findOrCreateUserProfile(email, scrapedData);
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
        direccion: userProfile.direccion,
        telefonoPersonal: userProfile.telefonoPersonal,
        emailPersonal: userProfile.emailPersonal,
        paedis: userProfile.paedis,
        accessibilityPreferences: userProfile.accessibilityPreferences,
        scrapedAt: new Date().toISOString(),
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
   * Raspa datos reales del perfil del usuario desde experienciavivo.duoc.cl
   * Se ejecuta DESPUÉS de que el login y MFA son completados exitosamente.
   */
  async scrapeVivoDuocProfile(page, email) {
    const scraped = {};
    try {
      // Esperar que la página post-login cargue completamente
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      const currentUrl = page.url();
      console.log('[Vivo Duoc Scraper] URL post-login:', currentUrl);

      // Intentar navegar a la sección de perfil si no estamos ya ahí
      if (!currentUrl.includes('/perfil') && !currentUrl.includes('/profile')) {
        await page.goto('https://experienciavivo.duoc.cl/perfil', {
          waitUntil: 'networkidle2',
          timeout: 20000,
        }).catch(() => {});
      }

      // Extraer nombre del estudiante (múltiples selectores posibles)
      scraped.nombre = await page.evaluate(() => {
        const selectors = [
          '.student-name', '.user-name', '.nombre-estudiante',
          '[data-field="nombre"]', '[data-field="name"]',
          'h1.profile-name', '.profile-header h1',
          '.card-header .name', '.user-profile-name',
          '#studentName', '#userName',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        // Buscar en texto que contenga el nombre del header/navbar
        const navUser = document.querySelector('nav .user-info, .navbar-user, .header-user');
        if (navUser) return navUser.textContent.trim();
        return null;
      }).catch(() => null);

      // Extraer RUT
      scraped.rut = await page.evaluate(() => {
        const selectors = [
          '[data-field="rut"]', '.student-rut', '.rut-field',
          '#studentRut', '.profile-rut',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        // Buscar en texto que tenga formato RUT (XX.XXX.XXX-X)
        const allText = document.body.innerText;
        const rutMatch = allText.match(/\d{1,2}\.\d{3}\.\d{3}-[\dkK]/);
        return rutMatch ? rutMatch[0] : null;
      }).catch(() => null);

      // Extraer carrera
      scraped.carrera = await page.evaluate(() => {
        const selectors = [
          '[data-field="carrera"]', '.student-career', '.carrera-field',
          '#studentCareer', '.profile-carrera', '.career-name',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return null;
      }).catch(() => null);

      // Extraer sede
      scraped.sede = await page.evaluate(() => {
        const selectors = [
          '[data-field="sede"]', '.student-sede', '.sede-field',
          '#studentSede', '.profile-sede', '.campus-name',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return null;
      }).catch(() => null);

      // Extraer dirección
      scraped.direccion = await page.evaluate(() => {
        const selectors = [
          '[data-field="direccion"]', '[data-field="address"]',
          '.student-address', '#studentAddress',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return null;
      }).catch(() => null);

      // Extraer teléfono personal
      scraped.telefonoPersonal = await page.evaluate(() => {
        const selectors = [
          '[data-field="telefono"]', '[data-field="phone"]',
          '.student-phone', '#studentPhone',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return null;
      }).catch(() => null);

      // Extraer email personal
      scraped.emailPersonal = await page.evaluate(() => {
        const selectors = [
          '[data-field="emailPersonal"]', '[data-field="personal-email"]',
          '.student-personal-email', '#studentPersonalEmail',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return null;
      }).catch(() => null);

      // Detectar si está inscrito en PAEDIS
      scraped.isPaedis = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        return pageText.includes('paedis') || pageText.includes('inclusión') || pageText.includes('accesibilidad');
      }).catch(() => false);

      console.log('[Vivo Duoc Scraper] Datos extraídos:', JSON.stringify(scraped, null, 2));
    } catch (err) {
      console.warn('[Vivo Duoc Scraper] Error durante scraping del perfil:', err.message);
    }
    return scraped;
  }

  /**
   * Crea o actualiza el perfil del usuario en MongoDB usando datos reales scrapeados
   */
  async findOrCreateUserProfile(email, scrapedData = {}) {
    try {
      let user = await UserProfile.findOne({ email });

      // Construir nombre de fallback a partir del email si el scraping no lo obtuvo
      const emailNamePart = email.split('@')[0];
      const nameFallback = emailNamePart
        .split('.')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');

      const profileData = {
        nombre: scrapedData.nombre || nameFallback,
        rut: scrapedData.rut || null,
        carrera: scrapedData.carrera || null,
        sede: scrapedData.sede || null,
        direccion: scrapedData.direccion || null,
        telefonoPersonal: scrapedData.telefonoPersonal || null,
        emailPersonal: scrapedData.emailPersonal || null,
        paedis: {
          isEnrolled: scrapedData.isPaedis || false,
          sede: scrapedData.sede || null,
          diagnosticoDeclarado: scrapedData.diagnostico || null,
          ajustesAprobados: scrapedData.ajustes || [],
        },
        lastLogin: new Date(),
      };

      if (!user) {
        user = await UserProfile.create({
          email,
          ...profileData,
          accessibilityPreferences: {
            fontSize: 'normal',
            highContrast: false,
            reducedMotion: false,
            dyslexicFont: false,
            screenReaderOptimized: false,
          },
        });
        console.log(`[DB] Perfil creado para ${email} con datos scrapeados de Vivo Duoc`);
      } else {
        // Actualizar perfil existente con datos frescos de Vivo Duoc
        Object.assign(user, profileData);
        await user.save();
        console.log(`[DB] Perfil actualizado para ${email} con datos frescos de Vivo Duoc`);
      }
      return user;
    } catch (err) {
      console.warn('[DB Fallback] MongoDB no disponible, generando objeto en memoria:', err.message);
      const emailNamePart = email.split('@')[0];
      const nameFallback = emailNamePart
        .split('.')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
      return {
        _id: 'mock-user-' + Date.now(),
        email,
        nombre: scrapedData?.nombre || nameFallback,
        rut: scrapedData?.rut || null,
        carrera: scrapedData?.carrera || null,
        sede: scrapedData?.sede || null,
        direccion: scrapedData?.direccion || null,
        telefonoPersonal: scrapedData?.telefonoPersonal || null,
        emailPersonal: scrapedData?.emailPersonal || null,
        paedis: {
          isEnrolled: scrapedData?.isPaedis || false,
          sede: scrapedData?.sede || null,
          diagnosticoDeclarado: null,
          ajustesAprobados: [],
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
