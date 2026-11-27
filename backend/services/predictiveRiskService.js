/**
 * Servicio del Modelo Predictivo de Seguimiento Temprano Duoc UC (Nexo360) v2.1
 * Esquema unificado de asistencia compatible con satAlertService.js
 * Configuración externa en backend/config/predictiveWeights.json
 * Next Best Action engine incluido
 *
 * Nota ética y metodológica: emite un indicador heurístico descriptivo de seguimiento temprano
 * (nunca una probabilidad estadística de titulación ni una decisión académica automática).
 */

const fs = require('fs');
const path = require('path');

const HEURISTIC_INDICATOR_TYPE = 'HEURISTIC_EARLY_FOLLOWUP';
const HEURISTIC_DISCLAIMER =
  'Indicador heurístico descriptivo de seguimiento temprano basado en reglas de asistencia y carga académica. No constituye una probabilidad estadística de titulación ni una decisión académica automática; requiere revisión humana.';

let _cachedWeights = null;
let _lastWeightsRead = 0;

function loadWeightsConfig() {
  const now = Date.now();
  if (_cachedWeights && now - _lastWeightsRead < 10000) {
    return _cachedWeights;
  }
  const configPath = path.join(__dirname, '..', 'config', 'predictiveWeights.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    _cachedWeights = JSON.parse(raw);
    _lastWeightsRead = now;
    return _cachedWeights;
  } catch (err) {
    if (_cachedWeights) return _cachedWeights;
    console.warn('[predictiveRiskService] No se pudo leer predictiveWeights.json, usando defaults:', err.message);
    return {
      weights: { attendance: 0.45, paedis: 0.20, simulator: 0.15, trend: 0.10, load: 0.10 },
      thresholds: {
        riskLevels: {
          alto: { minScore: 60, trafficLight: 'red' },
          medio: { minScore: 35, maxScore: 59, trafficLight: 'yellow' },
          bajo: { maxScore: 34, trafficLight: 'green' },
        },
        attendance: { ri: 70, alert: 75, regular: 80 },
      },
      nextBestAction: { rules: [] },
    };
  }
}

function resolveAttendancePercentage(course) {
  if (!course || typeof course !== 'object') return null;
  if (course.attendancePercentage !== undefined && course.attendancePercentage !== null) {
    return Math.round(Number(course.attendancePercentage) * 10) / 10;
  }
  if (course.attendanceRate !== undefined && course.attendanceRate !== null) {
    return Math.round(Number(course.attendanceRate) * 10) / 10;
  }
  if (course.porcentajeAsistencia !== undefined && course.porcentajeAsistencia !== null) {
    return Math.round(Number(course.porcentajeAsistencia) * 10) / 10;
  }
  if (course.asistenciaPorcentaje !== undefined && course.asistenciaPorcentaje !== null) {
    return Math.round(Number(course.asistenciaPorcentaje) * 10) / 10;
  }
  const total = course.completedSessions ?? course.totalSessions;
  if (Number(total) > 0 && course.attendedSessions !== undefined && course.attendedSessions !== null) {
    return Math.round((Number(course.attendedSessions) / Number(total)) * 1000) / 10;
  }
  if (Number(total) === 0) return null;
  return 100;
}

function hasExplicitAttendance(course) {
  if (!course || typeof course !== 'object') return false;
  const total = course.completedSessions ?? course.totalSessions;
  if (Number(total) === 0 && course.attendancePercentage === null) return false;
  if (Number(total) === 0 && course.attendancePercentage === undefined && course.attendanceRate === undefined) {
    return false;
  }
  return (
    course.attendancePercentage !== undefined ||
    course.attendanceRate !== undefined ||
    course.porcentajeAsistencia !== undefined ||
    course.asistenciaPorcentaje !== undefined ||
    (Number(total) > 0 && course.attendedSessions !== undefined)
  );
}

/**
 * Normaliza un array de cursos al esquema unificado
 */
