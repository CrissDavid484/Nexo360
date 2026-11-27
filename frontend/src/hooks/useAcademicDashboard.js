/**
 * HOOK: useAcademicDashboard
 * Consume el endpoint GET /api/vivo-duoc/dashboard a través de api.getVivoDuocDashboard().
 *
 * Estados soportados:
 * - loading: Boolean (petición en curso)
 * - status: 'complete' | 'partial' | 'unavailable' | 'not_configured' | 'unauthorized' | 'mock_demo'
 * - source: 'vivo_duoc' | 'mock_demo' | 'none'
 * - isSimulated: Boolean
 * - data: { matricula, infoPersona, perfilAcademico, notas, asistencias, horario }
 * - sections: { matricula, infoPersona, perfilAcademico, notas, asistencias, horario }
 * - sat: Object | null
 * - predictiveRisk: Object | null
 * - meta: { studentEmail, source, cached, generatedAt, errors }
 * - error: String | null
 * - reload: Function
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

export const ACADEMIC_STATUS = {
  LOADING: 'loading',
  COMPLETE: 'complete',
  PARTIAL: 'partial',
  UNAVAILABLE: 'unavailable',
  NOT_CONFIGURED: 'not_configured',
  UNAUTHORIZED: 'unauthorized',
  MOCK_DEMO: 'mock_demo',
  FORBIDDEN: 'forbidden',
};

/**
 * Función pura de normalización de la respuesta de la API de Vivo Duoc.
 * Totalmente testeable en Node.js sin mocks de React.
 * @param {Object} response Respuesta devuelta por api.getVivoDuocDashboard() o el backend
 * @returns {Object} Estado normalizado del dashboard
 */
