const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const authService = require('../services/authService');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_FONT_SIZES = ['normal', 'large', 'xlarge'];

const sanitizeString = (val, maxLen = 120) =>
  typeof val === 'string' ? val.trim().slice(0, maxLen) : undefined;

/**
 * Helper para obtener o crear el perfil del estudiante autenticado en MongoDB
 */
const getOrCreateActiveUserProfile = async (reqUser) => {
  if (!reqUser || !reqUser.email) {
    throw new Error('Usuario no autenticado');
  }
  const user = await authService.findOrCreateUserProfile(reqUser.email);
  return authService.formatUserResponse(user);
};

/**
 * GET /api/auth/users
 * Obtiene el catálogo de usuarios institucionales de la Base de Datos Nexo360
 */
exports.getInstitutionalUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      officialLoginUrl: authService.getOfficialLoginUrl(),
      users,
    });
  } catch (error) {
    console.error('[AuthController] Error obteniendo usuarios de la BD:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudo obtener la lista de usuarios de la base de datos.',
    });
  }
};

/**
 * POST /api/auth/sso-login
 * Inicio de sesión institucional instantáneo vía Microsoft SSO contra MongoDB
 */
exports.ssoLogin = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese o seleccione su correo institucional de Duoc UC.',
      });
    }

    if (email.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'El correo excede la longitud máxima permitida.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'El correo debe pertenecer al dominio institucional (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).',
      });
    }

    const ssoResult = await authService.completeSsoLogin(cleanEmail);

    return res.status(200).json({
      success: true,
      status: 'COMPLETED',
      token: ssoResult.token,
      user: ssoResult.user,
      isRegisteredInDb: ssoResult.isRegisteredInDb,
      officialLoginUrl: ssoResult.officialLoginUrl,
      message: 'Sesión institucional iniciada exitosamente en Nexo360.',
    });
  } catch (error) {
    console.error('[AuthController] Error en ssoLogin:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al validar el usuario en la base de datos de Nexo360.',
    });
  }
};

/**
 * POST /api/auth/login
 * Inicio de sesión institucional nativo contra MongoDB con contraseñas cifradas (bcrypt)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese su correo institucional y contraseña.',
      });
    }

    if (email.length > 120 || password.length > 256) {
      return res.status(400).json({
        success: false,
        message: 'Las credenciales exceden la longitud máxima permitida.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'El correo debe pertenecer al dominio institucional (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).',
      });
    }

    const result = await authService.loginWithPassword(cleanEmail, password);

    return res.status(200).json({
      success: true,
      status: 'COMPLETED',
      token: result.token,
      user: result.user,
      isRegisteredInDb: result.isRegisteredInDb,
      officialLoginUrl: result.officialLoginUrl,
      message: 'Inicio de sesión institucional exitoso en Nexo360.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error('[AuthController] Error en login:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar las credenciales en la base de datos de Nexo360.',
    });
  }
};

/**
 * GET /api/auth/mfa-status/:sessionId
 */
exports.getMfaStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || !UUID_V4_REGEX.test(sessionId)) {
      return res.status(400).json({
        success: false,
        status: 'FAILED',
        errorMessage: 'Identificador de sesión MFA inválido.',
      });
    }

    return res.status(404).json({
      success: false,
      status: 'FAILED',
      errorMessage: 'La sesión de autenticación no existe o ha expirado.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'FAILED',
      errorMessage: 'Error al verificar el estado de autenticación.',
    });
  }
};

/**
 * POST /api/auth/simulator-log
 * Registra interacción con el Simulador de Toma de Ramos en MongoDB
 */
exports.recordSimulatorUsage = async (req, res) => {
  try {
    if (req.user && req.user.isRegisteredInDb === false) {
      return res.status(403).json({
        success: false,
        isRegisteredInDb: false,
        message:
          'Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.',
        code: 'SIMULATOR_ACCESS_DENIED_NOT_REGISTERED',
      });
    }
    await authService.recordSimulatorUsage(req.user);
    return res.status(200).json({
      success: true,
      message: 'Uso del simulador registrado en la base de datos.',
    });
  } catch (error) {
    return res.status(200).json({ success: true });
  }
};

/**
 * GET /api/auth/me
 * Obtiene el perfil del usuario autenticado
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await getOrCreateActiveUserProfile(req.user);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      user: authService.formatUserResponse(req.user || {}),
    });
  }
};

/**
 * PUT /api/auth/accessibility
 * Guarda preferencias de accesibilidad en MongoDB
 */
