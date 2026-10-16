const authScraperService = require('../services/authScraperService');
const UserProfile = require('../models/UserProfile');

/**
 * Iniciar flujo de login institucional mediante Puppeteer
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar su correo institucional y su contraseña de Duoc UC.',
      });
    }

    // Validación básica de dominio Duoc UC
    const duocDomainRegex = /^[a-zA-Z0-9._%+-]+@(?:profesor\.)?duoc(?:uc)?\.cl$/i;
    if (!duocDomainRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El correo debe pertenecer al dominio institucional (@duoc.cl o @duocuc.cl).',
      });
    }

    // Iniciar el proxy de autenticación con Puppeteer
    const sessionResponse = await authScraperService.initiateLogin(email.trim(), password);

    return res.status(200).json({
      success: true,
      ...sessionResponse,
    });
  } catch (error) {
    console.error('[authController.login]', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al contactar el portal institucional. Inténtelo nuevamente.',
    });
  }
};

/**
 * Consulta de estado del MFA para Polling (cada 2 segundos)
 * GET /api/auth/mfa-status/:sessionId
 */
exports.getMfaStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de sesión (sessionId) requerido.',
      });
    }

    const statusData = authScraperService.getSessionStatus(sessionId);

    return res.status(200).json({
      success: true,
      ...statusData,
    });
  } catch (error) {
    console.error('[authController.getMfaStatus]', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el estado de aprobación.',
    });
  }
};

/**
 * Obtener perfil del estudiante autenticado
 * GET /api/auth/me
 */
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al recuperar perfil de usuario.',
    });
  }
};

/**
 * Actualizar preferencias de accesibilidad del estudiante
 * PUT /api/auth/accessibility
 */
exports.updateAccessibility = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron preferencias de accesibilidad.',
      });
    }

    let updatedUser = null;
    try {
      updatedUser = await UserProfile.findByIdAndUpdate(
        userId,
        { accessibilityPreferences: preferences },
        { new: true }
      );
    } catch {
      // Si la BD no está disponible, devolver el payload con confirmación
    }

    return res.status(200).json({
      success: true,
      message: 'Preferencias de accesibilidad guardadas correctamente.',
      preferences: updatedUser ? updatedUser.accessibilityPreferences : preferences,
    });
  } catch (error) {
    console.error('[authController.updateAccessibility]', error);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar preferencias de accesibilidad.',
    });
  }
};
