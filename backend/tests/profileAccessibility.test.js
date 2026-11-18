const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { getJwtSecret } = require('../middleware/authMiddleware');
const UserProfile = require('../models/UserProfile');
const authService = require('../services/authService');
const { request, setBaseUrl } = require('./testHelper');

let server;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      setBaseUrl(`http://127.0.0.1:${server.address().port}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Perfil y Accesibilidad: Foto, Cortina, Persistencia A11y, voiceReader y Overlay Z-Index', async (t) => {
  const secret = getJwtSecret();
  const testUser = {
    email: 'c.guzman@duocuc.cl',
    fullName: 'CRISTIAN GUZMAN',
    role: 'estudiante',
    roleLabel: 'Estudiante Regular Duoc UC',
  };

  await t.test('1. Persistencia de Foto de Perfil en UserProfile y formato de respuesta', async () => {
    const sampleBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const formatted = authService.formatUserResponse({
      email: testUser.email,
      fullName: testUser.fullName,
      photo: sampleBase64,
    });

    assert.equal(formatted.photo, sampleBase64, 'La foto debe mantenerse en el usuario formateado');
  });

  await t.test(
    '2. Persistencia de Preferencias de Accesibilidad completas (con readingGuide y voiceReader)',
    async () => {
      const preferences = {
        fontSize: 'large',
        highContrast: true,
        dyslexicFont: true,
        reducedMotion: false,
        readingGuide: true,
        voiceReader: true,
        screenReaderOptimized: true,
      };

      const formatted = authService.formatUserResponse({
        email: testUser.email,
        fullName: testUser.fullName,
        accessibilityPreferences: preferences,
      });

      assert.equal(formatted.accessibilityPreferences.fontSize, 'large');
      assert.equal(formatted.accessibilityPreferences.highContrast, true);
      assert.equal(formatted.accessibilityPreferences.dyslexicFont, true);
      assert.equal(formatted.accessibilityPreferences.reducedMotion, false);
      assert.equal(
        formatted.accessibilityPreferences.readingGuide,
        true,
        'readingGuide debe persistirse en preferencias'
      );
      assert.equal(
        formatted.accessibilityPreferences.voiceReader,
        true,
        'voiceReader debe persistirse en preferencias'
      );

      // Si una preferencia parcial omite claves nuevas, debe completar defaults sin undefined
      const partialFormatted = authService.formatUserResponse({
        email: testUser.email,
        accessibilityPreferences: { highContrast: true },
      });
      assert.equal(partialFormatted.accessibilityPreferences.voiceReader, false);
      assert.equal(partialFormatted.accessibilityPreferences.readingGuide, false);
      assert.equal(partialFormatted.accessibilityPreferences.screenReaderOptimized, true);
    }
  );

  await t.test('3. ReadingGuideOverlay tiene z-index z-[9999] como máxima capa de apilamiento', async () => {
    const filePath = path.resolve(
      __dirname,
      '../../frontend/src/components/common/ReadingGuideOverlay.jsx'
    );
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('z-[9999]'),
      'ReadingGuideOverlay debe contener la clase z-[9999] para garantizar visibilidad global'
    );
  });

  await t.test('4. Transición de Cortina (Curtain Reveal) configurada en index.css', async () => {
    const cssPath = path.resolve(__dirname, '../../frontend/src/index.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.ok(
      css.includes('curtainWipeReveal'),
      'index.css debe incluir la animación curtainWipeReveal'
    );
    assert.ok(
      css.includes('::view-transition-new(root)'),
      'index.css debe configurar view-transition para la cortina'
    );
    assert.ok(
      css.includes('clip-path: inset(0 0 100% 0)'),
      'clip-path debe generar el efecto de revelado cortina'
    );
  });

  await t.test('5. Navbar refleja la fotografía de perfil persistente', async () => {
    const navbarPath = path.resolve(
      __dirname,
      '../../frontend/src/components/common/UnifiedNavbar.jsx'
    );
    const navbar = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(
      navbar.includes('user?.photo') && navbar.includes('<img'),
      'UnifiedNavbar debe renderizar la etiqueta <img> para la foto del usuario'
    );
  });

  await t.test(
    '6. Endpoint PUT /api/auth/accessibility persiste voiceReader en esquema, sesión y GET /api/auth/me',
    async () => {
      const a11yUser = {
        email: 'a11y.voicereader.test@duocuc.cl',
        fullName: 'Estudiante A11y Voz',
        role: 'estudiante',
      };
      const a11yToken = jwt.sign(a11yUser, secret, { algorithm: 'HS256', expiresIn: '1h' });
      const headers = { Authorization: `Bearer ${a11yToken}` };

      // Validar esquema Mongoose para voiceReader
      const userDoc = new UserProfile({
        email: a11yUser.email,
        fullName: a11yUser.fullName,
        accessibilityPreferences: { voiceReader: true },
      });
      await userDoc.validate();
      assert.equal(userDoc.accessibilityPreferences.voiceReader, true);

      // Payload inválido debe retornar 400
      const invalidRes = await request('/api/auth/accessibility', {
        method: 'PUT',
        headers,
        body: { preferences: ['invalid-array'] },
      });
      assert.equal(invalidRes.status, 400);

      // Guardar voiceReader: true
      const updateRes = await request('/api/auth/accessibility', {
        method: 'PUT',
        headers,
        body: {
          preferences: {
            fontSize: 'xlarge',
            highContrast: false,
            dyslexicFont: true,
            reducedMotion: true,
            readingGuide: true,
            voiceReader: true,
            screenReaderOptimized: true,
          },
        },
      });
      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body?.success, true);
      assert.equal(updateRes.body?.accessibilityPreferences?.voiceReader, true);
      assert.equal(updateRes.body?.accessibilityPreferences?.readingGuide, true);

      // Consultar GET /api/auth/me y verificar persistencia
      const meRes = await request('/api/auth/me', { headers });
      assert.equal(meRes.status, 200);
      assert.equal(meRes.body?.user?.accessibilityPreferences?.voiceReader, true);
      assert.equal(meRes.body?.user?.accessibilityPreferences?.fontSize, 'xlarge');
    }
  );

  await t.test(
    '7. Rediseño FAB oculto en esquina, Autonomía No Videntes (Alt+V, announce TTS, estados ARIA) y MFA accesible',
    () => {
      const readFrontendFile = (relPath) =>
        fs.readFileSync(path.resolve(__dirname, '../../frontend/src', relPath), 'utf8');

      // 1. AccessibilityBar.jsx: FAB oculto en esquina inferior derecha con ícono universal Accessibility
      const a11yBar = readFrontendFile('components/common/AccessibilityBar.jsx');
      assert.ok(a11yBar.includes('Accessibility,') || a11yBar.includes('Accessibility\n'));
      assert.ok(!a11yBar.includes('SlidersHorizontal'));
      assert.ok(a11yBar.includes('Ajustes de accesibilidad'));
      assert.ok(a11yBar.includes('fixed bottom-5 right-0 z-50'));
      assert.ok(a11yBar.includes('rounded-l-full border border-r-0'));
      assert.ok(a11yBar.includes('max-w-0 opacity-0'));
      assert.ok(a11yBar.includes('max-w-[240px] opacity-100'));

      // 2. AccessibilityContext.jsx: locución automática en announce y anuncio del atajo Alt + V
      const a11yContext = readFrontendFile('context/AccessibilityContext.jsx');
      assert.ok(a11yContext.includes('speak(message, { force: priority === \'assertive\' })'));
      assert.ok(
        a11yContext.includes(
          'Lectura por voz activada. Presiona Escape para silenciar o Alt más V para desactivar'
        )
      );

      // 3. VoiceReaderObserver.jsx: atajo global Alt + V
      const voiceObserver = readFrontendFile('components/common/VoiceReaderObserver.jsx');
      assert.ok(voiceObserver.includes("event.code === 'KeyV'"));
      assert.ok(voiceObserver.includes('toggleVoiceReader()'));

      // 4. speechService.js: lectura enriquecida con estados semánticos
      const speechService = readFrontendFile('utils/speechService.js');
      assert.ok(speechService.includes("'expandido'") && speechService.includes("'contraído'"));
      assert.ok(speechService.includes("'activado'") && speechService.includes("'desactivado'"));
      assert.ok(speechService.includes("'deshabilitado'"));

      // 5. MfaPrompt.jsx: timeout extendido, botón escuchar nuevamente y cero tabIndex en region no interactiva
      const mfaPrompt = readFrontendFile('components/auth/MfaPrompt.jsx');
      assert.ok(mfaPrompt.includes('BASE_MAX_POLL_COUNT * 2'));
      assert.ok(mfaPrompt.includes('Escuchar código nuevamente'));
      assert.ok(!mfaPrompt.includes('tabIndex={0}'));
    }
  );
});
