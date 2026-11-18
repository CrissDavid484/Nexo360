/**
 * Servicio del Modelo Predictivo de Retención vs. Deserción Duoc UC (Nexo360).
 * Normativa Académica Oficial Duoc UC:
 * - Asistencia < 70%: Reprobado por Inasistencia [RI] / Alto Riesgo (Rojo)
 * - Asistencia 70% - 75%: Riesgo Moderado / Alerta Preventiva (Amarillo)
 * - Asistencia > 75%: Bajo Riesgo / Progreso Favorable (Verde)
 */

function resolveCourseAttendanceRate(course) {
  return Number(
    course.attendanceRate ?? course.porcentajeAsistencia ?? course.asistenciaPorcentaje ?? 100
  );
}

function hasExplicitAttendance(course) {
  return (
    Boolean(course) &&
    (course.attendanceRate !== undefined ||
      course.porcentajeAsistencia !== undefined ||
      course.asistenciaPorcentaje !== undefined)
  );
}

/**
 * Extrae detalle y promedio de asistencia desde las asignaturas inscritas del estudiante.
 */
function extractCourseAttendanceDetails(enrolledCourses, fallbackRate) {
  let effectiveAttendance = fallbackRate !== undefined ? Number(fallbackRate) : 88.9;
  const courseDetails = [];
  const coursesInRI = [];
  const coursesInAlert = [];

  if (!Array.isArray(enrolledCourses) || enrolledCourses.length === 0) {
    return { effectiveAttendance, courseDetails, coursesInRI, coursesInAlert };
  }

  const coursesWithAttendance = enrolledCourses.filter(hasExplicitAttendance);
  if (coursesWithAttendance.length > 0) {
    const sum = coursesWithAttendance.reduce((acc, c) => acc + resolveCourseAttendanceRate(c), 0);
    effectiveAttendance = Math.round((sum / coursesWithAttendance.length) * 10) / 10;
  }

  for (const c of enrolledCourses) {
    const rate = resolveCourseAttendanceRate(c);
    const isRI = rate < 70;
    const isAlert = rate >= 70 && rate <= 75;
    const courseLabel = c.nombre || c.sigla || 'Asignatura';

    courseDetails.push({
      nombre: courseLabel,
      sigla: c.sigla || '',
      seccion: c.seccion || '',
      attendanceRate: rate,
      clasesRegistradas: c.clasesRegistradas || 0,
      asistencias: c.asistencias || 0,
      profesor: c.profesor || '',
      sala: c.sala || '',
      isRI,
      isAlert,
    });

    if (isRI) coursesInRI.push(courseLabel);
    else if (isAlert) coursesInAlert.push(courseLabel);
  }

  return { effectiveAttendance, courseDetails, coursesInRI, coursesInAlert };
}

/**
 * Retorna predicción inmediata para estados académicos terminales (deserción o titulación).
 */
function buildTerminalStatusPrediction(status, attendanceSummary) {
  if (status === 'desercion') {
    return {
      score: 100,
      riskLevel: 'DESERTOR',
      predictionLabel: 'Deserción Registrada',
      color: 'red',
      trafficLight: 'red',
      factors: ['Estudiante actualmente en deserción / retiro académico'],
      graduationProbability: 0,
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
      factors: ['Plan de estudios completado con éxito'],
      graduationProbability: 100,
      ...attendanceSummary,
    };
  }

  return null;
}

/**
 * Calcula puntaje base y factores según asistencia global y asignaturas en riesgo.
 */
function computeAttendanceBaseScore(effectiveAttendance, coursesInRI, coursesInAlert) {
  const factors = [];

  if (effectiveAttendance < 70 || coursesInRI.length > 0) {
    const score = Math.max(70, Math.round(75 + (70 - Math.min(effectiveAttendance, 69)) * 0.8));
    const riMessage =
      coursesInRI.length > 0
        ? `Reprobación por Inasistencia (RI < 70%) en: ${coursesInRI.join(', ')}`
        : `Asistencia crítica (${effectiveAttendance}% < 70%): En causal de Reprobación por Inasistencia (RI)`;
    factors.push(riMessage);
    return { score, factors };
  }

  if (effectiveAttendance <= 75 || coursesInAlert.length > 0) {
    const score = Math.round(40 + (75 - effectiveAttendance) * 3);
    factors.push(
      `Asistencia al límite (${effectiveAttendance}%): Riesgo moderado en zona de peligro (70% - 75%)`
    );
    if (coursesInAlert.length > 0) {
      factors.push(`Asignaturas en observación (70-75%): ${coursesInAlert.join(', ')}`);
    }
    return { score, factors };
  }

  const score = Math.max(5, Math.round(25 - (effectiveAttendance - 75) * 0.6));
  factors.push(
    `Asistencia favorable (${effectiveAttendance}% > 75%): Cumple normativa académica Duoc UC`
  );
  return { score, factors };
}

