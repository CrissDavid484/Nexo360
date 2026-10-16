const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Rutas públicas de autenticación
router.post('/login', authController.login);
router.get('/mfa-status/:sessionId', authController.getMfaStatus);

// Rutas protegidas (requieren JWT de Nexo360)
router.get('/me', verifyToken, authController.getProfile);
router.put('/accessibility', verifyToken, authController.updateAccessibility);

module.exports = router;
