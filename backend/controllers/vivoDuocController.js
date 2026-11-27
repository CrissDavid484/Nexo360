/**
 * CONTROLADOR VIVO DUOC UC
 * Endpoints protegidos:
 * - GET /api/vivo-duoc/dashboard
 * - GET /api/vivo-duoc/profile
 * - GET /api/vivo-duoc/attendance
 * - GET /api/vivo-duoc/grades
 * - GET /api/vivo-duoc/schedule
 *
 * Deriva identidad desde req.user (JWT Nexo360) — prevención IDOR.
 */

const academicDataService = require('../services/academicDataService');

function buildIdentityContext(req) {
  return {
    user: req.user,
    email: req.user?.email,
    role: req.user?.role || 'student',
    targetEmail: req.query?.targetEmail || req.user?.email,
  };
}

async function getDashboard(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(400).json({
        success: false,
        code: 'USER_EMAIL_REQUIRED',
        message: 'No se pudo derivar el correo institucional desde la sesión autenticada',
      });
    }

    const identityContext = buildIdentityContext(req);
    const result = await academicDataService.getStudentAcademicDashboard(identityContext);

    if (!result.success) {
      if (result.status === 'not_configured') {
        return res.status(503).json({
          success: false,
          status: 'not_configured',
          code: 'ACADEMIC_INTEGRATION_DISABLED',
          message: result.message || 'Integración académica Duoc UC deshabilitada en esta sede o entorno',
          source: 'none',
        });
      }

      if (result.code === 'DUOC_TOKEN_EXPIRED' || result.status === 'unauthorized') {
        return res.status(401).json({
          success: false,
          status: 'unauthorized',
          code: 'DUOC_TOKEN_EXPIRED',
          message: 'El token de sesión de Vivo Duoc expiró.',
          source: result.source,
        });
      }

      if (result.code === 'FORBIDDEN_IDOR') {
        return res.status(403).json({
          success: false,
          status: 'forbidden',
          code: 'FORBIDDEN_IDOR',
          message: result.message,
        });
      }

      const statusCode = result.code === 'DUOC_UPSTREAM_ERROR' ? 502 : 500;
      return res.status(statusCode).json({
        success: false,
        status: result.status || 'unavailable',
        code: result.code || 'DUOC_UPSTREAM_ERROR',
        message: result.message || 'Error consultando API Vivo Duoc',
        source: result.source,
      });
    }

    return res.status(200).json({
      success: true,
      status: result.status, // 'complete' | 'partial'
      source: result.source,
      isSimulated: result.isSimulated,
      data: result.data,
      sections: result.sections,
      sat: result.sat,
      predictiveRisk: result.predictiveRisk,
      meta: result.meta,
    });
  } catch (err) {
    console.error('[VivoDuocController] Error:', err.message);

    if (err.code === 'FORBIDDEN_IDOR') {
      return res.status(403).json({
        success: false,
        status: 'forbidden',
        code: 'FORBIDDEN_IDOR',
        message: err.message,
      });
    }

    if (err.message === 'DUOC_TOKEN_EXPIRED' || err.code === 'DUOC_TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        status: 'unauthorized',
        code: 'DUOC_TOKEN_EXPIRED',
        message: 'El token de sesión de Vivo Duoc expiró.',
      });
    }

    if (err.message?.startsWith('DUOC_UPSTREAM_ERROR') || err.code === 'DUOC_UPSTREAM_ERROR') {
      return res.status(502).json({
        success: false,
        status: 'unavailable',
        code: 'DUOC_UPSTREAM_ERROR',
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Error interno procesando dashboard Vivo Duoc',
    });
  }
}

async function getProfile(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(400).json({ success: false, code: 'USER_EMAIL_REQUIRED' });
    }
    const result = await academicDataService.getStudentAcademicProfile(buildIdentityContext(req));
    const status = result.status === 'not_configured' ? 503 : result.success ? 200 : 502;
    return res.status(status).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getAttendance(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(400).json({ success: false, code: 'USER_EMAIL_REQUIRED' });
    }
    const result = await academicDataService.getStudentAttendance(buildIdentityContext(req));
    const status = result.status === 'not_configured' ? 503 : result.success ? 200 : 502;
    return res.status(status).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getGrades(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(400).json({ success: false, code: 'USER_EMAIL_REQUIRED' });
    }
    const result = await academicDataService.getStudentGrades(buildIdentityContext(req));
    const status = result.status === 'not_configured' ? 503 : result.success ? 200 : 502;
    return res.status(status).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getSchedule(req, res) {
  try {
    if (!req.user?.email) {
      return res.status(400).json({ success: false, code: 'USER_EMAIL_REQUIRED' });
    }
    const result = await academicDataService.getStudentSchedule(buildIdentityContext(req));
    const status = result.status === 'not_configured' ? 503 : result.success ? 200 : 502;
    return res.status(status).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboard,
  getProfile,
  getAttendance,
  getGrades,
  getSchedule,
};
