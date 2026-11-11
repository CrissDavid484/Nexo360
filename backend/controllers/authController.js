const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const authScraperService = require('../services/authScraperService');

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
  const user = await authScraperService.findOrCreateUserProfile(reqUser.email);
  return authScraperService.formatUserResponse(user);
};

/**
 * GET /api/auth/users
 * Obtiene el catálogo de los 10 usuarios institucionales de la Base de Datos Nexo360 (y cualquier correo nuevo registrado)
 */
exports.getInstitutionalUsers = async (req, res) => {
  try {
    const users = await authScraperService.getAllUsers();
    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      officialLoginUrl: authScraperService.getOfficialLoginUrl(),
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
 * Inicia sesión en Nexo360 tras pasar por el botón de redirección al Login Oficial Microsoft de Duoc UC.
 * - Si el correo pertenece a uno de los 10 usuarios de nuestra BD, carga su nombre completo, rol y ficha.
 * - Si es cualquier otro correo institucional, captura el correo y lo asigna como su nombre.
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

    const ssoResult = await authScraperService.completeSsoLogin(cleanEmail);

    return res.status(200).json({
      success: true,
      status: 'COMPLETED',
      token: ssoResult.token,
      user: ssoResult.user,
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
 * Inicio de sesión nativo contra la Base de Datos Nexo360 (con hash bcrypt)
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

    const result = await authScraperService.loginWithPassword(cleanEmail, password);

    return res.status(200).json({
      success: true,
      status: 'COMPLETED',
      token: result.token,
      user: result.user,
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
 * POST /api/auth/simulator-log
 * Registra que un estudiante interactuó con el Simulador de Toma de Ramos
 */
exports.recordSimulatorUsage = async (req, res) => {
  try {
    await authScraperService.recordSimulatorUsage(req.user);
    return res.status(200).json({
      success: true,
      message: 'Uso del simulador registrado en la base de datos.',
    });
  } catch (error) {
    return res.status(200).json({ success: true });
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

    const session = authScraperService.getSessionStatus(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        status: 'FAILED',
        errorMessage: 'La sesión de autenticación no existe o ha expirado.',
      });
    }

    if (session.status === 'COMPLETED') {
      authScraperService.clearSession(sessionId);
      return res.status(200).json({
        success: true,
        status: 'COMPLETED',
        token: session.token,
        user: session.user,
        mfaCode: session.mfaCode,
        message: 'Autenticación completada exitosamente.',
      });
    }

    return res.status(200).json({
      success: true,
      status: session.status,
      mfaCode: session.mfaCode,
      mfaNumber: session.mfaCode,
      errorMessage: session.errorMessage,
    });
  } catch (error) {
    console.error('[AuthController] Error consultando estado MFA:', error.message);
    return res.status(500).json({
      success: false,
      status: 'FAILED',
      errorMessage: 'Error al verificar el estado de autenticación.',
    });
  }
};

/**
 * GET /api/auth/me
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
      user: authScraperService.formatUserResponse(req.user || {}),
    });
  }
};

/**
 * PUT /api/auth/accessibility
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
      screenReaderOptimized:
        typeof rawPrefs.screenReaderOptimized === 'boolean' ? rawPrefs.screenReaderOptimized : true,
    };

    const targetEmail = req.user.email;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Preferencias de accesibilidad aplicadas en sesión (modo sin conexión a BD).',
        accessibilityPreferences: sanitizedPreferences,
      });
    }

    const updatedUser = await UserProfile.findOneAndUpdate(
      { email: targetEmail },
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
 */
exports.updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const phone = sanitizeString(body.phone ?? body.telefonoPersonal, 30);
    const address = sanitizeString(body.address ?? body.direccion, 200);
    const personalEmail = sanitizeString(body.personalEmail ?? body.emailPersonal, 120);
    const emergencyContact = sanitizeString(body.emergencyContact, 120);
    const emergencyPhone = sanitizeString(body.emergencyPhone, 30);

    const updateFields = {
      ...(phone !== undefined ? { phone } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(personalEmail !== undefined ? { personalEmail: personalEmail.toLowerCase() } : {}),
      ...(emergencyContact !== undefined ? { emergencyContact } : {}),
      ...(emergencyPhone !== undefined ? { emergencyPhone } : {}),
    };

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos de contacto válidos para actualizar.',
      });
    }

    const targetEmail = req.user.email;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Datos de contacto actualizados en sesión.',
        user: authScraperService.formatUserResponse({ ...req.user, ...updateFields }),
      });
    }

    const updatedUser = await UserProfile.findOneAndUpdate(
      { email: targetEmail },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Datos de contacto actualizados en MongoDB.',
      user: authScraperService.formatUserResponse(updatedUser),
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
 * GET /api/auth/toma-ramos
 */
exports.getTomaRamos = async (req, res) => {
  try {
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
 */
exports.saveTomaRamos = async (req, res) => {
  try {
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

    const targetEmail = req.user.email;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Carga académica grabada en sesión.',
        enrolledCourses: sanitizedCourses,
      });
    }

    const updatedUser = await UserProfile.findOneAndUpdate(
      { email: targetEmail },
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

    // Registrar en ActivityLog
    await authScraperService.logActivity({
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
  } catch (error) {
    console.error('[AuthController] Error guardando toma de ramos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar la carga académica en la base de datos.',
    });
  }
};
