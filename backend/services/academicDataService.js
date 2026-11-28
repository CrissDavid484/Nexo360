/**
 * SERVICIO CENTRAL DE INFORMACIÓN ACADÉMICA (BLOQUE A)
 * Medidador de integración entre Vivo Duoc UC, identidad OIDC Entra ID,
 * motores analíticos SAT / Riesgo Predictivo y expedientes PAEDIS.
 *
 * Principios:
 * 1. Modos de operación estrictos: disabled (fail-closed) | mock | live
 * 2. Protección IDOR: deriva identidad desde contexto autenticado
 * 3. Ausencia de datos sintéticos o inventados en producción
 * 4. Respuestas estructuradas con soporte para estados parciales
 * 5. Salvaguarda SAT: "insufficient_data" ante ausencia de sesiones verificadas
 */

const vivoDuocAdapter = require('./adapters/vivoDuocAdapter');
const entraIdAdapter = require('./adapters/entraIdAdapter');
const satAlertService = require('./satAlertService');
const predictiveRiskService = require('./predictiveRiskService');

let PaedisRecord = null;
try {
  PaedisRecord = require('../models/PaedisRecord');
} catch {
  // Entornos donde el modelo no esté disponible o pruebas aisladas
}

class AcademicDataService {
  constructor(options = {}) {
    this.adapter = options.adapter || vivoDuocAdapter;
    this.entraId = options.entraId || entraIdAdapter;
    this.satService = options.satService || satAlertService;
    this.riskService = options.riskService || predictiveRiskService;
    this.paedisModel = options.paedisModel || PaedisRecord;
  }

  /**
   * Resuelve y valida el contexto de identidad del solicitante.
   * Aplica prevención estricta de IDOR: estudiantes solo pueden consultar sus propios datos.
   * @param {Object|string} identityContext Contexto del usuario autenticado
   * @returns {{ studentEmail: string, nombreUsuario: string, role: string }}
   */
  _resolveIdentity(identityContext) {
    if (!identityContext) {
      const err = new Error('Contexto de identidad requerido para consultar información académica');
      err.code = 'IDENTITY_REQUIRED';
      throw err;
    }

    if (typeof identityContext === 'string') {
      const err = new Error('Petición insegura: el contexto de identidad académica debe provenir de un usuario autenticado');
      err.code = 'AUTHENTICATION_REQUIRED';
      err.status = 401;
      throw err;
    }

    const user = identityContext.user || identityContext;
    const callerEmail = String(user.email || identityContext.email || '').trim().toLowerCase();
    const role = String(user.role || identityContext.role || 'student').trim().toLowerCase();
    const targetEmail = String(
      identityContext.targetEmail || identityContext.studentEmail || callerEmail
    ).trim().toLowerCase();

    if (!callerEmail) {
      const err = new Error('No se pudo derivar la identidad del usuario autenticado');
      err.code = 'USER_EMAIL_REQUIRED';
      throw err;
    }

    // Regla IDOR restrictiva por defecto (fail-closed):
    // Solo roles explícitamente autorizados pueden consultar un targetEmail distinto
    const ALLOWED_AUDIT_ROLES = new Set(['admin', 'administrador', 'coordinador_paedis', 'coordinador']);
    if (targetEmail && targetEmail !== callerEmail && !ALLOWED_AUDIT_ROLES.has(role)) {
      const err = new Error('Usuario no autorizado para consultar datos académicos de otro estudiante');
      err.code = 'FORBIDDEN_IDOR';
      err.status = 403;
      throw err;
    }

    const finalEmail = targetEmail || callerEmail;
    return {
      studentEmail: finalEmail,
      nombreUsuario: finalEmail.split('@')[0],
      role,
      userId: user.id || user._id || identityContext.userId || callerEmail,
    };
  }

