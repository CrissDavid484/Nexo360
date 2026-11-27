/**
 * Servicio del Sistema de Alerta Temprana (SAT) - Nexo360
 * Normativa Duoc UC (Mínimo canónico 70% RI por asignatura teórica, o umbral por asignatura) y Acompañamiento PAEDIS
 */

const DEFAULT_MIN_ATTENDANCE = 70;
const PREVENTIVE_UPPER_BOUND = 74.9;
const ACTIVITY_TYPES = Object.freeze(['TEORICA', 'PRACTICA']);

const ACTION_ENUM_MAP = Object.freeze({
  positive_attendance: 'POSITIVE_ATTENDANCE',
  add_attendance: 'POSITIVE_ATTENDANCE',
  add_presence: 'POSITIVE_ATTENDANCE',
  recover_to_70: 'POSITIVE_ATTENDANCE',
  reach_70: 'POSITIVE_ATTENDANCE',
  recover_to_75: 'POSITIVE_ATTENDANCE',
  reach_75: 'POSITIVE_ATTENDANCE',
  future_perfect: 'POSITIVE_ATTENDANCE',
  project_perfect: 'POSITIVE_ATTENDANCE',
  attend_all_remaining: 'POSITIVE_ATTENDANCE',

  negative_absence: 'NEGATIVE_ABSENCE',
  add_absence: 'NEGATIVE_ABSENCE',
  drop_below_70: 'NEGATIVE_ABSENCE',
  drop_below_75: 'NEGATIVE_ABSENCE',

  future_class_attend: 'FUTURE_CLASS_ATTEND',
  project_future_attendance: 'FUTURE_CLASS_ATTEND',
  future_attend: 'FUTURE_CLASS_ATTEND',
  future_present: 'FUTURE_CLASS_ATTEND',
  future_class_present: 'FUTURE_CLASS_ATTEND',

  future_class_miss: 'FUTURE_CLASS_MISS',
  project_future_absence: 'FUTURE_CLASS_MISS',
  future_absence: 'FUTURE_CLASS_MISS',
  future_miss: 'FUTURE_CLASS_MISS',

  correct_past_attendance: 'CORRECT_PAST_ATTENDANCE',
  remove_absence: 'CORRECT_PAST_ATTENDANCE',
  reduce_absence: 'CORRECT_PAST_ATTENDANCE',
  past_correction_positive: 'CORRECT_PAST_ATTENDANCE',

  hypothetical_exception: 'HYPOTHETICAL_EXCEPTION',
  paedis_justify: 'HYPOTHETICAL_EXCEPTION',
  paedis_exception: 'HYPOTHETICAL_EXCEPTION',

  reset: 'RESET_BASE',
  reset_base: 'RESET_BASE',

  custom_stepper: 'CUSTOM_STEPPER',
});

/**
 * Normaliza una acción cruda de simulación al enum oficial de AttendanceSimulation.
 * @param {string} rawAction Acción recibida
 * @returns {string} Valor del enum AttendanceSimulation.actionApplied
 */
function normalizeSimulationAction(rawAction) {
  const key = String(rawAction || '').trim().toLowerCase();
  if (!key) return 'CUSTOM_STEPPER';
  if (ACTION_ENUM_MAP[key]) return ACTION_ENUM_MAP[key];
  const upper = key.toUpperCase();
  const validEnums = new Set(Object.values(ACTION_ENUM_MAP));
  return validEnums.has(upper) ? upper : 'CUSTOM_STEPPER';
}

function resolveActivityType(course = {}) {
  const raw = String(course.activityType || '').trim().toUpperCase();
  return ACTIVITY_TYPES.includes(raw) ? raw : 'TEORICA';
}

function resolveCourseMinAttendance(course = {}) {
  const explicit = Number(course.minAttendanceRequired);
  if (Number.isFinite(explicit) && explicit > 0 && explicit <= 100) {
    return Math.round(explicit * 10) / 10;
  }
  return DEFAULT_MIN_ATTENDANCE;
}

function resolvePreventiveUpperBound(minRequired) {
  if (minRequired === DEFAULT_MIN_ATTENDANCE) return PREVENTIVE_UPPER_BOUND;
  return Math.min(99.9, Math.round((minRequired + 4.9) * 10) / 10);
}

function toOptionalNonNegInt(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.trunc(num));
}