/**
 * Aplica ajustes al puntaje según acompañamiento PAEDIS y uso del simulador.
 */
function applySupportAdjustments({ score, factors, isPaedis, tutor, ajustesCount, hasUsedSim }) {
  let adjusted = score;

  if (isPaedis) {
    if (!tutor || tutor.toLowerCase().includes('sin tutor')) {
      adjusted += 15;
      factors.push('Estudiante PAEDIS sin tutor par asignado: Requiere asignación de apoyo');
    } else if (ajustesCount > 0) {
      adjusted -= 10;
      factors.push(`Acompañamiento PAEDIS activo con ${ajustesCount} ajuste(s) razonable(s)`);
    }
  }

  if (hasUsedSim) {
    adjusted -= 8;
    factors.push('Uso activo del Simulador de Toma de Ramos: Planificación horaria confirmada');
  } else {
    adjusted += 8;
    factors.push(
      'No ha planificado horario en el simulador: Riesgo de sobrecarga o choques de horario'
    );
  }

  return Math.max(5, Math.min(95, Math.round(adjusted)));
}

/**
 * Clasifica el semáforo de retención según puntaje y umbrales de asistencia.
 */
function classifyRiskTrafficLight(score, effectiveAttendance, coursesInRI) {
  if (effectiveAttendance < 70 || coursesInRI.length > 0 || score >= 60) {
    return {
      riskLevel: 'ALTO',
      predictionLabel: 'Alerta Temprana: Alto Riesgo • Reprobado por Inasistencia (RI < 70%)',
      color: 'red',
      trafficLight: 'red',
    };
  }

  if (effectiveAttendance <= 75 || score >= 35) {
    return {
      riskLevel: 'MEDIO',
      predictionLabel: 'Riesgo Moderado • Alerta Preventiva de Asistencia (70% - 75%)',
      color: 'amber',
      trafficLight: 'yellow',
    };
  }

  return {
    riskLevel: 'BAJO',
    predictionLabel: 'Bajo Riesgo • Retención Favorable (> 75%)',
    color: 'emerald',
    trafficLight: 'green',
  };
}

/**
 * Calcula el Semáforo Predictivo de Retención vs. Deserción para un usuario.
 */
function calculatePredictiveRisk(user = {}) {
  const status = user.academicStatus || 'activo';
  const attendanceSummary = extractCourseAttendanceDetails(
    user.enrolledCourses,
    user.attendanceRate
  );

  const terminalPrediction = buildTerminalStatusPrediction(status, attendanceSummary);
  if (terminalPrediction) {
    return terminalPrediction;
  }

  const { effectiveAttendance, coursesInRI, coursesInAlert } = attendanceSummary;
  const { score: baseScore, factors } = computeAttendanceBaseScore(
    effectiveAttendance,
    coursesInRI,
    coursesInAlert
  );

  const score = applySupportAdjustments({
    score: baseScore,
    factors,
    isPaedis: Boolean(user.isPaedis),
    tutor: user.tutorParAsignado || '',
    ajustesCount: Array.isArray(user.ajustesAprobados) ? user.ajustesAprobados.length : 0,
    hasUsedSim: Boolean(user.hasUsedSimulator),
  });

  const classification = classifyRiskTrafficLight(score, effectiveAttendance, coursesInRI);

  return {
    score,
    ...classification,
    factors,
    graduationProbability: Math.max(5, 100 - score),
    ...attendanceSummary,
  };
}

module.exports = {
  calculatePredictiveRisk,
};
