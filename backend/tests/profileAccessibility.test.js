const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../middleware/authMiddleware');
const UserProfile = require('../models/UserProfile');
const authService = require('../services/authService');

test('Perfil y Accesibilidad: Foto, Cortina, Persistencia A11y y Overlay Z-Index', async (t) => {
  const secret = getJwtSecret();
  const testUser = {
    email: 'c.guzman@duocuc.cl',
    fullName: 'CRISTIAN GUZMAN',
    role: 'estudiante',
    roleLabel: 'Estudiante Regular Duoc UC',
  };
  const token = jwt.sign(testUser, secret, { algorithm: 'HS256', expiresIn: '1h' });

  await t.test('1. Persistencia de Foto de Perfil en UserProfile y formato de respuesta', async () => {
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const formatted = authService.formatUserResponse({
      email: testUser.email,
      fullName: testUser.fullName,
      photo: sampleBase64,
    });

    assert.equal(formatted.photo, sampleBase64, 'La foto debe mantenerse en el usuario formateado');
  });

  await t.test('2. Persistencia de Preferencias de Accesibilidad completas (con readingGuide)', async () => {
    const preferences = {
      fontSize: 'large',
      highContrast: true,
      dyslexicFont: true,
      reducedMotion: false,
      readingGuide: true,
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
    assert.equal(formatted.accessibilityPreferences.readingGuide, true, 'readingGuide debe persistirse en preferencias');
  });

  await t.test('3. ReadingGuideOverlay tiene z-index z-[9999] como máxima capa de apilamiento', async () => {
    const filePath = path.resolve(__dirname, '../../frontend/src/components/common/ReadingGuideOverlay.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('z-[9999]'),
      'ReadingGuideOverlay debe contener la clase z-[9999] para garantizar visibilidad global'
    );
  });

  await t.test('4. Transición de Cortina (Curtain Reveal) configurada en index.css', async () => {
    const cssPath = path.resolve(__dirname, '../../frontend/src/index.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.ok(css.includes('curtainWipeReveal'), 'index.css debe incluir la animación curtainWipeReveal');
    assert.ok(css.includes('::view-transition-new(root)'), 'index.css debe configurar view-transition para la cortina');
    assert.ok(css.includes('clip-path: inset(0 0 100% 0)'), 'clip-path debe generar el efecto de revelado cortina');
  });

  await t.test('5. Navbar refleja la fotografía de perfil persistente', async () => {
    const navbarPath = path.resolve(__dirname, '../../frontend/src/components/common/UnifiedNavbar.jsx');
    const navbar = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(
      navbar.includes('user?.photo') && navbar.includes('<img'),
      'UnifiedNavbar debe renderizar la etiqueta <img> para la foto del usuario'
    );
  });
});
