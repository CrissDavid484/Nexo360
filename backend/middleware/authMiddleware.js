const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');

const DEMO_ADMIN_USER = Object.freeze({
  _id: 'seed_admin_c_guzman',
  id: 'seed_admin_c_guzman',
  email: 'c.guzman@duocuc.cl',
  fullName: 'Cristian Guzmán',
  role: 'admin',
  roleLabel: 'Administrador del Sistema Nexo360',
});

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_SECRET debe estar definido en producción.');
  }
  return 'nexo360_duoc_paedis_secret_key_wcag_2026';
};

const isDemoTokenAllowed = (token) =>
  token === 'demo-token-cristian' && process.env.NODE_ENV !== 'production';

/**
 * Resuelve la identidad del usuario a partir de la cabecera Authorization Bearer.
 */
async function resolveUserFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 'missing', user: null };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { status: 'missing', user: null };
  }

  if (isDemoTokenAllowed(token)) {
    return { status: 'ok', user: { ...DEMO_ADMIN_USER } };
  }

  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

  const rawEmail = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
  const rawId =
    typeof decoded.id === 'string' && mongoose.Types.ObjectId.isValid(decoded.id)
      ? new mongoose.Types.ObjectId(decoded.id)
      : null;

  if (rawEmail && mongoose.connection.readyState === 1) {
    try {
      const query = rawId
        ? { $or: [{ _id: rawId }, { email: { $eq: rawEmail } }] }
        : { email: { $eq: rawEmail } };
      const user = await UserProfile.findOne(query).lean();
      if (user) {
        if (user.isBlocked === true || user.academicStatus === 'desercion_bloqueada') {
          return { status: 'blocked', user: null };
        }
        return { status: 'ok', user };
      }
    } catch (dbError) {
      console.warn('[AuthMiddleware] Error consultando UserProfile en MongoDB:', dbError.message);
      return { status: 'ok', user: decoded };
    }
  }

  return { status: 'ok', user: decoded };
}

/**
 * Middleware para validar el JWT de Nexo360 en rutas protegidas.
 */
const verifyToken = async (req, res, next) => {
  try {
    const resolved = await resolveUserFromHeader(req.headers.authorization);
    if (resolved.status === 'missing') {
      return res.status(401).json({
        success: false,
        message: 'No autorizado: Token de autenticación no proporcionado',
      });
    }

    if (resolved.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Esta cuenta institucional se encuentra deshabilitada o suspendida.',
      });
    }

    req.user = resolved.user;
    return next();
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      console.warn('[AuthMiddleware] Error validando sesión JWT:', error.message);
    }
    return res.status(401).json({
      success: false,
      message: 'Token expirado o inválido. Por favor inicie sesión nuevamente.',
    });
  }
};

/**
 * Middleware para restringir acceso exclusivo a Administradores.
 */
const requireAdmin = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  const allowed = ['admin', 'administrador'];
  if (!allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      message:
        'Acceso restringido: Se requieren privilegios de Administrador para acceder a este módulo.',
    });
  }
  return next();
};

/**
 * Middleware para restringir acceso a Administradores y Coordinadores PAEDIS.
 */
const requireAdminOrCoordinator = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  const allowed = ['admin', 'administrador', 'coordinador_paedis'];
  if (!allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      message:
        'Acceso restringido: Se requieren privilegios de Administrador o Coordinador PAEDIS para acceder a este módulo.',
    });
  }
  return next();
};

/**
 * Middleware para restringir acceso exclusivo a Coordinadores PAEDIS (Expedientes confidenciales Ley N° 21.719).
 */
const requirePaedisCoordinator = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (role !== 'coordinador_paedis') {
    return res.status(403).json({
      success: false,
      message:
        'Acceso restringido: Se requieren privilegios exclusivos de Coordinador PAEDIS para gestionar expedientes confidenciales.',
    });
  }
  return next();
};

/**
 * Middleware opcional: si hay token válido adjunta el usuario; ante token inválido continúa anónimo.
 */
const optionalToken = async (req, res, next) => {
  try {
    const resolved = await resolveUserFromHeader(req.headers.authorization);
    if (resolved.status === 'ok') {
      req.user = resolved.user;
    }
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      console.warn('[AuthMiddleware] Error inesperado en optionalToken:', error.message);
    }
  }
  return next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireAdminOrCoordinator,
  requirePaedisCoordinator,
  optionalToken,
  getJwtSecret,
};
