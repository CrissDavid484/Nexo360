/**
 * Utilidades Centralizadas de Horarios y Oferta Académica Duoc UC
 * Centraliza la lógica de bloques horarios, parseo de cadenas y normalización de filas.
 */

/**
 * Tabla estándar de bloques horarios institucionales Duoc UC (Bloques 1 al 18)
 * Horarios Diurnos y Vespertinos oficiales
 */
const STANDARD_BLOCKS = [
  { id: 'b1', start: 8 * 60 + 31, end: 9 * 60 + 10, label: '08:31 - 09:10' },
  { id: 'b2', start: 9 * 60 + 11, end: 9 * 60 + 50, label: '09:11 - 09:50' },
  { id: 'b3', start: 10 * 60 + 1, end: 10 * 60 + 40, label: '10:01 - 10:40' },
  { id: 'b4', start: 10 * 60 + 41, end: 11 * 60 + 20, label: '10:41 - 11:20' },
  { id: 'b5', start: 11 * 60 + 31, end: 12 * 60 + 10, label: '11:31 - 12:10' },
  { id: 'b6', start: 12 * 60 + 11, end: 12 * 60 + 50, label: '12:11 - 12:50' },
  { id: 'b7', start: 13 * 60 + 1, end: 13 * 60 + 40, label: '13:01 - 13:40' },
  { id: 'b7b', start: 13 * 60 + 41, end: 14 * 60 + 20, label: '13:41 - 14:20' },
  { id: 'b8', start: 14 * 60 + 31, end: 15 * 60 + 10, label: '14:31 - 15:10' },
  { id: 'b9', start: 15 * 60 + 11, end: 15 * 60 + 50, label: '15:11 - 15:50' },
  { id: 'b10', start: 16 * 60 + 1, end: 16 * 60 + 40, label: '16:01 - 16:40' },
  { id: 'b11', start: 16 * 60 + 41, end: 17 * 60 + 20, label: '16:41 - 17:20' },
  { id: 'b12', start: 17 * 60 + 31, end: 18 * 60 + 10, label: '17:31 - 18:10' },
  { id: 'b13', start: 18 * 60 + 11, end: 18 * 60 + 50, label: '18:11 - 18:50' },
  { id: 'b14', start: 19 * 60 + 1, end: 19 * 60 + 40, label: '19:01 - 19:40' },
  { id: 'b15', start: 19 * 60 + 41, end: 20 * 60 + 20, label: '19:41 - 20:20' },
  { id: 'b16', start: 20 * 60 + 31, end: 21 * 60 + 10, label: '20:31 - 21:10' },
  { id: 'b17', start: 21 * 60 + 11, end: 21 * 60 + 50, label: '21:11 - 21:50' },
  { id: 'b18', start: 21 * 60 + 51, end: 22 * 60 + 30, label: '21:51 - 22:30' },
];

/**
 * Convierte un string de hora (HH:mm o HH:mm:ss) a minutos desde medianoche
 */
function toMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * Parsea un string de horario Duoc UC (ej: "Lu 8:31:00 - 9:50:00" o "Sa 14:31:00 - 15:50:00")
 * Retorna la lista de bloques de horario identificados
 */
function parseDuocSchedule(scheduleStr, sala = 'ONLINE') {
  if (!scheduleStr || typeof scheduleStr !== 'string') return [];

  const trimmed = scheduleStr.trim();
  if (trimmed === '' || trimmed.startsWith('0:00:00') || trimmed.startsWith('00:00:00')) {
    return [];
  }

  const dayMap = {
    lu: 'Lunes',
    ma: 'Martes',
    mi: 'Miércoles',
    ju: 'Jueves',
    vi: 'Viernes',
    sa: 'Sábado',
    do: 'Domingo',
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    miércoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    sábado: 'Sábado',
  };

  const match = trimmed.match(
    /^([a-zA-ZáéíóúÁÉÍÓÚ]+)\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/
  );

  if (!match) return [];

  const day = dayMap[match[1].toLowerCase()] || 'Lunes';
  const startMin = toMinutes(match[2]);
  const endMin = toMinutes(match[3]);

  const matched = [];
  for (const blk of STANDARD_BLOCKS) {
    if (Math.max(startMin, blk.start) < Math.min(endMin, blk.end)) {
      matched.push({
        dia: day,
        bloqueId: blk.id,
        horaInicio: match[2],
        horaFin: match[3],
        salaCorta: sala || 'ONLINE',
      });
    }
  }

  if (matched.length === 0) {
    matched.push({
      dia: day,
      bloqueId: startMin < 12 * 60 ? 'b1' : startMin < 17 * 60 ? 'b8' : 'b12',
      horaInicio: match[2],
      horaFin: match[3],
      salaCorta: sala || 'ONLINE',
    });
  }

  return matched;
}

/**
 * Normaliza nombres de columnas a claves canónicas
 */