function normalizeCourses(courses) {
  if (!Array.isArray(courses)) return [];
  return courses.map((c) => {
    const pct = resolveAttendancePercentage(c);
    const total = c.completedSessions ?? c.totalSessions ?? c.clasesRegistradas ?? 0;
    const attended = c.attendedSessions ?? c.asistencias ?? 0;
    return {
      courseCode: c.courseCode || c.sigla || '',
      courseName: c.courseName || c.nombre || 'Asignatura',
      attendancePercentage: pct,
      totalSessions: Number(total),
      attendedSessions: Number(attended),
      consecutiveAbsences: Number(c.consecutiveAbsences || 0),
      missedKeySession: Boolean(c.missedKeySession),
      paedisJustified: Boolean(c.paedisJustified),
      minAttendanceRequired:
        c.minAttendanceRequired !== undefined && c.minAttendanceRequired !== null
          ? Number(c.minAttendanceRequired)
          : 70,
      profesor: c.profesor || '',
      seccion: c.seccion || '',
      sala: c.sala || '',
      creditos: Number(c.creditos || c.credits || 10),
      sigla: c.sigla || '',
      nombre: c.nombre || c.courseName || 'Asignatura',
      clasesRegistradas: c.clasesRegistradas || c.totalSessions || 0,
      asistencias: c.asistencias || c.attendedSessions || 0,
    };
  });
}

/**
 * Extrae detalle y promedio de asistencia desde las asignaturas inscritas.
 */
function extractCourseAttendanceDetails(enrolledCourses, fallbackRate) {
  const courses = normalizeCourses(enrolledCourses);
  let effectiveAttendance =
    fallbackRate !== undefined && fallbackRate !== null && Number.isFinite(Number(fallbackRate))
      ? Number(fallbackRate)
      : null;
  const courseDetails = [];
  const coursesInRI = [];
  const coursesInAlert = [];

  if (courses.length === 0) {
    return { effectiveAttendance, courseDetails, coursesInRI, coursesInAlert };
  }

  const coursesWithAttendance = courses.filter(
    (c) => hasExplicitAttendance(c) && c.attendancePercentage !== null
  );
  if (coursesWithAttendance.length > 0) {
    const sum = coursesWithAttendance.reduce((acc, c) => acc + c.attendancePercentage, 0);
    effectiveAttendance = Math.round((sum / coursesWithAttendance.length) * 10) / 10;
  }

  for (const c of courses) {
    const rate = c.attendancePercentage;
    const minReq = Number.isFinite(c.minAttendanceRequired) ? c.minAttendanceRequired : 70;
    const isRI = rate !== null && rate < minReq;
    const isAlert = rate !== null && rate >= minReq && rate <= Math.min(99.9, minReq + 4.9);
    const courseLabel = c.courseName || c.courseCode || 'Asignatura';

    courseDetails.push({
      courseCode: c.courseCode,
      courseName: c.courseName,
      attendancePercentage: rate,
      totalSessions: c.totalSessions,
      attendedSessions: c.attendedSessions,
      consecutiveAbsences: c.consecutiveAbsences,
      missedKeySession: c.missedKeySession,
      paedisJustified: c.paedisJustified,
      minAttendanceRequired: minReq,
      profesor: c.profesor,
      seccion: c.seccion,
      sala: c.sala,
      isRI,
      isAlert,
    });

    if (isRI) coursesInRI.push(courseLabel);
    else if (isAlert) coursesInAlert.push(courseLabel);
  }

  return { effectiveAttendance, courseDetails, coursesInRI, coursesInAlert };
}

function calculateTrend(student) {
  const history = student.courseAttendanceHistory;
  if (!Array.isArray(history) || history.length < 2) return { trend: 0, direction: 'stable' };

  const recent = history.slice(-4);
  const previous = history.slice(-8, -4);
  if (recent.length === 0 || previous.length === 0) return { trend: 0, direction: 'stable' };

  const avgRecent =
    recent.reduce((s, snap) => {
      const courses = normalizeCourses(snap.courses || []);
      const withPct = courses.filter((c) => hasExplicitAttendance(c) && c.attendancePercentage !== null);
      return (
        s +
        (withPct.length
          ? withPct.reduce((a, c) => a + c.attendancePercentage, 0) / withPct.length
          : 100)
      );
    }, 0) / recent.length;

  const avgPrevious =
    previous.reduce((s, snap) => {
      const courses = normalizeCourses(snap.courses || []);
      const withPct = courses.filter((c) => hasExplicitAttendance(c) && c.attendancePercentage !== null);
      return (
        s +
        (withPct.length
          ? withPct.reduce((a, c) => a + c.attendancePercentage, 0) / withPct.length
          : 100)
      );
    }, 0) / previous.length;

  const diff = Math.round((avgRecent - avgPrevious) * 10) / 10;
  return {
    trend: diff,
    direction: diff > 1 ? 'improving' : diff < -1 ? 'declining' : 'stable',
    avgRecent: Math.round(avgRecent * 10) / 10,
    avgPrevious: Math.round(avgPrevious * 10) / 10,
  };
}

