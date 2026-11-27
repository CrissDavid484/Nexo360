/**
 * CONTROLADOR VIVO DUOC UC
 * Endpoint protegido: GET /api/vivo-duoc/dashboard
 * Deriva identidad desde req.user.email (JWT Nexo360) — prevención IDOR
 */

const adapters = require('../services/adapters');
const satAlertService = require('../services/satAlertService');
const predictiveRiskService = require('../services/predictiveRiskService');

async function getDashboard(req, res) {
  try {
    const nombreUsuario = req.user?.email?.split('@')[0];
    if (!nombreUsuario) {
      return res.status(400).json({
        success: false,
        code: 'USER_EMAIL_REQUIRED',
        message: 'No se pudo derivar el nombre de usuario desde la sesión autenticada',
      });
    }

    const vivoDuocAdapter = adapters.vivoDuocAdapter;
    if (vivoDuocAdapter.isLiveMode() && adapters.entraIdAdapter) {
      vivoDuocAdapter.setEntraIdAdapter(adapters.entraIdAdapter);
    }

    const dashboard = await vivoDuocAdapter.getFullDashboard(nombreUsuario);

    if (!dashboard.success) {
      const statusCode = dashboard.code === 'DUOC_TOKEN_EXPIRED' ? 401 : 502;
      return res.status(statusCode).json({
        success: false,
        code: dashboard.code || 'DUOC_UPSTREAM_ERROR',
        message: dashboard.message || 'Error consultando API Vivo Duoc',
        source: dashboard.source,
      });
    }

    const normalizedForSat = vivoDuocAdapter.normalizeForSatPredictive(dashboard);

    let satEvaluation = null;
    let predictiveRisk = null;

    if (normalizedForSat) {
      satEvaluation = satAlertService.evaluateStudentSat(normalizedForSat);
      predictiveRisk = predictiveRiskService.calculatePredictiveRisk(normalizedForSat);
    }

    return res.json({
      success: true,
      data: dashboard.data,
      satEvaluation,
      predictiveRisk,
      meta: {
        source: dashboard.source,
        generatedAt: dashboard.generatedAt,
        errors: dashboard.errors,
      },
    });
  } catch (err) {
    console.error('[VivoDuocController] Error:', err.message);

    if (err.message === 'DUOC_TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        code: 'DUOC_TOKEN_EXPIRED',
        message: 'El token de sesión de Vivo Duoc expiró.',
      });
    }

    if (err.message?.startsWith('DUOC_UPSTREAM_ERROR')) {
      return res.status(502).json({
        success: false,
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

module.exports = { getDashboard };