function resolveCourseSessionStats(course = {}) {
  const completed = toOptionalNonNegInt(course.completedSessions);
  const legacyTotal = toOptionalNonNegInt(course.totalSessions);
  const total = completed !== null ? completed : legacyTotal;
  const scheduled = toOptionalNonNegInt(course.scheduledSessions);
  const attendedRaw = toOptionalNonNegInt(course.attendedSessions);
  const attended =
    total !== null
      ? Math.min(total, attendedRaw !== null ? attendedRaw : 0)
      : attendedRaw;

  const explicitPending = toOptionalNonNegInt(course.pendingSessions);
  const pending =
    explicitPending !== null
      ? explicitPending
      : scheduled !== null && total !== null
        ? Math.max(0, scheduled - total)
        : 0;

  return { total, attended, scheduled, pending };
}

function computeRecoveryInfo(course = {}) {
  const minRequired = resolveCourseMinAttendance(course);
  const { total, attended, scheduled, pending } = resolveCourseSessionStats(course);
  const completed = total ?? 0;
  const currentAttended = attended ?? 0;
  const finalTotal = scheduled !== null ? Math.max(completed, scheduled) : completed + pending;

  if (finalTotal <= 0) {
    return {
      recoveryPossible: false,
      minRequiredThreshold: minRequired,
      requiredSessions: 0,
      maxPossibleAttended: 0,
      maxPossiblePercentage: null,
      pendingSessions: 0,
      finalTotalSessions: 0,
    };
  }

  const requiredSessions = Math.ceil((minRequired / 100) * finalTotal);
  const maxPossibleAttended = Math.min(finalTotal, currentAttended + pending);
  const maxPossiblePercentage = Math.round((maxPossibleAttended / finalTotal) * 1000) / 10;
  const recoveryPossible = maxPossibleAttended >= requiredSessions;

  return {
    recoveryPossible,
    minRequiredThreshold: minRequired,
    requiredSessions,
    maxPossibleAttended,
    maxPossiblePercentage,
    pendingSessions: pending,
    finalTotalSessions: finalTotal,
  };
}

/**
 * Evalúa el estado SAT de una asignatura individual
 * @param {Object} course Objeto con asistencia de la asignatura
 * @returns {Object} Clasificación y razones del estado
 */