function calculateAcademicLoad(student) {
  const courses = normalizeCourses(student.enrolledCourses || student.courseAttendance || []);
  let totalCredits = 0;
  let weightedDifficulty = 0;
  const practiceRegex = /pr[áa]ctica|laboratorio|taller/i;

  for (const c of courses) {
    const credits = Number(c.creditos || c.credits || 10);
    totalCredits += credits;
    const isPractice = practiceRegex.test(c.courseName || '');
    weightedDifficulty += credits * (isPractice ? 1.3 : 1.0);
  }

  return {
    totalCredits,
    weightedCredits: Math.round(weightedDifficulty),
    courseCount: courses.length,
    hasPractices: courses.some((c) => practiceRegex.test(c.courseName || '')),
  };
}

function buildTerminalStatusPrediction(status, attendanceSummary) {
  if (status === 'desercion') {
    return {
      score: 100,
      riskLevel: 'DESERTOR',
      predictionLabel: 'Deserción Registrada',
      color: 'red',
      trafficLight: 'red',
      isHeuristic: true,
      indicatorType: HEURISTIC_INDICATOR_TYPE,
      requiresHumanReview: true,
      disclaimer: HEURISTIC_DISCLAIMER,
      factors: ['Estudiante actualmente en deserción / retiro académico'],
      breakdown: { attendance: 100, paedis: 0, simulator: 0, trend: 0, load: 0 },
      ...attendanceSummary,
    };
  }

  if (status === 'titulado') {
    return {
      score: 0,
      riskLevel: 'TITULADO',
      predictionLabel: 'Titulado / Egresado',
      color: 'emerald',
      trafficLight: 'green',
      isHeuristic: true,
      indicatorType: HEURISTIC_INDICATOR_TYPE,
      requiresHumanReview: true,
      disclaimer: HEURISTIC_DISCLAIMER,
      factors: ['Plan de estudios completado con éxito'],
      breakdown: { attendance: 0, paedis: 0, simulator: 0, trend: 0, load: 0 },
      ...attendanceSummary,
    };
  }

  return null;
}

function computeAttendanceScore(effectiveAttendance, coursesInRI, coursesInAlert, config) {
  const factors = [];
  const thresholds = config.thresholds.attendance;

  if (effectiveAttendance < thresholds.ri || coursesInRI.length > 0) {
    const score = Math.max(
      70,
      Math.round(75 + (thresholds.ri - Math.min(effectiveAttendance, thresholds.ri - 1)) * 0.8)
    );
    const riMessage =
      coursesInRI.length > 0
        ? `Reprobación por Inasistencia (RI < ${thresholds.ri}%) en: ${coursesInRI.join(', ')}`
        : `Asistencia crítica (${effectiveAttendance}% < ${thresholds.ri}%): En causal de Reprobación por Inasistencia (RI)`;
    factors.push(riMessage);
    return { score, factors };
  }

  if (effectiveAttendance <= thresholds.alert || coursesInAlert.length > 0) {
    const score = Math.round(40 + (thresholds.alert - effectiveAttendance) * 3);
    factors.push(
      `Asistencia al límite (${effectiveAttendance}%): Riesgo moderado en zona preventiva (${thresholds.ri}% - ${thresholds.alert}%)`
    );
    if (coursesInAlert.length > 0) {
      factors.push(
        `Asignaturas en observación (${thresholds.ri}%-${thresholds.alert}%): ${coursesInAlert.join(', ')}`
      );
    }
    return { score, factors };
  }

  const score = Math.max(5, Math.round(25 - (effectiveAttendance - thresholds.regular) * 0.6));
  factors.push(`Asistencia favorable (${effectiveAttendance}% > ${thresholds.regular}%): Cumple normativa académica Duoc UC`);
  return { score, factors };
}

/**
 * Calcula sub-score PAEDIS (0-100).
 * Principio de Equidad y Ley N° 21.719: ni la condición PAEDIS ni la ausencia de tutor
 * incrementan el puntaje de riesgo.
 */
