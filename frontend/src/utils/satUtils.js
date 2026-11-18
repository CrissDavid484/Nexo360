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