function calculateCourseSatStatus(course = {}) {
  const activityType = resolveActivityType(course);
  const minRequired = resolveCourseMinAttendance(course);
  const preventiveUpper = resolvePreventiveUpperBound(minRequired);
  const { total, attended, scheduled, pending } = resolveCourseSessionStats(course);
  const recoveryInfo = computeRecoveryInfo(course);
  const officialExceptionAuthorized = Boolean(course.officialExceptionAuthorized);
  const hasExplicitZero = total === 0;
  const hasNullPctWithoutSessions = total === null && course.attendancePercentage === null;

  if (hasExplicitZero || hasNullPctWithoutSessions) {
    return {
      severity: 'NO_DATA',
      label: 'Sin clases registradas',
      badgeColor: 'slate',
      isAlert: false,
      attendancePercentage: null,
      minAttendanceRequired: minRequired,
      activityType,
      scheduledSessions: scheduled,
      completedSessions: total ?? 0,
      pendingSessions: pending,
      recoveryPossible: recoveryInfo.recoveryPossible,
      officialExceptionGranted: officialExceptionAuthorized,
      reasons: ['No existen clases registradas aún (0 sesiones) para evaluar asistencia'],
    };
  }

  let attendancePct;
  if (course.attendancePercentage !== undefined && course.attendancePercentage !== null) {
    attendancePct = Math.round(Number(course.attendancePercentage) * 10) / 10;
  } else if (total !== null && total > 0 && attended !== null) {
    attendancePct = Math.round((attended / total) * 1000) / 10;
  } else {
    attendancePct = 100;
  }

  const consecutiveAbs = Math.max(0, Number.parseInt(course.consecutiveAbsences || 0, 10));
  const late = Math.max(0, Number.parseInt(course.lateCount || 0, 10));
  const missedKey = Boolean(course.missedKeySession);
  const justified = officialExceptionAuthorized || Boolean(course.paedisJustified);

  if (justified) {
    const isSimulatedOnly =
      Boolean(course.isSimulated) ||
      (course.officialExceptionGranted === false && !officialExceptionAuthorized);
    return {
      severity: 'PAEDIS_JUSTIFIED',
      label: isSimulatedOnly
        ? 'Excepción PAEDIS Hipotética (Sin vigencia oficial)'
        : 'Excepción PAEDIS / Justificado',
      badgeColor: 'purple',
      isAlert: false,
      attendancePercentage: attendancePct,
      minAttendanceRequired: minRequired,
      activityType,
      scheduledSessions: scheduled,
      completedSessions: total,
      pendingSessions: pending,
      recoveryPossible: recoveryInfo.recoveryPossible,
      officialExceptionGranted: officialExceptionAuthorized,
      reasons: [
        isSimulatedOnly
          ? 'Escenario hipotético de justificación PAEDIS en simulador (no otorga excepción oficial)'
          : 'Inasistencias justificadas formalmente por condición de salud o ajustes PAEDIS',
      ],
    };
  }

  const reasons = [];
  if (attendancePct < minRequired) {
    reasons.push(
      `Asistencia crítica (${attendancePct}% < ${minRequired}%): Riesgo inminente de Reprobación por Inasistencia (RI)`
    );
  }
  if (consecutiveAbs >= 3) {
    reasons.push(`${consecutiveAbs} inasistencias consecutivas registradas`);
  }
  if (missedKey) {
    reasons.push('Inasistencia registrada a evaluación o sesión clave institucional');
  }

  if (reasons.length > 0) {
    return {
      severity: 'LEVEL_2_CRITICAL',
      label: 'Alerta Crítica (Nivel 2 - Gestor PAEDIS)',
      badgeColor: 'rose',
      isAlert: true,
      attendancePercentage: attendancePct,
      minAttendanceRequired: minRequired,
      activityType,
      scheduledSessions: scheduled,
      completedSessions: total,
      pendingSessions: pending,
      recoveryPossible: recoveryInfo.recoveryPossible,
      officialExceptionGranted: false,
      reasons,
    };
  }

  if (minRequired < 100 && attendancePct >= minRequired && attendancePct <= preventiveUpper) {
    reasons.push(
      `Asistencia al límite (${attendancePct}% en banda preventiva ${minRequired}%-${preventiveUpper}%): Margen crítico de faltas restante`
    );
  }
  if (consecutiveAbs === 2) {
    reasons.push('2 inasistencias consecutivas registradas');
  }
  if (late >= 3) {
    reasons.push(`${late} atrasos acumulados en la asignatura`);
  }

  if (reasons.length > 0) {
    return {
      severity: 'LEVEL_1_PREVENTIVE',
      label: 'Alerta Preventiva (Nivel 1 - Estudiante)',
      badgeColor: 'amber',
      isAlert: true,
      attendancePercentage: attendancePct,
      minAttendanceRequired: minRequired,
      activityType,
      scheduledSessions: scheduled,
      completedSessions: total,
      pendingSessions: pending,
      recoveryPossible: recoveryInfo.recoveryPossible,
      officialExceptionGranted: false,
      reasons,
    };
  }

  return {
    severity: 'NONE',
    label: 'Sin Riesgo (Asistencia Regular)',
    badgeColor: 'emerald',
    isAlert: false,
    attendancePercentage: attendancePct,
    minAttendanceRequired: minRequired,
    activityType,
    scheduledSessions: scheduled,
    completedSessions: total,
    pendingSessions: pending,
    recoveryPossible: recoveryInfo.recoveryPossible,
    officialExceptionGranted: false,
    reasons: [`Cumplimiento regular sobre el ${preventiveUpper}% de asistencia`],
  };
}

/**
 * Evalúa el perfil completo de un estudiante frente al motor SAT
 * @param {Object} student Perfil del estudiante
 * @returns {Object} Evaluación global y detalle por asignatura
 */
