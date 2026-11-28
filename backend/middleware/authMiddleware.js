const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');

const STAFF_ROLE_DEFAULTS = Object.freeze({
  admin: {
    permissions: ['full_access', 'manage_users', 'manage_catalogs', 'manage_help_content', 'audit_logs', 'system_config'],
    badges: ['TI', 'SuperAdmin', 'Seguridad'],
  },
  administrador: {
    permissions: ['full_access', 'manage_users', 'manage_catalogs', 'manage_help_content', 'audit_logs', 'system_config'],
    badges: ['TI', 'SuperAdmin', 'Seguridad'],
  },
  coordinador_paedis: {
    permissions: ['paedis_read', 'paedis_write', 'manage_students', 'sat_monitoring', 'manage_help_content'],
    badges: ['PAEDIS', 'Inclusión', 'UAP'],
  },
  profesor: {
    permissions: ['paedis_read_students', 'class_management'],
    badges: ['Docencia', 'Aula'],
  },
  director: {
    permissions: ['institutional_overview', 'continuity_exceptions', 'titration_equity'],
    badges: ['Directivo', 'Gestión'],
  },
  subdirector: {
    permissions: ['institutional_overview', 'continuity_exceptions'],
    badges: ['Subdirección', 'Gestión'],
  },
  administrativo: {
    permissions: ['operational_support', 'benefits_management'],
    badges: ['Operaciones', 'Atención'],
  },
});

const DEMO_ADMIN_USER = Object.freeze({
  _id: 'seed_admin_c_guzman',
  id: 'seed_admin_c_guzman',
  email: 'c.guzman@duocuc.cl',
  fullName: 'Cristian Guzmán',
  role: 'admin',
  roleLabel: 'Administrador del Sistema Nexo360',
  tokenVersion: 0,
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
  token === 'demo-token-cristian' && process.env.NODE_ENV === 'test';

function isUserBlockedOrInactive(user) {
  return (
    user.isBlocked === true ||
    user.isActive === false ||
    user.academicStatus === 'desercion_bloqueada'
  );
}

function buildFreshRequestUser(rawUser) {
  const plain = typeof rawUser.toObject === 'function' ? rawUser.toObject() : { ...rawUser };
  const role = String(plain.role || 'estudiante').toLowerCase();
  const id = plain._id ? String(plain._id) : String(plain.id || '');
  return {
    ...plain,
    id,
    _id: plain._id || id,
    email: String(plain.email || '').trim().toLowerCase(),
    role,
    // Preservar explícitamente [] cuando los permisos fueron revocados; solo undefined delega a defaults de rol
    permissions: Array.isArray(plain.permissions) ? [...plain.permissions] : undefined,
    tokenVersion: Number(plain.tokenVersion ?? 0),
    isBlocked: plain.isBlocked === true,
    isActive: plain.isActive !== false,
    isPaedis: plain.isPaedis === true || role === 'estudiante_paedis',
    isRegisteredInDb: plain.isRegisteredInDb !== false,
  };
}

/**
 * Resuelve la identidad del usuario a partir de la cabecera Authorization Bearer (fail-closed).
 */
async function resolveUserFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 'missing', user: null };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { status: 'missing', user: null };
  }

  const authService = require('../services/authService');

  if (isDemoTokenAllowed(token)) {
    const demoUser = await authService.findRegisteredUser('c.guzman@duocuc.cl', false);
    if (demoUser) {
      if (isUserBlockedOrInactive(demoUser)) {
        return { status: 'blocked', user: null };
      }
      return { status: 'ok', user: buildFreshRequestUser(demoUser) };
    }
    return { status: 'ok', user: buildFreshRequestUser(DEMO_ADMIN_USER) };
  }

  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    issuer: 'nexo360-api',
    audience: 'nexo360-client',
  });

  const rawEmail = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
  if (!rawEmail) {
    return { status: 'revoked', user: null };
  }

  const rawId =
    typeof decoded.id === 'string' && mongoose.Types.ObjectId.isValid(decoded.id)
      ? new mongoose.Types.ObjectId(decoded.id)
      : null;

  let user = null;
  if (mongoose.connection.readyState === 1) {
    try {
      const query = rawId
        ? { $or: [{ _id: rawId }, { email: { $eq: rawEmail } }] }
        : { email: { $eq: rawEmail } };
      user = await UserProfile.findOne(query).lean();
    } catch (dbError) {
      console.warn('[AuthMiddleware] Error consultando UserProfile en MongoDB:', dbError.message);
      return { status: 'unavailable', user: null };
    }
    if (!user) {
      return { status: 'revoked', user: null };
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      return { status: 'unavailable', user: null };
    }
    user = await authService.findRegisteredUser(rawEmail, false);
    if (!user) {
      return { status: 'revoked', user: null };
    }
  }

  if (isUserBlockedOrInactive(user)) {
    return { status: 'blocked', user: null };
  }

  if (Number(decoded.tokenVersion ?? 0) < Number(user.tokenVersion ?? 0)) {
    return { status: 'revoked', user: null };
  }

  return { status: 'ok', user: buildFreshRequestUser(user) };
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

    if (resolved.status === 'revoked') {
      return res.status(401).json({
        success: false,
        message: 'Sesión revocada o usuario no válido. Por favor inicie sesión nuevamente.',
      });
    }

    if (resolved.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Esta cuenta institucional se encuentra deshabilitada o suspendida.',
      });
    }

    if (resolved.status === 'unavailable') {
      return res.status(503).json({
        success: false,
        message: 'Servicio de autenticación temporalmente no disponible. Intente nuevamente.',
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
 * Middleware para validar permisos granulares sobre el recurso solicitado.
 * Si user.permissions es un arreglo (incluso vacío []), se usa exactamente ese arreglo.
 */
const requirePermission = (...requiredPerms) => {
  const required = requiredPerms.flat().filter(Boolean);
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const role = (user.role || '').toLowerCase();
    const effectivePermissions = Array.isArray(user.permissions)
      ? user.permissions
      : (STAFF_ROLE_DEFAULTS[role]?.permissions || []);

    const isPaedisOnlyRoute =
      required.length > 0 && required.every((p) => p === 'paedis_read' || p === 'paedis_write');

    const hasDirectPerm = required.some((p) => effectivePermissions.includes(p));
    const hasNonPaedisFullAccess =
      !isPaedisOnlyRoute && effectivePermissions.includes('full_access');

    if (hasDirectPerm || hasNonPaedisFullAccess) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acceso restringido: Se requiere alguno de los permisos (${required.join(', ')}) para esta operación.`,
    });
  };
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
  requirePermission,
  optionalToken,
  getJwtSecret,
  resolveUserFromHeader,
  STAFF_ROLE_DEFAULTS,
};