function computePaedisScore(student) {
  const factors = [];
  let score = 50;

  if (student.isPaedis) {
    const hasTutor =
      student.tutorPaedisAsignado &&
      !String(student.tutorPaedisAsignado).toLowerCase().includes('sin tutor') &&
      String(student.tutorPaedisAsignado).toLowerCase() !== 'no';
    const ajustesCount = Array.isArray(student.ajustesAprobados) ? student.ajustesAprobados.length : 0;

    if (!hasTutor) {
      factors.push(
        'Estudiante PAEDIS sin Tutor PAEDIS asignado: Requiere asignación prioritaria de acompañamiento (sin penalización de riesgo)'
      );
    } else if (ajustesCount > 0) {
      score -= 15;
      factors.push(`Acompañamiento PAEDIS activo con ${ajustesCount} ajuste(s) razonable(s)`);
    } else {
      score -= 5;
      factors.push('Estudiante PAEDIS con Tutor asignado, sin ajustes formales aún');
    }
  } else {
    factors.push('Estudiante regular (no PAEDIS)');
  }

  return { score: Math.max(0, Math.min(50, score)), factors };
}

/**
 * Calcula sub-score Simulador (0-100).
 * El no uso del simulador Nexo360 no penaliza ni aumenta el puntaje de riesgo.
 */
function computeSimulatorScore(student) {
  const factors = [];
  let score = 50;

  if (student.hasUsedSimulator) {
    score -= 20;
    factors.push('Uso activo del Simulador de Toma de Ramos: Planificación horaria confirmada');
    if (student.simulatorQualityScore !== undefined) {
      const bonus = Math.round(student.simulatorQualityScore * 0.1);
      score -= bonus;
      factors.push(`Calidad de uso del simulador: ${student.simulatorQualityScore}/100`);
    }
  } else {
    factors.push('Sin uso registrado del Simulador de Toma de Ramos (sin penalización en indicador)');
  }

  return { score: Math.max(0, Math.min(50, score)), factors };
}

function computeTrendScore(student) {
  const { trend, direction } = calculateTrend(student);
  const factors = [];
  let score = 50;

  if (direction === 'declining') {
    score += Math.min(30, Math.abs(trend) * 3);
    factors.push(`Tendencia de asistencia decreciente (${trend > 0 ? '+' : ''}${trend}% vs período anterior)`);
  } else if (direction === 'improving') {
    score -= Math.min(20, Math.abs(trend) * 2);
    factors.push(`Tendencia de asistencia mejorando (${trend > 0 ? '+' : ''}${trend}% vs período anterior)`);
  } else {
    factors.push('Tendencia de asistencia estable');
  }

  return { score: Math.max(0, Math.min(100, score)), factors, trend, direction };
}