export function normalizeAcademicDashboardResponse(response) {
  if (!response || typeof response !== 'object') {
    return {
      success: false,
      status: ACADEMIC_STATUS.UNAVAILABLE,
      source: 'none',
      isSimulated: false,
      data: null,
      sections: {},
      sat: null,
      predictiveRisk: null,
      meta: {
        studentEmail: null,
        source: 'none',
        cached: false,
        generatedAt: new Date().toISOString(),
        errors: [{ message: 'Respuesta vacía o inválida del servidor' }],
      },
      error: 'No se recibió respuesta válida del servidor.',
    };
  }

  // 1. Detección de token expirado o no autorizado (401 / unauthorized)
  if (
    response.status === 401 ||
    response.status === 'unauthorized' ||
    response.code === 'DUOC_TOKEN_EXPIRED'
  ) {
    return {
      success: false,
      status: ACADEMIC_STATUS.UNAUTHORIZED,
      source: response.source || 'vivo_duoc',
      isSimulated: Boolean(response.isSimulated),
      data: null,
      sections: response.sections || {},
      sat: null,
      predictiveRisk: null,
      meta: response.meta || {
        source: response.source || 'vivo_duoc',
        generatedAt: new Date().toISOString(),
        errors: [{ code: 'DUOC_TOKEN_EXPIRED', message: response.message }],
      },
      error: response.message || 'Tu sesión de Vivo Duoc ha expirado.',
    };
  }

  // 2. Detección de integración deshabilitada o no configurada (503 / not_configured)
  if (
    response.status === 503 ||
    response.status === 'not_configured' ||
    response.code === 'ACADEMIC_INTEGRATION_DISABLED'
  ) {
    return {
      success: false,
      status: ACADEMIC_STATUS.NOT_CONFIGURED,
      source: response.source || 'none',
      isSimulated: Boolean(response.isSimulated),
      data: null,
      sections: response.sections || {},
      sat: null,
      predictiveRisk: null,
      meta: response.meta || {
        source: 'none',
        generatedAt: new Date().toISOString(),
        errors: [{ code: 'ACADEMIC_INTEGRATION_DISABLED', message: response.message }],
      },
      error: response.message || 'Integración académica deshabilitada en esta sede o entorno.',
    };
  }

  // 3. Detección de violación IDOR / Prohibido (403 / forbidden)
  if (
    response.status === 403 ||
    response.status === 'forbidden' ||
    response.code === 'FORBIDDEN_IDOR'
  ) {
    return {
      success: false,
      status: ACADEMIC_STATUS.FORBIDDEN,
      source: response.source || 'none',
      isSimulated: false,
      data: null,
      sections: response.sections || {},
      sat: null,
      predictiveRisk: null,
      meta: response.meta || {
        generatedAt: new Date().toISOString(),
        errors: [{ code: 'FORBIDDEN_IDOR', message: response.message }],
      },
      error: response.message || 'No estás autorizado para consultar datos de otro usuario.',
    };
  }

  // 4. Detección de errores de upstream o servidor caído (502 / 500 / unavailable)
  if (
    response.success === false ||
    response.status === 502 ||
    response.status === 500 ||
    response.status === 'unavailable'
  ) {
    return {
      success: false,
      status: ACADEMIC_STATUS.UNAVAILABLE,
      source: response.source || 'none',
      isSimulated: Boolean(response.isSimulated),
      data: null,
      sections: response.sections || {},
      sat: null,
      predictiveRisk: null,
      meta: response.meta || {
        generatedAt: new Date().toISOString(),
        errors: response.errors || [{ message: response.message || 'Servicio no disponible' }],
      },
      error: response.message || 'Error temporal consultando información académica.',
    };
  }

  // 5. Respuestas exitosas: 'complete' o 'partial'
  const isMock = response.source === 'mock_demo' || Boolean(response.isSimulated);
  let status = response.status === 'partial' ? ACADEMIC_STATUS.PARTIAL : ACADEMIC_STATUS.COMPLETE;

  // Si es mock/demo explícito pero status es complete
  const effectiveSource = isMock ? 'mock_demo' : response.source || 'vivo_duoc';

  // Normalización segura de colecciones de datos
  const rawData = response.data || {};
  const normalizedData = {
    matricula: rawData.matricula || null,
    infoPersona: rawData.infoPersona || null,
    perfilAcademico: rawData.perfilAcademico || null,
    notas: Array.isArray(rawData.notas) ? rawData.notas : [],
    asistencias: Array.isArray(rawData.asistencias) ? rawData.asistencias : [],
    horario: Array.isArray(rawData.horario) ? rawData.horario : [],
  };

  return {
    success: true,
    status,
    source: effectiveSource,
    isSimulated: isMock,
    data: normalizedData,
    sections: response.sections || {},
    sat: response.sat || null,
    predictiveRisk: response.predictiveRisk || null,
    meta: {
      studentEmail: response.meta?.studentEmail || null,
      source: effectiveSource,
      cached: Boolean(response.meta?.cached),
      generatedAt: response.meta?.generatedAt || new Date().toISOString(),
      errors: Array.isArray(response.meta?.errors) ? response.meta.errors : [],
    },
    error: null,
  };
}

/**
 * Hook para componentes React
 */
export function useAcademicDashboard(options = {}) {
  const { autoFetch = true, initialData = null } = options;

  const [loading, setLoading] = useState(autoFetch && !initialData);
  const [dashboard, setDashboard] = useState(() =>
    initialData ? normalizeAcademicDashboardResponse(initialData) : null
  );
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVivoDuocDashboard();
      const normalized = normalizeAcademicDashboardResponse(res);
      setDashboard(normalized);
      if (!normalized.success) {
        setError(normalized.error);
      }
    } catch (err) {
      const errorMsg = err?.message || 'Error de conexión con Nexo360';
      const fallback = normalizeAcademicDashboardResponse({
        success: false,
        status: ACADEMIC_STATUS.UNAVAILABLE,
        message: errorMsg,
      });
      setDashboard(fallback);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch && !initialData) {
      fetchDashboard();
    }
  }, [autoFetch, initialData, fetchDashboard]);

  return {
    loading,
    status: loading ? ACADEMIC_STATUS.LOADING : dashboard?.status || ACADEMIC_STATUS.UNAVAILABLE,
    source: dashboard?.source || 'none',
    isSimulated: Boolean(dashboard?.isSimulated),
    data: dashboard?.data || null,
    sections: dashboard?.sections || {},
    sat: dashboard?.sat || null,
    predictiveRisk: dashboard?.predictiveRisk || null,
    meta: dashboard?.meta || null,
    error: error || dashboard?.error || null,
    reload: fetchDashboard,
  };
}