  /**
   * Obtiene de forma segura el expediente PAEDIS legítimo si existe en MongoDB
   * @param {string} studentEmail Correo del estudiante
   * @returns {Promise<Object|null>}
   */
  async _getPaedisRecord(studentEmail) {
    if (!this.paedisModel || !studentEmail) return null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection?.readyState !== 1) {
        return null; // Base de datos no conectada; evitar timeout de 10s por buffer de Mongoose
      }
      if (typeof this.paedisModel.findOne === 'function') {
        return await this.paedisModel.findOne({
          $or: [{ studentEmail }, { userEmail: studentEmail }],
        }).lean();
      }
    } catch {
      // Si la BD no está disponible, continuar sin fallar
    }
    return null;
  }

  /**
   * Obtiene el dashboard integral académico con evaluación SAT y Riesgo Predictivo.
   * @param {Object|string} identityContext
   * @returns {Promise<Object>}
   */
  async getStudentAcademicDashboard(identityContext) {
    const { studentEmail, nombreUsuario, userId } = this._resolveIdentity(identityContext);

    // Conectar Entra ID al adaptador si está en modo live
    if (this.adapter.isLiveMode() && this.entraId) {
      this.adapter.setEntraIdAdapter(this.entraId);
    }

    let dashboard;
    try {
      dashboard = await this.adapter.getFullDashboard(nombreUsuario, userId);
    } catch (err) {
      if (err.message === 'DUOC_TOKEN_EXPIRED') {
        return {
          success: false,
          status: 'unauthorized',
          code: 'DUOC_TOKEN_EXPIRED',
          message: 'El token de sesión de Vivo Duoc expiró.',
          source: this.adapter.isLiveMode() ? 'vivo_duoc' : 'none',
        };
      }
      throw err;
    }

    if (!dashboard.success) {
      return {
        success: false,
        status: dashboard.status || 'unavailable',
        code: dashboard.code || 'ACADEMIC_DATA_UNAVAILABLE',
        message: dashboard.message || 'Información académica no disponible',
        source: dashboard.source || 'none',
        isSimulated: Boolean(dashboard.isSimulated),
        data: null,
        sections: dashboard.sections || {},
        sat: null,
        predictiveRisk: null,
        meta: {
          generatedAt: dashboard.generatedAt || new Date().toISOString(),
          errors: dashboard.errors || [],
        },
      };
    }

    // Calcular línea base analítica SAT y Riesgo Predictivo
    const analyticalBaseline = await this.getSatAcademicBaseline(identityContext, dashboard);

    return {
      success: true,
      status: dashboard.status, // 'complete' | 'partial'
      source: dashboard.source,
      isSimulated: dashboard.isSimulated,
      data: dashboard.data,
      sections: dashboard.sections,
      sat: analyticalBaseline.sat,
      predictiveRisk: analyticalBaseline.predictiveRisk,
      meta: {
        studentEmail,
        source: dashboard.source,
        cached: Boolean(dashboard.cached),
        generatedAt: dashboard.generatedAt,
        errors: dashboard.errors || [],
      },
    };
  }

  /**
   * Obtiene el perfil académico del estudiante
   * @param {Object|string} identityContext
   */
  async getStudentAcademicProfile(identityContext) {
    const { nombreUsuario } = this._resolveIdentity(identityContext);
    if (this.adapter.isDisabled()) {
      return { success: false, status: 'not_configured', data: null, message: 'Integración deshabilitada' };
    }
    const matricula = await this.adapter.getMatriculaVigente(nombreUsuario);
    if (!matricula.success || !matricula.data?.alumnoId) {
      return { success: false, status: 'unavailable', data: null, message: 'Matrícula no encontrada' };
    }
    const perfil = await this.adapter.getPerfilAcademico(String(matricula.data.alumnoId), nombreUsuario);
    return {
      success: perfil.success,
      status: perfil.success ? 'ok' : 'error',
      data: perfil.data,
      source: perfil.source,
    };
  }

  /**
   * Obtiene las asistencias oficiales del estudiante
   * @param {Object|string} identityContext
   */
  async getStudentAttendance(identityContext) {
    const { nombreUsuario } = this._resolveIdentity(identityContext);
    if (this.adapter.isDisabled()) {
      return { success: false, status: 'not_configured', data: null, message: 'Integración deshabilitada' };
    }
    const asistencias = await this.adapter.getAsistencias(nombreUsuario);
    return {
      success: asistencias.success,
      status: asistencias.success ? 'ok' : 'error',
      data: asistencias.data,
      source: asistencias.source,
    };
  }

  /**
   * Obtiene las notas y parciales del estudiante
   * @param {Object|string} identityContext
   */
  async getStudentGrades(identityContext) {
    const { nombreUsuario } = this._resolveIdentity(identityContext);
    if (this.adapter.isDisabled()) {
      return { success: false, status: 'not_configured', data: null, message: 'Integración deshabilitada' };
    }
    const matricula = await this.adapter.getMatriculaVigente(nombreUsuario);
    if (!matricula.success || !matricula.data?.codAlumno) {
      return { success: false, status: 'unavailable', data: null, message: 'Matrícula no encontrada' };
    }
    const notas = await this.adapter.getNotas(matricula.data.codAlumno, nombreUsuario);
    return {
      success: notas.success,
      status: notas.success ? 'ok' : 'error',
      data: notas.data,
      source: notas.source,
    };
  }

  /**
   * Obtiene el horario de clases vigente
   * @param {Object|string} identityContext
   */
  async getStudentSchedule(identityContext) {
    const { nombreUsuario } = this._resolveIdentity(identityContext);
    if (this.adapter.isDisabled()) {
      return { success: false, status: 'not_configured', data: null, message: 'Integración deshabilitada' };
    }
    const matricula = await this.adapter.getMatriculaVigente(nombreUsuario);
    if (!matricula.success || !matricula.data?.alumnoId) {
      return { success: false, status: 'unavailable', data: null, message: 'Matrícula no encontrada' };
    }
    const horario = await this.adapter.getHorario(String(matricula.data.alumnoId), nombreUsuario);
    return {
      success: horario.success,
      status: horario.success ? 'ok' : 'error',
      data: horario.data,
      source: horario.source,
    };
  }

  /**
   * Obtiene el progreso curricular y avance de créditos
   * @param {Object|string} identityContext
   */
  async getStudentAcademicProgress(identityContext) {
    return this.getStudentAcademicProfile(identityContext);
  }

  /**
   * Genera la línea base analítica SAT y Riesgo Predictivo protegida contra datos insuficientes.
   * Vincula el expediente PAEDIS legítimo si existe y nunca inventa falsas alarmas.
   * @param {Object|string} identityContext
   * @param {Object} [providedDashboard]
   * @returns {Promise<{ sat: Object, predictiveRisk: Object }>}
   */
  async getSatAcademicBaseline(identityContext, providedDashboard = null) {
    const { studentEmail, nombreUsuario, userId } = this._resolveIdentity(identityContext);

    let dashboard = providedDashboard;
    if (!dashboard) {
      dashboard = await this.adapter.getFullDashboard(nombreUsuario, userId);
    }

    if (!dashboard || !dashboard.success || !dashboard.data) {
      return {
        sat: {
          status: 'insufficient_data',
          riskLevel: 'NONE',
          riskLabel: 'Sin datos académicos disponibles',
          badgeColor: 'slate',
          criticalCoursesCount: 0,
          preventiveCoursesCount: 0,
          justifiedCoursesCount: 0,
          noDataCoursesCount: 0,
          coursesDetails: [],
          reason: 'No fue posible consultar datos académicos institucionales',
        },
        predictiveRisk: {
          status: 'insufficient_data',
          score: null,
          riskLevel: 'SIN_DATOS',
          predictionLabel: 'Sin datos suficientes',
          color: 'slate',
          trafficLight: 'gray',
          requiresHumanReview: true,
          factors: ['No fue posible consultar datos académicos institucionales'],
          nextBestAction: {
            action: 'Verificar integración con Vivo Duoc UC',
            priority: 10,
            slaHours: 72,
          },
        },
      };
    }

    const normalized = this.adapter.normalizeForSatPredictive(dashboard);

    // Integrar expediente PAEDIS legítimo de MongoDB si existe
    const realPaedisRecord = await this._getPaedisRecord(studentEmail);
    if (realPaedisRecord) {
      normalized.isPaedis = true;
      normalized.tutorPaedisAsignado = realPaedisRecord.tutorName || realPaedisRecord.tutorEmail || 'Asignado';
      normalized.ajustesAprobados = realPaedisRecord.ajustesRazonables || [];
    } else {
      normalized.isPaedis = false;
      normalized.tutorPaedisAsignado = 'No';
      normalized.ajustesAprobados = [];
    }

    // Salvaguarda: si no hay sesiones de asistencia verificadas
    if (!normalized.hasSufficientData || normalized.verifiedSessionsCount === 0) {
      return {
        sat: {
          status: 'insufficient_data',
          riskLevel: 'NONE',
          riskLabel: 'Sin Asignaturas con Asistencia Verificada',
          badgeColor: 'slate',
          criticalCoursesCount: 0,
          preventiveCoursesCount: 0,
          justifiedCoursesCount: 0,
          noDataCoursesCount: normalized.courseAttendance.length,
          coursesDetails: normalized.courseAttendance.map((c) => ({
            ...c,
            status: {
              severity: 'NO_DATA',
              message: 'Sin sesiones de asistencia verificadas en la plataforma oficial',
            },
          })),
          reason: 'No hay suficientes sesiones verificadas para calcular el indicador SAT',
        },
        predictiveRisk: {
          status: 'insufficient_data',
          score: null,
          riskLevel: 'SIN_DATOS',
          predictionLabel: 'Sin datos suficientes',
          color: 'slate',
          trafficLight: 'gray',
          isHeuristic: true,
          requiresHumanReview: true,
          factors: ['Sin registros de asistencia o sesiones verificadas suficientes para emitir seguimiento'],
          breakdown: null,
          nextBestAction: {
            action: 'Completar registro de asistencia o aguardar primer corte oficial del semestre',
            priority: 10,
            slaHours: 72,
            triggeredRule: 'sin_sesiones_verificadas',
          },
        },
      };
    }

    // Datos suficientes: evaluar normalmente con los motores analíticos
    const satEvaluation = this.satService.evaluateStudentSat(normalized);
    const predictiveEvaluation = this.riskService.calculatePredictiveRisk(normalized);

    return {
      sat: {
        status: 'calculated',
        ...satEvaluation,
      },
      predictiveRisk: {
        status: 'calculated',
        ...predictiveEvaluation,
      },
    };
  }
}

const instance = new AcademicDataService();
instance.AcademicDataService = AcademicDataService;

module.exports = instance;