exports.updateAccessibility = async (req, res) => {
  try {
    const rawPrefs = req.body?.preferences;
    if (!rawPrefs || typeof rawPrefs !== 'object' || Array.isArray(rawPrefs)) {
      return res.status(400).json({
        success: false,
        message: 'Objeto de preferencias de accesibilidad inválido.',
      });
    }

    const sanitizedPreferences = {
      fontSize: VALID_FONT_SIZES.includes(rawPrefs.fontSize) ? rawPrefs.fontSize : 'normal',
      highContrast: Boolean(rawPrefs.highContrast),
      dyslexicFont: Boolean(rawPrefs.dyslexicFont),
      reducedMotion: Boolean(rawPrefs.reducedMotion),
      readingGuide: Boolean(rawPrefs.readingGuide),
      screenReaderOptimized:
        typeof rawPrefs.screenReaderOptimized === 'boolean' ? rawPrefs.screenReaderOptimized : true,
    };

    const targetEmail = String(req.user?.email || '').trim().toLowerCase();
    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o correo institucional inválido.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const updatedUser = await UserProfile.findOneAndUpdate(
        { email: { $eq: targetEmail } },
        { $set: { accessibilityPreferences: sanitizedPreferences } },
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Preferencias de accesibilidad guardadas en MongoDB.',
        accessibilityPreferences: updatedUser
          ? updatedUser.accessibilityPreferences
          : sanitizedPreferences,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Preferencias de accesibilidad aplicadas en sesión.',
      accessibilityPreferences: sanitizedPreferences,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: 'Preferencias aplicadas en la sesión actual.',
      accessibilityPreferences: req.body?.preferences,
    });
  }
};

/**
 * PUT /api/auth/profile
 * Actualiza los datos de perfil y contacto en MongoDB
 */
exports.updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const fullName = sanitizeString(body.fullName ?? body.nombre, 120);
    const rut = sanitizeString(body.rut, 20);
    const career = sanitizeString(body.career ?? body.carrera, 120);
    const campus = sanitizeString(body.campus ?? body.sede, 80);
    const phone = sanitizeString(body.phone ?? body.telefonoPersonal, 30);
    const address = sanitizeString(body.address ?? body.direccion, 200);
    const personalEmail = sanitizeString(body.personalEmail ?? body.emailPersonal, 120);
    const emergencyContact = sanitizeString(body.emergencyContact, 120);
    const emergencyPhone = sanitizeString(body.emergencyPhone, 30);
    const photo = typeof body.photo === 'string' ? body.photo.trim() : undefined;

    const updateFields = {
      ...(fullName !== undefined ? { fullName, nombre: fullName } : {}),
      ...(rut !== undefined ? { rut } : {}),
      ...(career !== undefined ? { career, carrera: career } : {}),
      ...(campus !== undefined ? { campus, sede: campus } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(personalEmail !== undefined ? { personalEmail: personalEmail.toLowerCase() } : {}),
      ...(emergencyContact !== undefined ? { emergencyContact } : {}),
      ...(emergencyPhone !== undefined ? { emergencyPhone } : {}),
      ...(photo !== undefined ? { photo } : {}),
    };

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos de contacto válidos para actualizar.',
      });
    }

    const targetEmail = String(req.user?.email || '').trim().toLowerCase();
    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o correo institucional inválido.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const updatedUser = await UserProfile.findOneAndUpdate(
        { email: { $eq: targetEmail } },
        { $set: updateFields },
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Datos de contacto actualizados en MongoDB.',
        user: authService.formatUserResponse(updatedUser),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Datos de contacto actualizados en sesión.',
      user: authService.formatUserResponse({ ...req.user, ...updateFields }),
    });
  } catch (error) {
    console.error('[AuthController] Error actualizando perfil:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudieron actualizar los datos de perfil.',
    });
  }
};

/**
 * PUT /api/auth/profile/photo
 * Actualiza la fotografía de perfil del estudiante en MongoDB
 */
exports.updatePhoto = async (req, res) => {
  try {
    const { photo } = req.body || {};
    if (typeof photo !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Formato de fotografía inválido. Debe ser una cadena de texto o Base64.',
      });
    }

    const cleanPhoto = photo.trim();
    const targetEmail = String(req.user?.email || '').trim().toLowerCase();
    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o correo institucional inválido.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const updatedUser = await UserProfile.findOneAndUpdate(
        { email: { $eq: targetEmail } },
        { $set: { photo: cleanPhoto } },
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Fotografía de perfil guardada exitosamente en MongoDB.',
        photo: updatedUser ? updatedUser.photo : cleanPhoto,
        user: authService.formatUserResponse(updatedUser),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Fotografía de perfil actualizada en sesión.',
      photo: cleanPhoto,
      user: authService.formatUserResponse({ ...req.user, photo: cleanPhoto }),
    });
  } catch (error) {
    console.error('[AuthController] Error actualizando fotografía de perfil:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudo actualizar la fotografía de perfil.',
    });
  }
};

/**
 * GET /api/auth/toma-ramos
 * Obtiene las asignaturas inscritas del estudiante en MongoDB
 */
