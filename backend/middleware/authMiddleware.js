const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');

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

    // Soporte controlado para sesión Demo exclusivamente fuera de producción
    if (isDemoTokenAllowed(token)) {
      req.user = {
        _id: 'seed_admin_c_guzman',
        id: 'seed_admin_c_guzman',
        email: 'c.guzman@duocuc.cl',
        fullName: 'Cristian Guzmán',
        role: 'admin',
        roleLabel: 'Administrador del Sistema Nexo360',
      };
      return next();
    }

    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

    if (decoded.id && mongoose.connection.readyState === 1) {
      try {
        const user = await UserProfile.findById(decoded.id).lean();
        req.user = user || decoded;
      } catch {
        req.user = decoded;
      }
    } else {
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

/**
 * Middleware para restringir acceso exclusivo a Administradores
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso restringido: Se requieren privilegios de Administrador para acceder a este módulo.',
    });
  }
  next();
};

/**
 * Middleware opcional: si hay token válido adjunta el usuario
 */
const optionalToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (isDemoTokenAllowed(token)) {
        req.user = {
          _id: 'seed_admin_c_guzman',
          id: 'seed_admin_c_guzman',
          email: 'c.guzman@duocuc.cl',
          fullName: 'Cristian Guzmán',
          role: 'admin',
          roleLabel: 'Administrador del Sistema Nexo360',
        };
        return next();
      }
      const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
      if (decoded.id && mongoose.connection.readyState === 1) {
        const user = await UserProfile.findById(decoded.id).lean().catch(() => null);
        req.user = user || decoded;
      } else {
        req.user = decoded;
      }
    }
  } catch {
    // Continuar sin usuario autenticado
  }
  next();
};

module.exports = { verifyToken, requireAdmin, optionalToken, getJwtSecret };
