/**
 * Servicio del Sistema de Alerta Temprana (SAT) - Nexo360
 * Normativa Duoc UC (Mínimo 75% de asistencia por asignatura) y Acompañamiento PAEDIS
 */

/**
 * Evalúa el estado SAT de una asignatura individual
 * @param {Object} course Objeto con asistencia de la asignatura
 * @returns {Object} Clasificación y razones del estado
 */
function calculateCourseSatStatus(course) {
  const attendancePct = Math.round(Number(course.attendancePercentage ?? 100) * 10) / 10;
  const consecutiveAbs = Math.max(0, Number.parseInt(course.consecutiveAbsences || 0, 10));
  const late = Math.max(0, Number.parseInt(course.lateCount || 0, 10));
  const missedKey = Boolean(course.missedKeySession);
  const justified = Boolean(course.paedisJustified);

  if (justified) {
    return {
      severity: 'PAEDIS_JUSTIFIED',
      label: 'Excepción PAEDIS / Justificado',
      badgeColor: 'purple',
      isAlert: false,
      reasons: ['Inasistencias justificadas formalmente por condición de salud o ajustes PAEDIS'],
    };
  }

  const reasons = [];
  if (attendancePct < 75) {
    reasons.push(`Asistencia crítica (${attendancePct}% < 75%): Riesgo inminente de Reprobación por Inasistencia (RI)`);
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
      reasons,
    };
  }

  if (attendancePct >= 75 && attendancePct <= 79) {
    reasons.push(`Asistencia al límite (${attendancePct}%): Margen crítico de faltas restante`);
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
      reasons,
    };
  }

  return {
    severity: 'NONE',
    label: 'Sin Riesgo (Asistencia Regular)',
    badgeColor: 'emerald',
    isAlert: false,
    reasons: ['Cumplimiento regular sobre el 80% de asistencia'],
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

/**
 * Simula el corte semanal de asistencia sobre una asignatura específica
 * @param {Array} courseAttendance Arreglo de asignaturas del estudiante
 * @param {Object} simulationOptions Opciones de simulación
 * @returns {Array} Arreglo actualizado de asignaturas
 */
function applySimulatedCourseUpdate(courseAttendance = [], simulationOptions = {}) {
  const targetCode = String(simulationOptions.courseCode || '').trim().toUpperCase();
  const action = String(simulationOptions.action || '').trim().toLowerCase();

  return courseAttendance.map((item) => {
    const code = String(item.courseCode || '').trim().toUpperCase();
    if (code !== targetCode) return item;

    const total = Math.max(1, Number.parseInt(item.totalSessions || 20, 10));
    let attended = Math.max(0, Number.parseInt(item.attendedSessions || total, 10));
    let consecutiveAbs = Math.max(0, Number.parseInt(item.consecutiveAbsences || 0, 10));
    let missedKey = Boolean(item.missedKeySession);
    let justified = Boolean(item.paedisJustified);

    if (action === 'add_absence') {
      consecutiveAbs += 1;
      attended = Math.max(0, attended - 1);
    } else if (action === 'drop_below_75') {
      attended = Math.max(0, Math.floor(total * 0.68));
      consecutiveAbs = Math.max(3, consecutiveAbs + 1);
      missedKey = true;
      justified = false;
    } else if (action === 'paedis_justify') {
      justified = !justified;
    } else if (action === 'reset') {
      attended = Math.max(0, Math.floor(total * 0.95));
      consecutiveAbs = 0;
      missedKey = false;
      justified = false;
    } else {
      // Campos directos personalizados si se enviaron
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
      }
    }

    const attendancePercentage = Math.round((attended / total) * 1000) / 10;

    return {
      ...item,
      totalSessions: total,
      attendedSessions: attended,
      attendancePercentage,
      consecutiveAbsences: consecutiveAbs,
      missedKeySession: missedKey,
      paedisJustified: justified,
    };
  });
}

module.exports = {
  calculateCourseSatStatus,
  evaluateStudentSat,
  calculateGlobalMetrics,
  applySimulatedCourseUpdate,
};
