/**
 * Reglas institucionales de asistencia y alerta temprana SAT (Duoc UC).
 * - Modo 'ri70' (Panel Admin / Ficha): RI < 70%, Preventivo 70% - 75%, Normal > 75%
 * - Modo 'sat75' (Módulo SAT): RI < 75%, Preventivo 75% - 79.9%, Normal >= 80%
 */
export const DUOC_ATTENDANCE_THRESHOLDS = {
  RI_CRITICAL: 70,
  PREVENTIVE_MAX: 75,
  SAT_RI_LIMIT: 75,
  SAT_WARNING_MAX: 80,
};

const STATUS_METADATA = {
  JUSTIFIED: {
    status: 'justified',
    label: 'Justificada',
    badgeLabel: 'Justificada',
    isRisk: false,
    isCritical: false,
    color: 'blue',
    barClass: 'bg-sky-500',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    textClass: 'text-sky-700',
  },
  RI: {
    status: 'ri',
    label: 'En riesgo de RI',
    badgeLabel: 'Riesgo RI',
    isRisk: true,
    isCritical: true,
    color: 'red',
    barClass: 'bg-red-600',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    textClass: 'text-red-700',
  },
  PREVENTIVE: {
    status: 'preventive',
    label: 'Alerta preventiva',
    badgeLabel: 'Preventiva',
    isRisk: true,
    isCritical: false,
    color: 'amber',
    barClass: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    textClass: 'text-amber-700',
  },
  NORMAL: {
    status: 'normal',
    label: 'Asistencia normal',
    badgeLabel: 'Normal',
    isRisk: false,
    isCritical: false,
    color: 'emerald',
    barClass: 'bg-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    textClass: 'text-emerald-700',
  },
};

const MODE_BOUNDS = {
  ri70: {
    criticalBelow: DUOC_ATTENDANCE_THRESHOLDS.RI_CRITICAL,
    warningMaxInclusive: DUOC_ATTENDANCE_THRESHOLDS.PREVENTIVE_MAX,
  },
  sat75: {
    criticalBelow: DUOC_ATTENDANCE_THRESHOLDS.SAT_RI_LIMIT,
    warningMaxInclusive: DUOC_ATTENDANCE_THRESHOLDS.SAT_WARNING_MAX - 0.01,
  },
};