function computeLoadScore(student) {
  const { totalCredits, hasPractices } = calculateAcademicLoad(student);
  const factors = [];
  let score = 50;

  if (totalCredits > 60) {
    score += 15;
    factors.push(`Carga académica alta (${totalCredits} créditos)`);
  } else if (totalCredits > 45) {
    score += 8;
    factors.push(`Carga académica moderada (${totalCredits} créditos)`);
  } else {
    factors.push(`Carga académica estándar (${totalCredits} créditos)`);
  }

  if (hasPractices) {
    score += 5;
    factors.push('Incluye asignaturas prácticas/laboratorios (mayor demanda horaria)');
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

function combineScoresWithBreakdown(subScores, weights) {
  const breakdown = {};
  let weightedSum = 0;

  for (const [key, { score }] of Object.entries(subScores)) {
    const weight = weights[key] || 0;
    breakdown[key] = {
      rawScore: score,
      weight,
      contribution: Math.round(score * weight * 10) / 10,
    };
    weightedSum += score * weight;
  }

  return {
    finalScore: Math.round(weightedSum),
    breakdown,
  };
}

function classifyTrafficLight(score, effectiveAttendance, coursesInRI, config) {
  const thresholds = config.thresholds.riskLevels;

  if (
    effectiveAttendance < config.thresholds.attendance.ri ||
    coursesInRI.length > 0 ||
    score >= thresholds.alto.minScore
  ) {
    return { riskLevel: 'ALTO', trafficLight: 'red', ...thresholds.alto };
  }
  if (effectiveAttendance <= config.thresholds.attendance.alert || score >= thresholds.medio.minScore) {
    return { riskLevel: 'MEDIO', trafficLight: 'yellow', ...thresholds.medio };
  }
  return { riskLevel: 'BAJO', trafficLight: 'green', ...thresholds.bajo };
}

function evaluateCondition(condition, ctx) {
  try {
    const normalized = condition.replace(/\s+/g, ' ').trim();
    const orParts = splitTopLevel(normalized, '||');
    for (const orPart of orParts) {
      const andParts = splitTopLevel(orPart.trim(), '&&');
      let allTrue = true;
      for (const andPart of andParts) {
        if (!evaluateSimpleCondition(andPart.trim(), ctx)) {
          allTrue = false;
          break;
        }
      }
      if (allTrue) return true;
    }
    return false;
  } catch (e) {
    console.warn('[predictiveRiskService] Error evaluando condición:', condition, e.message);
    return false;
  }
}

function splitTopLevel(expr, operator) {
  const parts = [];
  let current = '';
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    const nextChar = expr[i + 1];

    if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
    else if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    else if (char === '(' && !inSingleQuote && !inDoubleQuote) depth++;
    else if (char === ')' && !inSingleQuote && !inDoubleQuote) depth--;

    if (depth === 0 && !inSingleQuote && !inDoubleQuote) {
      if (operator === '||' && char === '|' && nextChar === '|') {
        parts.push(current.trim());
        current = '';
        i++;
        continue;
      }
      if (operator === '&&' && char === '&' && nextChar === '&') {
        parts.push(current.trim());
        current = '';
        i++;
        continue;
      }
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evaluateSimpleCondition(expr, ctx) {
  let negated = false;
  let condition = expr.trim();
  if (condition.startsWith('!')) {
    negated = true;
    condition = condition.slice(1).trim();
  }

  const operators = ['===', '!==', '>=', '<=', '>', '<'];
  let op = null;
  let left = '';
  let right = '';

  for (const candidate of operators) {
    const idx = condition.indexOf(candidate);
    if (idx !== -1) {
      op = candidate;
      left = condition.slice(0, idx).trim();
      right = condition.slice(idx + candidate.length).trim();
      break;
    }
  }

  if (!op) {
    console.warn('[predictiveRiskService] Condición sin operador válido:', expr);
    return false;
  }

  const leftVal = resolvePath(left, ctx);
  const rightVal = resolvePath(right, ctx);

  let result;
  switch (op) {
    case '===': result = leftVal === rightVal; break;
    case '!==': result = leftVal !== rightVal; break;
    case '>': result = Number(leftVal) > Number(rightVal); break;
    case '<': result = Number(leftVal) < Number(rightVal); break;
    case '>=': result = Number(leftVal) >= Number(rightVal); break;
    case '<=': result = Number(leftVal) <= Number(rightVal); break;
    default: return false;
  }

  return negated ? !result : result;
}

function resolvePath(pathStr, ctx) {
  const trimmed = pathStr.trim();

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  const parts = trimmed.split('.');
  let value = ctx;
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  return value;
}

function determineNextBestAction(student, prediction, config) {
  const rules = config.nextBestAction?.rules || [];
  const ctx = {
    riskLevel: prediction.riskLevel,
    effectiveAttendance: prediction.effectiveAttendance,
    coursesInRI: prediction.coursesInRI || [],
    coursesInAlert: prediction.coursesInAlert || [],
    isPaedis: Boolean(student.isPaedis),
    tutorPaedisAsignado: student.tutorPaedisAsignado || '',
    ajustesCount: Array.isArray(student.ajustesAprobados) ? student.ajustesAprobados.length : 0,
    hasUsedSimulator: Boolean(student.hasUsedSimulator),
    simulatorQualityScore: student.simulatorQualityScore,
  };

  for (const rule of rules) {
    if (evaluateCondition(rule.condition, ctx)) {
      return {
        action: rule.action,
        priority: rule.priority,
        slaHours: rule.slaHours,
        triggeredRule: rule.condition,
      };
    }
  }

  const fallback = {
    ALTO: 'Contactar al estudiante + Abrir Ficha 360 (SLA 48h)',
    MEDIO: 'Seguimiento docente + Revisión de asistencia',
    BAJO: 'Monitoreo rutinario',
  };
  return {
    action: fallback[prediction.riskLevel] || 'Monitoreo rutinario',
    priority: 99,
    slaHours: prediction.riskLevel === 'ALTO' ? 48 : 72,
    triggeredRule: 'fallback',
  };
}

/**
 * Calcula el indicador heurístico descriptivo de seguimiento temprano con breakdown y NBA.
 */
function calculatePredictiveRisk(user = {}) {
  const config = loadWeightsConfig();
  const status = user.academicStatus || 'activo';
  const sourceCourses = user.enrolledCourses || user.courseAttendance || [];

  const terminalPrediction = buildTerminalStatusPrediction(
    status,
    extractCourseAttendanceDetails(sourceCourses, user.attendanceRate)
  );
  if (terminalPrediction) return terminalPrediction;

  const attendanceSummary = extractCourseAttendanceDetails(sourceCourses, user.attendanceRate);
  const { effectiveAttendance, coursesInRI, coursesInAlert } = attendanceSummary;

  const hasValidAttendance =
    effectiveAttendance !== null &&
    effectiveAttendance !== undefined &&
    Number.isFinite(Number(effectiveAttendance));

  if (user.sinDatosSuficientes === true || user.attendanceRate === null || !hasValidAttendance) {
    return {
      score: null,
      riskLevel: 'SIN_DATOS',
      predictionLabel: 'Sin datos suficientes',
      color: 'slate',
      trafficLight: 'gray',
      isHeuristic: true,
      indicatorType: HEURISTIC_INDICATOR_TYPE,
      requiresHumanReview: true,
      disclaimer: HEURISTIC_DISCLAIMER,
      factors: ['Sin registros de asistencia o asignaturas suficientes para emitir seguimiento'],
      breakdown: null,
      nextBestAction: {
        action: 'Completar registro académico o sincronizar asignaturas en Vivo Duoc',
        priority: 10,
        slaHours: 72,
        triggeredRule: 'sin_datos_suficientes',
      },
      effectiveAttendance: null,
      courseDetails: [],
      coursesInRI: [],
      coursesInAlert: [],
    };
  }

  const attendance = computeAttendanceScore(effectiveAttendance, coursesInRI, coursesInAlert, config);
  const paedis = computePaedisScore(user);
  const simulator = computeSimulatorScore(user);
  const trend = computeTrendScore(user);
  const load = computeLoadScore(user);

  const subScores = { attendance, paedis, simulator, trend, load };
  const allFactors = [
    ...attendance.factors,
    ...paedis.factors,
    ...simulator.factors,
    ...trend.factors,
    ...load.factors,
  ];

  const { finalScore, breakdown } = combineScoresWithBreakdown(subScores, config.weights);
  const classification = classifyTrafficLight(finalScore, effectiveAttendance, coursesInRI, config);
  const nextBestAction = determineNextBestAction(
    user,
    { ...classification, effectiveAttendance, coursesInRI, coursesInAlert },
    config
  );
  const loadResult = calculateAcademicLoad(user);

  return {
    score: finalScore,
    riskLevel: classification.riskLevel,
    predictionLabel: classification.label,
    color:
      classification.trafficLight === 'red'
        ? 'red'
        : classification.trafficLight === 'yellow'
          ? 'amber'
          : 'emerald',
    trafficLight: classification.trafficLight,
    isHeuristic: true,
    indicatorType: HEURISTIC_INDICATOR_TYPE,
    requiresHumanReview: true,
    disclaimer: HEURISTIC_DISCLAIMER,
    factors: allFactors,
    breakdown,
    nextBestAction,
    trend: { direction: trend.direction, value: trend.trend },
    academicLoad: { totalCredits: loadResult.totalCredits },
    ...attendanceSummary,
  };
}

module.exports = {
  HEURISTIC_INDICATOR_TYPE,
  HEURISTIC_DISCLAIMER,
  calculatePredictiveRisk,
  loadWeightsConfig,
  normalizeCourses,
  resolveAttendancePercentage,
  extractCourseAttendanceDetails,
  computeAttendanceScore,
  computePaedisScore,
  computeSimulatorScore,
  computeTrendScore,
  computeLoadScore,
  calculateTrend,
  calculateAcademicLoad,
  combineScoresWithBreakdown,
  classifyTrafficLight,
  determineNextBestAction,
  buildTerminalStatusPrediction,
};