function evaluateStudentSat(student = {}) {
  const courses = Array.isArray(student.courseAttendance) ? student.courseAttendance : [];
  if (courses.length === 0) {
    return {
      riskLevel: 'NONE',
      riskLabel: 'Sin Asignaturas Monitoreadas',
      badgeColor: 'slate',
      criticalCoursesCount: 0,
      preventiveCoursesCount: 0,
      justifiedCoursesCount: 0,
      noDataCoursesCount: 0,
      coursesDetails: [],
    };
  }

  const coursesDetails = courses.map((c) => {
    const raw = typeof c.toObject === 'function' ? c.toObject() : c;
    return {
      ...raw,
      status: calculateCourseSatStatus(raw),
    };
  });

  const criticalCourses = coursesDetails.filter((c) => c.status.severity === 'LEVEL_2_CRITICAL');
  const preventiveCourses = coursesDetails.filter((c) => c.status.severity === 'LEVEL_1_PREVENTIVE');
  const justifiedCourses = coursesDetails.filter((c) => c.status.severity === 'PAEDIS_JUSTIFIED');
  const noDataCourses = coursesDetails.filter((c) => c.status.severity === 'NO_DATA');

  let riskLevel = 'NONE';
  let riskLabel = 'Sin Riesgo • Asistencia Regular';
  let badgeColor = 'emerald';

  if (criticalCourses.length > 0) {
    riskLevel = 'LEVEL_2_CRITICAL';
    riskLabel = `Alerta Crítica (${criticalCourses.length} ramo(s) en Nivel 2)`;
    badgeColor = 'rose';
  } else if (preventiveCourses.length > 0) {
    riskLevel = 'LEVEL_1_PREVENTIVE';
    riskLabel = `Alerta Preventiva (${preventiveCourses.length} ramo(s) en Nivel 1)`;
    badgeColor = 'amber';
  } else if (justifiedCourses.length > 0) {
    riskLevel = 'PAEDIS_JUSTIFIED';
    riskLabel = 'Seguimiento PAEDIS • Justificado';
    badgeColor = 'purple';
  } else if (noDataCourses.length === coursesDetails.length) {
    riskLevel = 'NONE';
    riskLabel = 'Sin Clases Registradas';
    badgeColor = 'slate';
  }

  const intervention = student.satIntervention || {};
  if (intervention.status === 'RESOLVED' && riskLevel !== 'NONE') {
    riskLabel = `${riskLabel} (Caso Resuelto)`;
  }

  return {
    riskLevel,
    riskLabel,
    badgeColor,
    criticalCoursesCount: criticalCourses.length,
    preventiveCoursesCount: preventiveCourses.length,
    justifiedCoursesCount: justifiedCourses.length,
    noDataCoursesCount: noDataCourses.length,
    coursesDetails,
  };
}

/**
 * Calcula métricas agregadas del SAT para la directiva y coordinación
 * @param {Array} evaluatedStudents Arreglo de estudiantes con su evaluación SAT
 * @returns {Object} Totales y distribuciones
 */
function calculateGlobalMetrics(evaluatedStudents = []) {
  const metrics = {
    totalMonitored: evaluatedStudents.length,
    criticalCount: 0,
    preventiveCount: 0,
    paedisJustifiedCount: 0,
    noRiskCount: 0,
  };

  for (const s of evaluatedStudents) {
    const level = s.satEvaluation?.riskLevel || 'NONE';
    if (level === 'LEVEL_2_CRITICAL') {
      metrics.criticalCount += 1;
    } else if (level === 'LEVEL_1_PREVENTIVE') {
      metrics.preventiveCount += 1;
    } else if (level === 'PAEDIS_JUSTIFIED') {
      metrics.paedisJustifiedCount += 1;
    } else {
      metrics.noRiskCount += 1;
    }
  }

  return metrics;
}

function buildResetCourse(item, simulationOptions) {
  const baselineFromMap = Array.isArray(simulationOptions.baselineCourses)
    ? simulationOptions.baselineCourses.find(
        (c) => String(c?.courseCode || '').trim().toUpperCase() === String(item.courseCode || '').trim().toUpperCase()
      )
    : null;
  const source = simulationOptions.baselineCourse || simulationOptions.originalCourse || baselineFromMap || item;
  const cloned = typeof source.toObject === 'function' ? source.toObject() : { ...source };
  const stats = resolveCourseSessionStats(cloned);
  const total = stats.total ?? 0;
  const attended = stats.attended ?? 0;
  const recovery = computeRecoveryInfo(cloned);
  const attendancePercentage =
    total === 0
      ? null
      : cloned.attendancePercentage !== undefined && cloned.attendancePercentage !== null
        ? Math.round(Number(cloned.attendancePercentage) * 10) / 10
        : Math.round((attended / total) * 1000) / 10;

  return {
    ...cloned,
    totalSessions: total,
    completedSessions: total,
    attendedSessions: attended,
    attendancePercentage,
    consecutiveAbsences: Math.max(0, Number.parseInt(cloned.consecutiveAbsences || 0, 10)),
    missedKeySession: Boolean(cloned.missedKeySession),
    paedisJustified: Boolean(cloned.paedisJustified),
    officialExceptionGranted: Boolean(cloned.officialExceptionAuthorized),
    recoveryPossible: recovery.recoveryPossible,
    minAttendanceRequired: recovery.minRequiredThreshold,
    isSimulated: false,
  };
}

