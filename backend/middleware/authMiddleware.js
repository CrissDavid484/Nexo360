const jwt = require('jsonwebtoken');
const UserProfile = require('../models/UserProfile');

/**
 * Middleware para validar el JWT de Nexo360 en rutas protegidas
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado: Token de autenticación no proporcionado',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'nexo360_duoc_paedis_secret_key_wcag_2026';
    const decoded = jwt.verify(token, secret);

    try {
      const user = await UserProfile.findById(decoded.id);
      if (user) {
        req.user = user;
      } else {
        req.user = decoded;
      }
    } catch {
      req.user = decoded;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token expirado o inválido. Por favor inicie sesión nuevamente.',
    });
  }
};

module.exports = { verifyToken };
