/**
 * Reglas institucionales canónicas de asistencia y alerta temprana SAT (Duoc UC).
 * - Umbral RI canónico: < 70% (o < course.minAttendanceRequired cuando se defina)
 * - Alerta Preventiva: 70% - 74.9% (o [minRequired, minRequired + 4.9%])
 * - Asistencia Regular: >= 75% (o >= minRequired + 5%)
 */
export const DUOC_ATTENDANCE_THRESHOLDS = {
  RI_CRITICAL: 70,
  PREVENTIVE_MAX: 74.9,
  REGULAR_MIN: 75,
};

const STATUS_METADATA = {
  NO_DATA: {
    status: 'no_data',
    label: 'Sin registros',
    badgeLabel: 'Sin datos',
    isRisk: false,
    isCritical: false,
    color: 'neutral',
    barClass: 'bg-neutral-300',
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    textClass: 'text-neutral-600',
  },
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
  sin_datos: { key: 'sin_datos', label: 'Sin datos', badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300', dotClass: 'bg-neutral-400' },
};

function resolveMinAttendanceThreshold(options = {}) {
  const custom = Number(options.minAttendanceRequired ?? options.threshold);
  if (Number.isFinite(custom) && custom > 0 && custom <= 100) {
    return custom;
  }
  return DUOC_ATTENDANCE_THRESHOLDS.RI_CRITICAL;
}

/**
 * Extrae el porcentaje numérico de asistencia desde distintos formatos de asignatura.
 */
export function extractCourseAttendanceRate(course) {
  if (!course || typeof course !== 'object') return null;

  const total = Number(course.completedSessions ?? course.totalSessions);
  if (Number.isFinite(total) && total === 0) return null;

  const rawRate =
    course.attendancePercentage ??
    course.attendanceRate ??
    course.asistencia ??
    course.attendance;

  if (rawRate === undefined || rawRate === null) {
    if (Number.isFinite(total) && total > 0 && Number.isFinite(Number(course.attendedSessions))) {
      return Math.max(0, Math.min(100, Math.round((Number(course.attendedSessions) / total) * 1000) / 10));
    }
    return null;
  }

  const parsed = Number(rawRate);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

/**
 * Evalúa el semáforo/estado de asistencia SAT con umbral canónico (70% RI, 70-74.9% Preventivo, >=75% Regular).
 */
export function evaluateAttendanceStatus(percentage, options = {}) {
  const { isJustified = false } = options;

  if (isJustified) {
    return STATUS_METADATA.JUSTIFIED;
  }

  if (percentage === null || percentage === undefined) {
    return STATUS_METADATA.NO_DATA;
  }

  const numericRate = Number(percentage);
  if (!Number.isFinite(numericRate)) {
    return STATUS_METADATA.NO_DATA;
  }

  const riLimit = resolveMinAttendanceThreshold(options);
  const regularMin = riLimit + 5;

  if (numericRate < riLimit) {
    return STATUS_METADATA.RI;
  }
  if (numericRate < regularMin) {
    return STATUS_METADATA.PREVENTIVE;
  }

  return STATUS_METADATA.NORMAL;
}

/**
 * Retorna clases Tailwind listas para barras, badges y textos según porcentaje SAT.
 */
export function getAttendanceColorClasses(percentage, isJustified = false, options = {}) {
  const opts = typeof options === 'object' ? { ...options, isJustified } : { isJustified };
  const { barClass, badgeClass, textClass, status, label } = evaluateAttendanceStatus(
    percentage,
    opts
  );
  return { barClass, badgeClass, textClass, status, label };
}

/**
 * Normaliza un semáforo SAT desde predicción, etiqueta o porcentaje numérico.
 */
export function resolveTrafficLightColor(prediction) {
  if (typeof prediction === 'number') {
    const evaluated = evaluateAttendanceStatus(prediction);
    if (evaluated.status === 'ri') return TRAFFIC_LIGHT_MAP.rojo;
    if (evaluated.status === 'preventive') return TRAFFIC_LIGHT_MAP.amarillo;
    if (evaluated.status === 'no_data') return TRAFFIC_LIGHT_MAP.sin_datos;
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

  if (candidate.includes('sin_datos') || candidate.includes('no_data')) return TRAFFIC_LIGHT_MAP.sin_datos;
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
 * Calcula una explicación heurística descriptiva del riesgo académico basado en registros reales.
 * No emite probabilidades estadísticas de titulación; requiere revisión humana.
 */
export function explainPredictiveRisk(student) {
  const baseHeuristicMeta = {
    isHeuristic: true,
    indicatorType: 'HEURISTIC_EARLY_FOLLOWUP',
    requiresHumanReview: true,
    disclaimer:
      'Indicador heurístico de seguimiento temprano basado en asistencia registrada. No constituye probabilidad estadística de titulación ni decisión académica.',
  };

  if (!student) {
    return {
      ...baseHeuristicMeta,
      trafficLight: 'neutral',
      riskLevel: 'SIN_DATOS',
      score: null,
      factors: ['Sin registros académicos suficientes para evaluación'],
      key: 'sin_datos',
    };
  }

  const courses = Array.isArray(student.enrolledCourses) && student.enrolledCourses.length > 0
    ? student.enrolledCourses
    : (Array.isArray(student.courseAttendance) ? student.courseAttendance : []);

  let worstCourse = null;
  let worstMargin = Infinity;
  let worstRate = null;
  let worstThreshold = DUOC_ATTENDANCE_THRESHOLDS.RI_CRITICAL;

  for (const course of courses) {
    if (course?.paedisJustified) continue;
    const rate = extractCourseAttendanceRate(course);
    if (rate === null) continue;
    const threshold = resolveMinAttendanceThreshold({ minAttendanceRequired: course.minAttendanceRequired });
    const margin = rate - threshold;
    if (margin < worstMargin) {
      worstMargin = margin;
      worstRate = rate;
      worstThreshold = threshold;
      worstCourse = course;
    }
  }

  if (worstRate === null) {
    const hasGeneral = student.attendanceRate !== undefined && student.attendanceRate !== null && Number.isFinite(Number(student.attendanceRate));
    if (!hasGeneral) {
      return {
        ...baseHeuristicMeta,
        trafficLight: 'neutral',
        riskLevel: 'SIN_DATOS',
        score: null,
        factors: ['Sin registros de asistencia para estimar indicador de seguimiento'],
        key: 'sin_datos',
      };
    }
    worstRate = Math.max(0, Math.min(100, Number(student.attendanceRate)));
  }

  const hasConsecutive3 = courses.some((c) => !c?.paedisJustified && Number(c?.consecutiveAbsences ?? 0) >= 3);
  let trafficLight;
  let riskLevel;
  let key;
  let score;
  let factors;

  if (worstRate < worstThreshold || hasConsecutive3) {
    trafficLight = 'red';
    riskLevel = 'ALTO';
    key = 'rojo';
    score = 85;
    factors = [
      `Asistencia crítica${worstCourse?.courseCode ? ` en ${worstCourse.courseCode}` : ''}: ${worstRate}% (bajo umbral RI ${worstThreshold}%)`,
      'Riesgo inminente de Reprobación por Inasistencia',
    ];
    if (hasConsecutive3) {
      factors.push('≥3 inasistencias consecutivas en al menos una asignatura');
    }
  } else if (worstRate < worstThreshold + 5) {
    trafficLight = 'yellow';
    riskLevel = 'MEDIO';
    key = 'amarillo';
    score = 55;
    factors = [
      `Asistencia en zona preventiva${worstCourse?.courseCode ? ` en ${worstCourse.courseCode}` : ''}: ${worstRate}% (${worstThreshold}%-${(worstThreshold + 4.9).toFixed(1)}%)`,
      'Requiere seguimiento docente temprano',
    ];
  } else {
    trafficLight = 'green';
    riskLevel = 'BAJO';
    key = 'verde';
    score = 15;
    factors = [`Asistencia mínima: ${worstRate}% (cumple normativa ≥${worstThreshold + 5}%)`];
  }

  if (student.isPaedis) {
    factors.push('Estudiante adscrito/a a seguimiento PAEDIS (Ley N° 21.719)');
  }

  return {
    ...baseHeuristicMeta,
    trafficLight,
    riskLevel,
    score,
    factors,
    key,
  };
}

/**
 * Determina el nivel de riesgo institucional SAT (Alto, Moderado, Bajo / Normal, Sin datos, o Excepción PAEDIS).
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

  if (percentage === null || percentage === undefined || !Number.isFinite(Number(percentage))) {
    return {
      level: 'NO_DATA',
      riskTier: 'Sin datos',
      label: 'Sin registros de asistencia',
      badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
      textClass: 'text-neutral-600',
      dotClass: 'bg-neutral-400',
      color: 'neutral',
    };
  }

  const pct = Number(percentage);
  const numConsecutive = Number(consecutiveAbsences || 0);
  const riLimit = resolveMinAttendanceThreshold(options);
  const regularMin = riLimit + 5;

  if (pct < riLimit || numConsecutive >= 3 || missedKeySession) {
    return {
      level: 'LEVEL_2_CRITICAL',
      riskTier: 'Alto',
      label: `Alto (Crítico RI <${riLimit}%)`,
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      textClass: 'text-rose-700',
      dotClass: 'bg-rose-500',
      color: 'rose',
    };
  }

  if (pct < regularMin || numConsecutive === 2) {
    return {
      level: 'LEVEL_1_PREVENTIVE',
      riskTier: 'Moderado',
      label: `Moderado (Preventivo ${riLimit}%-${(regularMin - 0.1).toFixed(1)}%)`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      textClass: 'text-amber-700',
      dotClass: 'bg-amber-500',
      color: 'amber',
    };
  }

  return {
    level: 'NONE',
    riskTier: 'Normal',
    label: `Normal / Bajo (≥${regularMin}% Regular)`,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
    color: 'emerald',
  };
}

/**
 * Calcula proyecciones bidireccionales en tiempo real para una asignatura SAT.
 * Separa matemáticamente:
 * - Proyección futura (+1 clase futura): futureAttend = (attended+1)/(total+1), futureMiss = attended/(total+1)
 * - Corrección de registro pasado: pastCorrectionPositive = (attended+1)/total
 * - Manejo seguro de totalSessions === 0 y factibilidad real de recuperación según sesiones pendientes.
 */
export function calculateBidirectionalSimulation(course) {
  if (!course) return null;

  const rawTotal = course.completedSessions ?? course.totalSessions;
  const totalSessions =
    rawTotal === undefined || rawTotal === null
      ? 0
      : Math.max(0, Number(rawTotal));

  const attendedSessions =
    totalSessions === 0
      ? 0
      : Math.max(0, Math.min(totalSessions, Number(course.attendedSessions ?? 0)));

  const currentAbsences = Math.max(0, totalSessions - attendedSessions);
  const minAttendanceRequired = resolveMinAttendanceThreshold({
    minAttendanceRequired: course.minAttendanceRequired,
  });

  const scheduledSessions =
    course.scheduledSessions !== undefined && course.scheduledSessions !== null
      ? Math.max(totalSessions, Number(course.scheduledSessions))
      : null;

  const pendingSessions =
    course.pendingSessions !== undefined && course.pendingSessions !== null
      ? Math.max(0, Number(course.pendingSessions))
      : (scheduledSessions !== null ? Math.max(0, scheduledSessions - totalSessions) : null);

  const computedPct =
    totalSessions === 0
      ? null
      : Math.round((attendedSessions / totalSessions) * 1000) / 10;

  const rawPct =
    totalSessions === 0
      ? null
      : (course.attendancePercentage ??
         course.attendanceRate ??
         course.asistencia ??
         course.attendance ??
         computedPct);

  const currentPct = rawPct === null || rawPct === undefined ? null : Math.round(Number(rawPct) * 10) / 10;
  const consecutiveAbsences = Number(course.consecutiveAbsences || 0);
  const isJustified = Boolean(course.paedisJustified);

  const minRequiredSessions = Math.ceil(totalSessions * (minAttendanceRequired / 100));
  const maxAllowedAbsences = Math.max(0, totalSessions - minRequiredSessions);
  const remainingAllowedAbsences = Math.max(0, maxAllowedAbsences - currentAbsences);
  const exceededAbsences = Math.max(0, currentAbsences - maxAllowedAbsences);

  const currentRisk = calculateAttendanceRiskLevel(currentPct, {
    isJustified,
    consecutiveAbsences,
    missedKeySession: Boolean(course.missedKeySession),
    minAttendanceRequired,
  });

  // 1. Proyección futura (+1 clase futura): cambia tanto attended como total
  const canProjectFuture = pendingSessions === null ? true : pendingSessions > 0;
  const futureTotal = totalSessions + 1;
  const futureAttendAttended = attendedSessions + 1;
  const futureAttendPct = Math.round((futureAttendAttended / futureTotal) * 1000) / 10;
  const futureAttendRisk = calculateAttendanceRiskLevel(futureAttendPct, {
    isJustified,
    consecutiveAbsences: Math.max(0, consecutiveAbsences - 1),
    missedKeySession: false,
    minAttendanceRequired,
  });

  const futureMissAttended = attendedSessions;
  const futureMissPct = Math.round((futureMissAttended / futureTotal) * 1000) / 10;
  const futureMissConsecutive = consecutiveAbsences + 1;
  const futureMissRisk = calculateAttendanceRiskLevel(futureMissPct, {
    isJustified,
    consecutiveAbsences: futureMissConsecutive,
    missedKeySession: Boolean(course.missedKeySession),
    minAttendanceRequired,
  });

  // 2. Corrección de registro pasado (mantiene total constante)
  const pastPosAttended = totalSessions === 0 ? 0 : Math.min(totalSessions, attendedSessions + 1);
  const pastPosPct = totalSessions === 0 ? null : Math.round((pastPosAttended / totalSessions) * 1000) / 10;
  const pastPosAbsences = Math.max(0, totalSessions - pastPosAttended);
  const pastPosConsecutive = Math.max(0, consecutiveAbsences - 1);
  const pastPosRemaining = Math.max(0, maxAllowedAbsences - pastPosAbsences);
  const pastPosRisk = calculateAttendanceRiskLevel(pastPosPct, {
    isJustified,
    consecutiveAbsences: pastPosConsecutive,
    missedKeySession: false,
    minAttendanceRequired,
  });

  const pastNegAttended = totalSessions === 0 ? 0 : Math.max(0, attendedSessions - 1);
  const pastNegPct = totalSessions === 0 ? null : Math.round((pastNegAttended / totalSessions) * 1000) / 10;
  const pastNegAbsences = Math.max(0, totalSessions - pastNegAttended);
  const pastNegConsecutive = consecutiveAbsences + 1;
  const pastNegRemaining = Math.max(0, maxAllowedAbsences - pastNegAbsences);
  const pastNegRisk = calculateAttendanceRiskLevel(pastNegPct, {
    isJustified,
    consecutiveAbsences: pastNegConsecutive,
    missedKeySession: Boolean(course.missedKeySession),
    minAttendanceRequired,
  });
  const negTriggersRi =
    !isJustified &&
    ((pastNegPct !== null && pastNegPct < minAttendanceRequired) || pastNegConsecutive >= 3);

  // 3. Factibilidad real de recuperación mediante clases futuras consecutivas
  let futureClassesNeeded = 0;
  if (totalSessions === 0) {
    futureClassesNeeded = pendingSessions === 0 ? Infinity : 1;
  } else if (currentPct !== null && currentPct < minAttendanceRequired) {
    if (minAttendanceRequired >= 100) {
      futureClassesNeeded = attendedSessions === totalSessions ? 0 : Infinity;
    } else {
      futureClassesNeeded = Math.max(
        0,
        Math.ceil(
          (minAttendanceRequired * totalSessions - 100 * attendedSessions) /
            (100 - minAttendanceRequired)
        )
      );
    }
  }

  const recoveryPossible =
    currentPct !== null && currentPct >= minAttendanceRequired
      ? true
      : pendingSessions !== null
        ? Number.isFinite(futureClassesNeeded) && futureClassesNeeded <= pendingSessions
        : totalSessions === 0
          ? true
          : Number.isFinite(futureClassesNeeded);

  const minRequiredSessions70 = Math.ceil(totalSessions * 0.70);
  const minRequiredSessions75 = Math.ceil(totalSessions * 0.75);
  const neededFor70 = Math.max(0, minRequiredSessions70 - attendedSessions);
  const neededFor75 = Math.max(0, minRequiredSessions75 - attendedSessions);
  const minSessionsFor80 = Math.ceil(totalSessions * 0.8);
  const neededFor80 = Math.max(0, minSessionsFor80 - attendedSessions);

  return {
    hasData: totalSessions > 0,
    totalSessions,
    attendedSessions,
    currentAbsences,
    currentPct,
    consecutiveAbsences,
    isJustified,
    minAttendanceRequired,
    scheduledSessions,
    pendingSessions,
    maxAllowedAbsences,
    remainingAllowedAbsences,
    exceededAbsences,
    currentRisk,
    recoveryPossible,
    futureClassesNeeded,
    futureAttend: {
      available: canProjectFuture,
      attended: futureAttendAttended,
      total: futureTotal,
      pct: futureAttendPct,
      risk: futureAttendRisk,
      deltaPct: currentPct === null ? null : Math.round((futureAttendPct - currentPct) * 10) / 10,
    },
    futureMiss: {
      available: canProjectFuture,
      attended: futureMissAttended,
      total: futureTotal,
      absences: futureTotal - futureMissAttended,
      consecutiveAbsences: futureMissConsecutive,
      pct: futureMissPct,
      risk: futureMissRisk,
      triggersRi: !isJustified && (futureMissPct < minAttendanceRequired || futureMissConsecutive >= 3),
      deltaPct: currentPct === null ? null : Math.round((futureMissPct - currentPct) * 10) / 10,
    },
    pastCorrectionPositive: {
      available: totalSessions > 0 && attendedSessions < totalSessions,
      attended: pastPosAttended,
      total: totalSessions,
      absences: pastPosAbsences,
      consecutiveAbsences: pastPosConsecutive,
      pct: pastPosPct,
      remainingAllowed: pastPosRemaining,
      risk: pastPosRisk,
      deltaPct: currentPct === null || pastPosPct === null ? null : Math.round((pastPosPct - currentPct) * 10) / 10,
    },
    positive: {
      attended: pastPosAttended,
      absences: pastPosAbsences,
      consecutiveAbsences: pastPosConsecutive,
      pct: pastPosPct,
      remainingAllowed: pastPosRemaining,
      risk: pastPosRisk,
      deltaPct: currentPct === null || pastPosPct === null ? null : Math.round((pastPosPct - currentPct) * 10) / 10,
    },
    negative: {
      attended: pastNegAttended,
      absences: pastNegAbsences,
      consecutiveAbsences: pastNegConsecutive,
      pct: pastNegPct,
      remainingAllowed: pastNegRemaining,
      risk: pastNegRisk,
      triggersRi: negTriggersRi,
      deltaPct: currentPct === null || pastNegPct === null ? null : Math.round((pastNegPct - currentPct) * 10) / 10,
    },
    recovery: {
      recoveryPossible,
      futureClassesNeeded,
      minRequiredSessions,
      minRequiredSessions70,
      minRequiredSessions75,
      neededFor70,
      neededFor75,
      neededFor80,
      classesNeededFor70: futureClassesNeeded,
      classesNeededFor75: neededFor75,
      canReach70: recoveryPossible,
      canReach75:
        pendingSessions !== null
          ? attendedSessions + pendingSessions >= Math.ceil((totalSessions + pendingSessions) * 0.75)
          : totalSessions - currentAbsences >= minRequiredSessions75,
      canReach80:
        pendingSessions !== null
          ? attendedSessions + pendingSessions >= Math.ceil((totalSessions + pendingSessions) * 0.8)
          : totalSessions - currentAbsences >= minSessionsFor80,
    },
    status:
      currentRisk.level === 'NO_DATA'
        ? 'no_data'
        : currentRisk.level === 'LEVEL_2_CRITICAL'
          ? 'ri'
          : currentRisk.level === 'LEVEL_1_PREVENTIVE'
            ? 'preventive'
            : 'normal',
    statusLabel: currentRisk.label,
    nextPct: futureMissPct,
    nextRemaining: pastNegRemaining,
    nextTriggersRi: negTriggersRi,
  };
}