/**
 * Simula el corte semanal o proyección de asistencia sobre una asignatura específica.
 * No muta el arreglo ni los objetos originales.
 * @param {Array} courseAttendance Arreglo de asignaturas del estudiante
 * @param {Object} simulationOptions Opciones de simulación
 * @returns {Array} Arreglo actualizado de asignaturas (copias inmutables)
 */
function applySimulatedCourseUpdate(courseAttendance = [], simulationOptions = {}) {
  const targetCode = String(simulationOptions.courseCode || '').trim().toUpperCase();
  const action = String(simulationOptions.action || '').trim().toLowerCase();

  return courseAttendance.map((rawItem) => {
    const item = typeof rawItem?.toObject === 'function' ? rawItem.toObject() : { ...rawItem };
    const code = String(item.courseCode || '').trim().toUpperCase();
    if (code !== targetCode) return item;

    if (action === 'reset' || action === 'reset_base') {
      return buildResetCourse(item, simulationOptions);
    }

    const stats = resolveCourseSessionStats(item);
    let total = stats.total !== null ? stats.total : 0;
    let attended = stats.attended !== null ? stats.attended : 0;
    const scheduled = stats.scheduled;
    let pending = stats.pending;
    let consecutiveAbs = Math.max(0, Number.parseInt(item.consecutiveAbsences || 0, 10));
    let missedKey = Boolean(item.missedKeySession);
    let justified = Boolean(item.paedisJustified);
    let officialExceptionGranted = Boolean(item.officialExceptionAuthorized);
    const minRequired = resolveCourseMinAttendance(item);

    if (
      action === 'future_class_attend' ||
      action === 'project_future_attendance' ||
      action === 'future_attend' ||
      action === 'future_present' ||
      action === 'future_class_present'
    ) {
      if (scheduled === null || total < scheduled) {
        total += 1;
        attended += 1;
        if (pending > 0) pending = Math.max(0, pending - 1);
        consecutiveAbs = 0;
        if ((attended / total) * 100 >= minRequired) {
          missedKey = false;
        }
      }
    } else if (
      action === 'future_class_miss' ||
      action === 'project_future_absence' ||
      action === 'future_absence' ||
      action === 'future_miss'
    ) {
      if (scheduled === null || total < scheduled) {
        total += 1;
        if (pending > 0) pending = Math.max(0, pending - 1);
        consecutiveAbs += 1;
      }
    } else if (
      action === 'add_attendance' ||
      action === 'add_presence' ||
      action === 'positive_attendance' ||
      action === 'correct_past_attendance' ||
      action === 'remove_absence' ||
      action === 'reduce_absence' ||
      action === 'past_correction_positive'
    ) {
      if (total > 0) {
        attended = Math.min(total, attended + 1);
        consecutiveAbs = Math.max(0, consecutiveAbs - 1);
        if ((attended / total) * 100 >= minRequired && consecutiveAbs < 3) {
          missedKey = false;
        }
      }
    } else if (action === 'add_absence' || action === 'negative_absence') {
      if (total > 0) {
        attended = Math.max(0, attended - 1);
      }
      consecutiveAbs += 1;
    } else if (
      action === 'recover_to_70' ||
      action === 'reach_70' ||
      action === 'recover_to_75' ||
      action === 'reach_75'
    ) {
      const targetThreshold =
        action === 'recover_to_75' || action === 'reach_75' ? Math.max(75, minRequired) : minRequired;
      const hasFutureWindow = scheduled !== null || pending > 0;
      const finalTotal = scheduled !== null ? Math.max(total, scheduled) : total + pending;
      const remaining = Math.max(0, finalTotal - total);
      const reqSessions = finalTotal > 0 ? Math.ceil((targetThreshold / 100) * finalTotal) : 0;

      if (hasFutureWindow) {
        const maxPossible = Math.min(finalTotal, attended + remaining);
        if (finalTotal > 0 && maxPossible >= reqSessions) {
          const needed = Math.max(0, reqSessions - attended);
          attended = Math.min(finalTotal, attended + needed);
          total = Math.min(finalTotal, total + needed);
          pending = Math.max(0, finalTotal - total);
          consecutiveAbs = 0;
          missedKey = false;
        }
        // Si la recuperación es imposible, no inflar sobre total ni scheduledSessions
      } else if (total > 0 && reqSessions <= total && attended < reqSessions) {
        // Sin ventana futura declarada, no puede superar total
        if (reqSessions <= total) {
          // Solo si ya existen sesiones totales suficientes y la acción busca proyectar sobre total actual
          attended = Math.min(total, reqSessions);
          consecutiveAbs = 0;
          missedKey = false;
        }
      }
    } else if (action === 'future_perfect' || action === 'project_perfect' || action === 'attend_all_remaining') {
      const finalTotal = scheduled !== null ? Math.max(total, scheduled) : total + pending;
      const remaining = Math.max(0, finalTotal - total);
      if (remaining > 0) {
        attended = Math.min(finalTotal, attended + remaining);
        total = finalTotal;
        pending = 0;
      } else if (total > 0) {
        attended = total;
      }
      consecutiveAbs = 0;
      if (total > 0 && (attended / total) * 100 >= minRequired) {
        missedKey = false;
      }
    } else if (action === 'drop_below_70' || action === 'drop_below_75') {
      const targetPct = action === 'drop_below_70' ? 0.65 : 0.68;
      attended = total > 0 ? Math.max(0, Math.floor(total * targetPct)) : 0;
      consecutiveAbs = Math.max(3, consecutiveAbs + 1);
      missedKey = true;
      justified = false;
      officialExceptionGranted = false;
    } else if (
      action === 'hypothetical_exception' ||
      action === 'paedis_justify' ||
      action === 'paedis_exception'
    ) {
      justified =
        typeof simulationOptions.paedisJustified === 'boolean'
          ? simulationOptions.paedisJustified
          : !justified;
      officialExceptionGranted = false;
    } else {
      if (typeof simulationOptions.deltaAttendance === 'number') {
        const delta = Math.trunc(simulationOptions.deltaAttendance);
        if (total > 0) {
          attended = Math.max(0, Math.min(total, attended + delta));
          if (delta > 0) {
            consecutiveAbs = Math.max(0, consecutiveAbs - delta);
            if ((attended / total) * 100 >= minRequired && consecutiveAbs < 3) missedKey = false;
          } else if (delta < 0) {
            consecutiveAbs = Math.max(0, consecutiveAbs - delta);
          }
        }
      }
      if (typeof simulationOptions.attendedSessions === 'number') {
        attended = Math.max(0, Math.min(total, Math.trunc(simulationOptions.attendedSessions)));
      }
      if (typeof simulationOptions.consecutiveAbsences === 'number') {
        consecutiveAbs = Math.max(0, Math.trunc(simulationOptions.consecutiveAbsences));
      }
      if (typeof simulationOptions.missedKeySession === 'boolean') {
        missedKey = simulationOptions.missedKeySession;
      }
      if (typeof simulationOptions.paedisJustified === 'boolean') {
        justified = simulationOptions.paedisJustified;
        officialExceptionGranted = false;
      }
    }

    const attendancePercentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : null;
    const updatedCourse = {
      ...item,
      activityType: resolveActivityType(item),
      minAttendanceRequired: minRequired,
      totalSessions: total,
      completedSessions: total,
      scheduledSessions: scheduled,
      pendingSessions: pending,
      attendedSessions: attended,
      attendancePercentage,
      consecutiveAbsences: consecutiveAbs,
      missedKeySession: missedKey,
      paedisJustified: justified,
      officialExceptionAuthorized: officialExceptionGranted,
      officialExceptionGranted,
      isSimulated: true,
    };

    const recovery = computeRecoveryInfo(updatedCourse);
    updatedCourse.recoveryPossible = recovery.recoveryPossible;
    updatedCourse.maxPossiblePercentage = recovery.maxPossiblePercentage;

    return updatedCourse;
  });
}

module.exports = {
  DEFAULT_MIN_ATTENDANCE,
  PREVENTIVE_UPPER_BOUND,
  ACTIVITY_TYPES,
  normalizeSimulationAction,
  resolveCourseMinAttendance,
  computeRecoveryInfo,
  calculateCourseSatStatus,
  evaluateStudentSat,
  calculateGlobalMetrics,
  applySimulatedCourseUpdate,
};