function normalizeHeaderKey(key) {
  if (!key) return '';
  const clean = key
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[*_#]/g, '')
    .trim();

  if (clean.includes('sede')) return 'sede';
  if (clean.includes('carrera')) return 'carrera';
  if (clean.includes('plan')) return 'plan';
  if (clean.includes('jornada')) return 'jornada';
  if (clean.includes('periodo')) return 'periodo';
  if (clean.includes('modalidad') || clean.includes('virtual') || clean.includes('sincronica')) return 'modalidad';
  if (clean.includes('siglaeq') || clean.includes('sigla eq') || clean.includes('equivalente')) return 'siglaEq';
  if (clean.includes('sigla')) return 'sigla';
  if (clean.includes('nombre') || clean.includes('asignatura')) return 'nombre';
  if (clean.includes('nivel') || clean.includes('semestre')) return 'nivel';
  if (clean.includes('seccion')) return 'seccion';
  if (clean.includes('horario')) return 'horario';
  if (clean.includes('docente') || clean.includes('profesor')) return 'docente';
  if (clean.includes('credito')) return 'creditos';
  if (clean.includes('cuposdisp') || clean.includes('cupos disp') || clean.includes('disponible')) return 'cuposDisponibles';
  if (clean.includes('cupototal') || clean.includes('cupo total') || clean.includes('cupo')) return 'cuposTotales';

  return clean;
}

/**
 * Sanitiza celdas de Excel para prevenir CSV / Formula Injection y XSS
 */
function sanitizeCell(val, maxLen = 250) {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = str.replace(/^[=+\-@\t\r]+/, '');
  }
  return str.replace(/[<>]/g, '').slice(0, maxLen).trim();
}

/**
 * Normaliza un objeto fila crudo en el esquema CourseOffering
 */
function normalizeRowToOffering(rawRow, defaultPeriodo = '2026 - 002') {
  if (!rawRow || typeof rawRow !== 'object') return {};

  const row = {};
  for (const [k, v] of Object.entries(rawRow)) {
    const canonicalKey = normalizeHeaderKey(k);
    const sanitizedVal = sanitizeCell(v);
    if (canonicalKey) {
      row[canonicalKey] = sanitizedVal;
    } else {
      row[k] = sanitizedVal;
    }
  }

  const sede = (row.sede || 'ALAMEDA').toUpperCase();
  const carrera = (row.carrera || 'INGENIERÍA EN INFORMÁTICA').toUpperCase();
  const plan = row.plan || '1446815';
  const jornada = row.jornada || (row.seccion && row.seccion.endsWith('V') ? 'Vespertino' : 'Diurno');
  const periodo = row.periodo || defaultPeriodo;
  const sigla = (row.sigla || '').toUpperCase();
  const siglaEq = (row.siglaEq || '').toUpperCase();
  const nombre = (row.nombre || '').toUpperCase();
  const nivel = row.nivel || 'Optativos';
  const seccion = (row.seccion || (sigla ? `${sigla}-001D` : '')).toUpperCase();
  const horarioRaw = row.horario || '';
  const docente = (row.docente || 'DOCENTE ASIGNADO').toUpperCase();
  const modalidad = (row.modalidad || 'ONLINE SINCRONA').toUpperCase();

  const isDeporte =
    nivel.toLowerCase().includes('deport') ||
    nombre.toLowerCase().includes('deporte') ||
    nombre.toLowerCase().includes('natacion');
  const creditos = Number(row.creditos) || (isDeporte ? 0 : 10);
  const tipo = isDeporte
    ? 'deportivo'
    : nivel.toLowerCase().includes('optativ')
    ? 'optativo'
    : 'obligatorio';

  const sala = modalidad.includes('ONLINE') ? 'ONLINE' : 'AL-LAB';
  const bloques = parseDuocSchedule(horarioRaw, sala);

  return {
    sede,
    carrera,
    plan,
    jornada,
    periodo,
    sigla,
    siglaEq,
    nombre,
    nivel,
    creditos,
    tipo,
    seccion,
    horarioRaw,
    docente,
    modalidad,
    cuposTotales: Number(row.cuposTotales) || 30,
    cuposDisponibles: Number(row.cuposDisponibles) || Math.floor(Math.random() * 18) + 2,
    bloques,
  };
}

/**
 * Combina bloques horarios evitando duplicados por día y bloqueId.
 */
function mergeUniqueBlocks(targetBlocks, incomingBlocks = []) {
  for (const blk of incomingBlocks || []) {
    if (!targetBlocks.some((b) => b.dia === blk.dia && b.bloqueId === blk.bloqueId)) {
      targetBlocks.push(blk);
    }
  }
}

module.exports = {
  STANDARD_BLOCKS,
  toMinutes,
  parseDuocSchedule,
  normalizeHeaderKey,
  sanitizeCell,
  normalizeRowToOffering,
  normalizeRow: normalizeRowToOffering,
  mergeUniqueBlocks,
};