const TRAFFIC_LIGHT_MAP = {
  rojo: { key: 'rojo', label: 'Crítico', badgeClass: 'bg-red-100 text-red-900 border-red-300', dotClass: 'bg-red-600' },
  red: { key: 'rojo', label: 'Crítico', badgeClass: 'bg-red-100 text-red-900 border-red-300', dotClass: 'bg-red-600' },
  critico: { key: 'rojo', label: 'Crítico', badgeClass: 'bg-red-100 text-red-900 border-red-300', dotClass: 'bg-red-600' },
  amarillo: { key: 'amarillo', label: 'Preventivo', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300', dotClass: 'bg-amber-500' },
  amber: { key: 'amarillo', label: 'Preventivo', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300', dotClass: 'bg-amber-500' },
  yellow: { key: 'amarillo', label: 'Preventivo', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300', dotClass: 'bg-amber-500' },
  preventivo: { key: 'amarillo', label: 'Preventivo', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300', dotClass: 'bg-amber-500' },
  verde: { key: 'verde', label: 'Estable', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300', dotClass: 'bg-emerald-600' },
  green: { key: 'verde', label: 'Estable', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300', dotClass: 'bg-emerald-600' },
  normal: { key: 'verde', label: 'Estable', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300', dotClass: 'bg-emerald-600' },
};

/**
 * Extrae el porcentaje numérico de asistencia desde distintos formatos de asignatura.
 */
export function extractCourseAttendanceRate(course) {
  if (!course || typeof course !== 'object') return 100;

  const rawRate =
    course.attendancePercentage ??
    course.attendanceRate ??
    course.asistencia ??
    course.attendance;

  const parsed = Number(rawRate);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(0, Math.min(100, parsed));
}

/**
 * Evalúa el semáforo/estado de asistencia SAT con baja complejidad cognitiva.
 */
export function evaluateAttendanceStatus(percentage, options = {}) {
  const { isJustified = false, mode = 'ri70' } = options;

  if (isJustified) {
    return STATUS_METADATA.JUSTIFIED;
  }

  const numericRate = Number(percentage);
  if (!Number.isFinite(numericRate)) {
    return STATUS_METADATA.NORMAL;
  }

  const bounds = MODE_BOUNDS[mode] || MODE_BOUNDS.ri70;
  if (numericRate < bounds.criticalBelow) {
    return STATUS_METADATA.RI;
  }
  if (numericRate <= bounds.warningMaxInclusive) {
    return STATUS_METADATA.PREVENTIVE;
  }

  return STATUS_METADATA.NORMAL;
}

/**
 * Retorna clases Tailwind listas para barras, badges y textos según porcentaje SAT.
 */
export function getAttendanceColorClasses(percentage, isJustified = false, mode = 'ri70') {
  const { barClass, badgeClass, textClass, status, label } = evaluateAttendanceStatus(
    percentage,
    { isJustified, mode }
  );
  return { barClass, badgeClass, textClass, status, label };
}

/**
 * Normaliza un semáforo SAT desde predicción, etiqueta o porcentaje numérico.
 */
export function resolveTrafficLightColor(prediction) {
  if (typeof prediction === 'number') {
    const evaluated = evaluateAttendanceStatus(prediction, { mode: 'sat75' });
    if (evaluated.status === 'ri') return TRAFFIC_LIGHT_MAP.rojo;
    if (evaluated.status === 'preventive') return TRAFFIC_LIGHT_MAP.amarillo;
    return TRAFFIC_LIGHT_MAP.verde;
  }

  const candidate = String(
    prediction?.semaforo || prediction?.riskLevel || prediction?.color || prediction || ''
  )
    .toLowerCase()
    .trim();

  if (TRAFFIC_LIGHT_MAP[candidate]) {
    return TRAFFIC_LIGHT_MAP[candidate];
  }

  if (candidate.includes('ri') || candidate.includes('alto')) return TRAFFIC_LIGHT_MAP.rojo;
  if (candidate.includes('medio') || candidate.includes('alerta')) return TRAFFIC_LIGHT_MAP.amarillo;
  return TRAFFIC_LIGHT_MAP.verde;
}

/**
 * Retorna metadatos accesibles de insignia SAT para un nivel de riesgo dado.
 */
export function getSatRiskBadgeMeta(riskLevel) {
  return resolveTrafficLightColor(riskLevel);
}

/**
 * Calcula una explicación predictiva simple del riesgo de deserción basado en datos del estudiante.
 * Usado por el Directorio de Estudiantes para mostrar el semáforo predictivo.
 */
export function explainPredictiveRisk(student) {
  if (!student) {
    return {
      trafficLight: 'green',
      riskLevel: 'BAJO',
      graduationProbability: 90,
      score: 15,
      factors: ['Sin datos suficientes'],
      key: 'verde',
    };
  }

  // Extraer la asistencia más baja de las asignaturas
  const courses = Array.isArray(student.enrolledCourses) ? student.enrolledCourses : [];
  let minAttendance = 100;
  let hasCourses = false;

  for (const course of courses) {
    const rate = extractCourseAttendanceRate(course);
    if (rate < minAttendance) {
      minAttendance = rate;
      hasCourses = true;
    }
  }

  // Si no hay cursos, usar attendanceRate general
  if (!hasCourses) {
    const generalRate = Number(student.attendanceRate ?? 100);
    if (Number.isFinite(generalRate)) minAttendance = Math.max(0, Math.min(100, generalRate));
  }

  // Determinar semáforo y nivel de riesgo basado en umbrales RI (70% RI, 70-75% Preventivo, >75% Normal)
  let trafficLight, riskLevel, key, graduationProbability, score, factors;

  if (student.isPaedis) {
    // Estudiantes PAEDIS tienen ajustes, no aplicar RI automático
    trafficLight = 'green';
    riskLevel = 'BAJO';
    key = 'verde';
    graduationProbability = 85;
    score = 20;
    factors = ['Ajustes PAEDIS vigentes (Ley 21.719)'];
  } else if (minAttendance < 70) {
    trafficLight = 'red';
    riskLevel = 'ALTO';
    key = 'rojo';
    graduationProbability = 30;
    score = 85;
    factors = [
      `Asistencia mínima: ${minAttendance}% (bajo umbral RI 70%)`,
      'Riesgo inminente de Reprobación por Inasistencia',
    ];
    if (courses.some((c) => Number(c.consecutiveAbsences ?? 0) >= 3)) {
      factors.push('≥3 inasistencias consecutivas en al menos una asignatura');
    }
  } else if (minAttendance < 75) {
    trafficLight = 'yellow';
    riskLevel = 'MEDIO';
    key = 'amarillo';
    graduationProbability = 60;
    score = 55;
    factors = [
      `Asistencia mínima: ${minAttendance}% (zona preventiva 70-75%)`,
      'Requiere seguimiento docente temprano',
    ];
  } else {
    trafficLight = 'green';
    riskLevel = 'BAJO';
    key = 'verde';
    graduationProbability = 88;
    score = 15;
    factors = [`Asistencia mínima: ${minAttendance}% (cumple normativa ≥75%)`];
  }

  // Ajustar por carga académica si hay cursos
  if (courses.length > 5) {
    score = Math.min(100, score + 5);
    graduationProbability = Math.max(0, graduationProbability - 5);
    factors.push(`Carga académica alta: ${courses.length} asignaturas`);
  }

  return {
    trafficLight,
    riskLevel,
    graduationProbability,
    score,
    factors,
    key,
  };
}

/**
 * Determina el nivel de riesgo institucional SAT (Alto, Moderado, Bajo / Normal, o Excepción PAEDIS).
 */
export function calculateAttendanceRiskLevel(percentage, options = {}) {
  const { isJustified = false, consecutiveAbsences = 0, missedKeySession = false } = options;

  if (isJustified) {
    return {
      level: 'PAEDIS_JUSTIFIED',
      riskTier: 'Excepción',
      label: 'Excepción PAEDIS (Justificada)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      textClass: 'text-purple-800',
      dotClass: 'bg-purple-500',
      color: 'purple',
    };
  }

  const pct = Number(percentage);
  const numConsecutive = Number(consecutiveAbsences || 0);

  if (pct < 75 || numConsecutive >= 3 || missedKeySession) {
    return {
      level: 'LEVEL_2_CRITICAL',
      riskTier: 'Alto',
      label: 'Alto (Crítico RI <75%)',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      textClass: 'text-rose-700',
      dotClass: 'bg-rose-500',
      color: 'rose',
    };
  }

  if (pct <= 79.9 || numConsecutive === 2) {
    return {
      level: 'LEVEL_1_PREVENTIVE',
      riskTier: 'Moderado',
      label: 'Moderado (Preventivo 75%-79%)',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      textClass: 'text-amber-700',
      dotClass: 'bg-amber-500',
      color: 'amber',
    };
  }

  return {
    level: 'NONE',
    riskTier: 'Normal',
    label: 'Normal / Bajo (≥80% Regular)',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
    color: 'emerald',
  };
}

/**
 * Calcula proyecciones bidireccionales en tiempo real para una asignatura SAT.
 * Permite simular tanto asistencias positivas (+1 asistencia, 1 falta menos, etc.) como inasistencias.
 */
export function calculateBidirectionalSimulation(course) {
  if (!course) return null;

  const totalSessions = Math.max(1, Number(course.totalSessions || 20));
  const attendedSessions = Math.max(
    0,
    Math.min(totalSessions, Number(course.attendedSessions ?? totalSessions))
  );
  const currentAbsences = Math.max(0, totalSessions - attendedSessions);
  const rawPct =
    course.attendancePercentage ??
    course.attendanceRate ??
    course.asistencia ??
    course.attendance ??
    Math.round((attendedSessions / totalSessions) * 1000) / 10;
  const currentPct = Math.round(Number(rawPct) * 10) / 10;
  const consecutiveAbsences = Number(course.consecutiveAbsences || 0);
  const isJustified = Boolean(course.paedisJustified);
  const minRequiredSessions = Math.ceil(totalSessions * 0.75);
  const maxAllowedAbsences = Math.max(0, totalSessions - minRequiredSessions);
  const remainingAllowedAbsences = Math.max(0, maxAllowedAbsences - currentAbsences);
  const exceededAbsences = Math.max(0, currentAbsences - maxAllowedAbsences);

  const currentRisk = calculateAttendanceRiskLevel(currentPct, {
    isJustified,
    consecutiveAbsences,
    missedKeySession: Boolean(course.missedKeySession),
  });

  // Proyección Positiva (+1 Asistencia / 1 falta menos)
  const posAttended = Math.min(totalSessions, attendedSessions + 1);
  const posAbsences = Math.max(0, totalSessions - posAttended);
  const posConsecutive = Math.max(0, consecutiveAbsences - 1);
  const posPct = Math.round((posAttended / totalSessions) * 1000) / 10;
  const posRemaining = Math.max(0, maxAllowedAbsences - posAbsences);
  const posRisk = calculateAttendanceRiskLevel(posPct, {
    isJustified,
    consecutiveAbsences: posConsecutive,
    missedKeySession: false,
  });

  // Proyección Negativa (+1 Inasistencia)
  const negAttended = Math.max(0, attendedSessions - 1);
  const negAbsences = totalSessions - negAttended;
  const negConsecutive = consecutiveAbsences + 1;
  const negPct = Math.round((negAttended / totalSessions) * 1000) / 10;
  const negRemaining = Math.max(0, maxAllowedAbsences - negAbsences);
  const negRisk = calculateAttendanceRiskLevel(negPct, {
    isJustified,
    consecutiveAbsences: negConsecutive,
    missedKeySession: Boolean(course.missedKeySession),
  });
  const negTriggersRi = !isJustified && (negPct < 75 || negConsecutive >= 3);

  // Metas de recuperación
  const neededFor75 = Math.max(0, minRequiredSessions - attendedSessions);
  const minSessionsFor80 = Math.ceil(totalSessions * 0.8);
  const neededFor80 = Math.max(0, minSessionsFor80 - attendedSessions);

  return {
    totalSessions,
    attendedSessions,
    currentAbsences,
    currentPct,
    consecutiveAbsences,
    isJustified,
    maxAllowedAbsences,
    remainingAllowedAbsences,
    exceededAbsences,
    currentRisk,
    positive: {
      attended: posAttended,
      absences: posAbsences,
      consecutiveAbsences: posConsecutive,
      pct: posPct,
      remainingAllowed: posRemaining,
      risk: posRisk,
      deltaPct: Math.round((posPct - currentPct) * 10) / 10,
    },
    negative: {
      attended: negAttended,
      absences: negAbsences,
      consecutiveAbsences: negConsecutive,
      pct: negPct,
      remainingAllowed: negRemaining,
      risk: negRisk,
      triggersRi: negTriggersRi,
      deltaPct: Math.round((negPct - currentPct) * 10) / 10,
    },
    recovery: {
      minRequiredSessions,
      neededFor75,
      neededFor80,
      canReach75: totalSessions - currentAbsences >= minRequiredSessions,
      canReach80: totalSessions - currentAbsences >= minSessionsFor80,
    },
    // Compatibilidad retroactiva
    status: currentRisk.level === 'LEVEL_2_CRITICAL' ? 'ri' : currentRisk.level === 'LEVEL_1_PREVENTIVE' ? 'preventive' : 'normal',
    statusLabel: currentRisk.label,
    nextPct: negPct,
    nextRemaining: negRemaining,
    nextTriggersRi: negTriggersRi,
  };
}
