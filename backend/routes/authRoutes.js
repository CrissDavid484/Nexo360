const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de inicio de sesión. Por seguridad, intente nuevamente en 15 minutos.',
});

const mfaPollingLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Límite de consultas de estado MFA alcanzado. Espere unos segundos.',
});

// Rutas públicas de autenticación institucional
router.get('/users', authController.getInstitutionalUsers);
router.get('/ley21719', authController.getLey21719Info);
router.post('/sso-login', loginLimiter, authController.ssoLogin);
router.post('/login', loginLimiter, authController.login);
router.get('/mfa-status/:sessionId', mfaPollingLimiter, authController.getMfaStatus);

// Rutas protegidas con JWT: Perfil, Accesibilidad y Simulador de Toma de Ramos en MongoDB
router.get('/me', verifyToken, authController.getProfile);
router.put('/accessibility', verifyToken, authController.updateAccessibility);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/profile/photo', verifyToken, authController.updatePhoto);
router.get('/toma-ramos', verifyToken, authController.getTomaRamos);
router.post('/toma-ramos', verifyToken, authController.saveTomaRamos);
router.put('/toma-ramos', verifyToken, authController.saveTomaRamos);
router.post('/simulator-log', verifyToken, authController.recordSimulatorUsage);

module.exports = router;
