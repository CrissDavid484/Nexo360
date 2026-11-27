const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requirePermission } = require('../middleware/authMiddleware');
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

const passwordRecoveryLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de recuperación de contraseña. Intente nuevamente en 15 minutos.',
});

// Rutas de autenticación institucional y OIDC Entra ID
router.get('/oidc/status', authController.getOidcStatus);
router.get('/oidc/authorize', authController.getOidcAuthorize);
router.post('/oidc/callback', loginLimiter, authController.oidcCallback);
router.get('/demo-accounts', authController.getDemoAccounts);
router.get(
  '/users',
  verifyToken,
  requirePermission('manage_users', 'manage_students', 'sat_monitoring', 'paedis_read'),
  authController.getInstitutionalUsers
);
router.get('/ley21719', authController.getLey21719Info);
router.post('/sso-login', loginLimiter, authController.ssoLogin);
router.post('/login', loginLimiter, authController.login);
router.get('/verify-activation-token', authController.verifyActivationToken);
router.get('/activate-account/verify', authController.verifyActivationToken);
router.post('/activate-account', loginLimiter, authController.activateAccount);
router.post('/forgot-password', passwordRecoveryLimiter, authController.forgotPassword);
router.post('/reset-password', passwordRecoveryLimiter, authController.resetPassword);
router.get('/mfa-status/:sessionId', mfaPollingLimiter, authController.getMfaStatus);

// Rutas protegidas con JWT: Perfil, Accesibilidad y Simulador de Toma de Ramos en MongoDB
router.get('/me', verifyToken, authController.getProfile);
router.put('/change-password', verifyToken, authController.changePassword);
router.put('/accessibility', verifyToken, authController.updateAccessibility);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/profile/photo', verifyToken, authController.updatePhoto);
router.get('/toma-ramos', verifyToken, authController.getTomaRamos);
router.post('/toma-ramos', verifyToken, authController.saveTomaRamos);
router.put('/toma-ramos', verifyToken, authController.saveTomaRamos);
router.post('/simulator-log', verifyToken, authController.recordSimulatorUsage);

module.exports = router;