exports.getTomaRamos = async (req, res) => {
  try {
    if (req.user && req.user.isRegisteredInDb === false) {
      return res.status(403).json({
        success: false,
        isRegisteredInDb: false,
        message:
          'Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.',
        code: 'SIMULATOR_ACCESS_DENIED_NOT_REGISTERED',
      });
    }

    const user = await getOrCreateActiveUserProfile(req.user);
    return res.status(200).json({
      success: true,
      enrolledCourses: user.enrolledCourses || [],
    });
  } catch (error) {
    console.error('[AuthController] Error obteniendo toma de ramos:', error.message);
    return res.status(200).json({
      success: true,
      enrolledCourses: [],
    });
  }
};

/**
 * POST /api/auth/toma-ramos
 * Guarda las asignaturas inscritas en el perfil del estudiante en MongoDB
 */
exports.saveTomaRamos = async (req, res) => {
  try {
    if (req.user && req.user.isRegisteredInDb === false) {
      return res.status(403).json({
        success: false,
        isRegisteredInDb: false,
        message:
          'Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.',
        code: 'SIMULATOR_ACCESS_DENIED_NOT_REGISTERED',
      });
    }

    const { enrolledCourses } = req.body || {};
    if (!Array.isArray(enrolledCourses) || enrolledCourses.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'El listado de asignaturas inscritas debe ser un arreglo válido (máximo 20 ramos).',
      });
    }

    const sanitizedCourses = enrolledCourses
      .filter((c) => c && typeof c === 'object' && typeof c.sigla === 'string' && typeof c.nombre === 'string')
      .map((c) => ({
        sigla: sanitizeString(c.sigla, 20),
        siglaEq: sanitizeString(c.siglaEq || '', 20) || '',
        nombre: sanitizeString(c.nombre, 120),
        seccion: sanitizeString(c.seccion || '001D', 20),
        creditos: Math.max(0, Math.min(50, Number(c.creditos) || 0)),
        sala: sanitizeString(c.sala || '', 100) || '',
        profesor: sanitizeString(c.profesor || '', 100) || '',
        bloques: Array.isArray(c.bloques)
          ? c.bloques.slice(0, 15).map((b) => ({
              dia: sanitizeString(b?.dia || '', 20) || 'Lunes',
              bloqueId: sanitizeString(b?.bloqueId || '', 10) || 'b1',
              texto: sanitizeString(b?.texto || '', 40) || '',
              sala: sanitizeString(b?.sala || '', 60) || '',
              salaCorta: sanitizeString(b?.salaCorta || '', 30) || '',
            }))
          : [],
      }));

    const targetEmail = String(req.user?.email || '').trim().toLowerCase();
    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o correo institucional inválido.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const updatedUser = await UserProfile.findOneAndUpdate(
        { email: { $eq: targetEmail } },
        {
          $set: {
            enrolledCourses: sanitizedCourses,
            hasUsedSimulator: true,
            lastSimulatorUsage: new Date(),
          },
          $inc: { simulatorUsageCount: 1 },
        },
        { new: true, upsert: true, runValidators: true }
      );

      await authService.logActivity({
        userId: req.user._id || req.user.id,
        userEmail: req.user.email,
        userName: req.user.fullName || req.user.nombre || req.user.email,
        userRole: req.user.role || 'estudiante',
        action: 'saved_toma_ramos',
        details: `El estudiante guardó ${sanitizedCourses.length} asignaturas en el Simulador de Toma de Ramos.`,
      });

      return res.status(200).json({
        success: true,
        message: 'Carga académica grabada y respaldada en MongoDB correctamente.',
        enrolledCourses: updatedUser ? updatedUser.enrolledCourses : sanitizedCourses,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Carga académica grabada en sesión.',
      enrolledCourses: sanitizedCourses,
    });
  } catch (error) {
    console.error('[AuthController] Error guardando toma de ramos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar la carga académica en la base de datos.',
    });
  }
};

/**
 * GET /api/auth/ley21719
 * Información de cumplimiento con la Ley N° 21.719 de Protección de Datos Personales
 */
exports.getLey21719Info = async (req, res) => {
  return res.status(200).json({
    success: true,
    law: 'Ley N° 21.719 de Protección de Datos Personales de Chile',
    compliance: {
      zeroUnencryptedCredentials: true,
      encryptionAlgorithm: 'bcryptjs (salt 10)',
      explicitPurposeLimitation: [
        'gestion_academica',
        'apoyo_paedis_inclusion',
        'simulador_toma_ramos',
        'seguimiento_asistencia',
      ],
      consentMetadata: {
        version: '1.0 - Ley 21.719',
        consentGivenByDefault: true,
        dataRetention: 'Periodo académico activo conforme a Ley N° 21.719',
        rightsARCO: 'Acceso, Rectificación, Cancelación y Oposición garantizados',
      },
    },
  });
};
