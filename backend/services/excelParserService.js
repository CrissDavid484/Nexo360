/**
 * Servicio de Ingesta, Conversión y Parseo de Asignaturas Duoc UC (Excel / Markdown)
 * Soporta archivos .xlsx, .xls y .md con tablas estándar o segmentadas horizontalmente.
 */

const XLSX = require('xlsx');
const mongoose = require('mongoose');
const CourseOffering = require('../models/CourseOffering');
const {
  STANDARD_BLOCKS,
  toMinutes,
  parseDuocSchedule,
  normalizeHeaderKey,
  normalizeRowToOffering,
} = require('../utils/courseScheduleUtils');

const normalizeRow = normalizeRowToOffering;

/**
 * Agrupa y consolida filas por sección combinando sus bloques de horario
 */
function consolidateSections(offerings) {
  const map = new Map();

  for (const item of offerings) {
    if (!item.sigla || !item.seccion) continue;
    const key = `${item.carrera}||${item.sigla}||${item.seccion}`;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        horarios: item.horarioRaw ? [item.horarioRaw] : [],
        bloques: [...(item.bloques || [])],
      });
    } else {
      const existing = map.get(key);
      if (item.horarioRaw && !existing.horarios.includes(item.horarioRaw)) {
        existing.horarios.push(item.horarioRaw);
        existing.horarioRaw = existing.horarios.join(' / ');
      }
      for (const blk of item.bloques || []) {
        if (!existing.bloques.some((b) => b.dia === blk.dia && b.bloqueId === blk.bloqueId)) {
          existing.bloques.push(blk);
        }
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Convierte un libro de Excel (.xlsx / .xls) o Buffer a una tabla Markdown
 */
function xlsxToMarkdown(bufferOrPath, options = {}) {
  let workbook;
  if (Buffer.isBuffer(bufferOrPath)) {
    workbook = XLSX.read(bufferOrPath, { type: 'buffer' });
  } else {
    workbook = XLSX.readFile(bufferOrPath);
  }

  const sheetName = options.sheet || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Hoja "${sheetName}" no encontrada en el libro Excel.`);
  }

  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!data || data.length === 0) return '';

  const headers = data[0].map((h) => String(h || '').trim());
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => ':-:').join(' | ')} |`;

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.every((cell) => cell === '' || cell === null || cell === undefined)) continue;
    const formatted = headers.map((_, colIdx) => String(row[colIdx] || '').replace(/\|/g, '\\|').trim());
    rows.push(`| ${formatted.join(' | ')} |`);
  }

  return [headerLine, separatorLine, ...rows].join('\n');
}

/**
 * Parsea un buffer o archivo Excel directamente a filas normalizadas
 */
function parseXlsxBuffer(buffer, options = {}) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = options.sheet || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Hoja "${sheetName}" no encontrada.`);
  }

  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const normalized = rawRows
    .map((r) => normalizeRow(r, options.periodo || '2026 - 002'))
    .filter((r) => r.sigla && r.nombre);

  return {
    sheetName,
    totalRows: rawRows.length,
    offerings: normalized,
    consolidated: consolidateSections(normalized),
  };
}

/**
 * Limpia y extrae celdas de una línea de tabla Markdown
 */
function parseMdRow(line) {
  if (!line || !line.trim().startsWith('|')) return null;
  const trimmed = line.trim();
  if (trimmed.includes(':-:') || trimmed.includes(':--') || trimmed.includes('--:')) return null;
  if (trimmed.includes('**RESULTADOS') || trimmed.includes('![](data:image')) return null;

  const parts = trimmed.split('|').slice(1, -1).map((s) => s.trim());
  if (parts.length === 0 || parts.every((p) => p === '')) return null;
  return parts;
}

/**
 * Parsea un contenido Markdown con tablas simples o segmentadas horizontalmente
 */
function parseMarkdownTable(markdownContent, options = {}) {
  const defaultPeriodo = options.periodo || '2026 - 002';
  const lines = markdownContent.split(/\r?\n/);

  // Detectar chunks segmentados o tablas convencionales
  // Buscamos patrones de cabecera como **Sede**, **Nombre Asignatura**, **Horario**
  const headerLocations = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith('|') && (l.includes('**Sede**') || l.includes('**Nombre') || l.includes('**Horario**') || l.includes('**Sección**') || l.includes('**Asignatura**'))) {
      headerLocations.push({ lineIndex: i, text: l });
    }
  }

  // Si encontramos la estructura multi-chunk como en Alameda 2026
  // (Part 2: Sede..Sigla en ~23149, Nombre..Sección en ~30261, Horario..Modalidad en ~37373)
  const isHorizontallySegmented = headerLocations.length >= 3;

  if (isHorizontallySegmented) {
    return parseSegmentedMarkdown(lines, defaultPeriodo);
  }

  // Fallback: tabla Markdown estándar única
  return parseStandardMarkdown(lines, defaultPeriodo);
}

/**
 * Parsea archivos Markdown con chunks segmentados horizontalmente
 */
function parseSegmentedMarkdown(lines, defaultPeriodo) {
  const allOfferings = [];

  // Helper para extraer filas limpias de un rango
  const getCleanRows = (start, end) => {
    const rows = [];
    for (let i = start; i < end; i++) {
      const parts = parseMdRow(lines[i]);
      if (parts && !parts[0].includes('**')) {
        rows.push(parts);
      }
    }
    return rows;
  };

  // Localizar índices clave
  let p2_start = -1;
  let p2_col2 = -1;
  let p2_col3 = -1;
  let p3_start = -1;
  let p3_col2 = -1;
  let p3_col3 = -1;
  let p3_col4 = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (i >= 20000 && i < 25000 && l.includes('**Sede**') && l.includes('**Sigla')) {
      p2_start = i + 1;
    } else if (i >= 29000 && i < 32000 && l.includes('**Nombre') && l.includes('**Sección')) {
      p2_col2 = i + 1;
    } else if (i >= 36000 && i < 39000 && l.includes('**Horario**') && l.includes('**Docente')) {
      p2_col3 = i + 1;
    } else if (i >= 44000 && l.includes('**Sede**') && l.includes('**Sigla**')) {
      p3_start = i + 1;
    } else if (i >= 44000 && l.includes('**Asignatura**') && l.includes('**Nivel**')) {
      p3_col2 = i + 1;
    } else if (i >= 44000 && l.includes('**Sección**') && l.includes('**Horario**')) {
      p3_col3 = i + 1;
    } else if (i >= 44000 && l.includes('**ASIGNATURA VIRTUAL SINCRONICA**')) {
      p3_col4 = i + 1;
    }
  }

  // 1. Reconstruir Oferta Central Alameda (Part 2: 7,087 filas alineadas)
  if (p2_start !== -1 && p2_col2 !== -1 && p2_col3 !== -1) {
    const c1 = getCleanRows(p2_start, p2_col2);
    const c2 = getCleanRows(p2_col2, p2_col3);
    const c3 = getCleanRows(p2_col3, p3_start !== -1 ? p3_start : lines.length);

    const minLen = Math.min(c1.length, c2.length, c3.length);
    for (let i = 0; i < minLen; i++) {
      const r1 = c1[i];
      const r2 = c2[i];
      const r3 = c3[i];

      const raw = {
        sede: r1[0],
        carrera: r1[1],
        plan: r1[2],
        jornada: r1[3],
        sigla: r1[4],
        nombre: r2[0],
        nivel: r2[1],
        seccion: r2[2],
        horario: r3[0],
        docente: r3[1],
        modalidad: r3[2] || 'ONLINE SINCRONA',
        periodo: defaultPeriodo,
      };

      const norm = normalizeRow(raw, defaultPeriodo);
      if (norm.sigla && norm.nombre) {
        allOfferings.push(norm);
      }
    }
  }

  // 2. Reconstruir Oferta Electivos Virtuales (Part 3: 87 filas alineadas)
  if (p3_start !== -1 && p3_col2 !== -1 && p3_col3 !== -1 && p3_col4 !== -1) {
    const p3_c1 = getCleanRows(p3_start, p3_col2);
    const p3_c2 = getCleanRows(p3_col2, p3_col3);
    const p3_c3 = getCleanRows(p3_col3, p3_col4);
    const p3_c4 = getCleanRows(p3_col4, lines.length);

    const minLen3 = Math.min(p3_c1.length, p3_c2.length, p3_c3.length, p3_c4.length);
    for (let i = 0; i < minLen3; i++) {
      const r1 = p3_c1[i];
      const r2 = p3_c2[i];
      const r3 = p3_c3[i];
      const r4 = p3_c4[i];

      const raw = {
        sede: r1[0],
        carrera: r1[1],
        plan: r1[2],
        jornada: r1[3],
        sigla: r1[4],
        nombre: r2[0],
        nivel: r2[1],
        seccion: r3[0],
        horario: r3[1],
        docente: r3[2],
        modalidad: r4[0] || 'ONLINE',
        periodo: defaultPeriodo,
      };

      const norm = normalizeRow(raw, defaultPeriodo);
      if (norm.sigla && norm.nombre) {
        allOfferings.push(norm);
      }
    }
  }

  return {
    totalRows: allOfferings.length,
    offerings: allOfferings,
    consolidated: consolidateSections(allOfferings),
  };
}

/**
 * Parsea tablas Markdown estándar con una sola cabecera unificada
 */
function parseStandardMarkdown(lines, defaultPeriodo) {
  const offerings = [];
  let headers = null;

  for (const line of lines) {
    const parts = parseMdRow(line);
    if (!parts) continue;

    if (!headers) {
      // Primera fila es el encabezado
      headers = parts.map((part) => normalizeHeaderKey(part));
      continue;
    }

    const row = {};
    headers.forEach((h, idx) => {
      if (h) row[h] = parts[idx] || '';
    });

    const norm = normalizeRow(row, defaultPeriodo);
    if (norm.sigla && norm.nombre) {
      offerings.push(norm);
    }
  }

  return {
    totalRows: offerings.length,
    offerings,
    consolidated: consolidateSections(offerings),
  };
}

/**
 * Limpia asignaturas de un período específico en MongoDB (para evitar duplicados entre años)
 */
async function wipePeriodData(periodo) {
  if (mongoose.connection.readyState === 1) {
    const safePeriodo =
      typeof periodo === 'string'
        ? periodo.trim().replace(/[\r\n\x00-\x1F]/g, '').slice(0, 50)
        : '2026 - 002';
    const result = await CourseOffering.deleteMany({ periodo: { $eq: safePeriodo } });
    console.log(
      `[excelParserService] Eliminadas ${result.deletedCount} asignaturas del período "${encodeURIComponent(
        safePeriodo
      )}"`
    );
    return result;
  }
  return { deletedCount: 0, inMemoryOnly: true };
}

/**
 * Limpia la totalidad del catálogo oficial
 */
async function wipeAllData() {
  if (mongoose.connection.readyState === 1) {
    const result = await CourseOffering.deleteMany({});
    console.log(`[excelParserService] Catálogo completo vaciado (${result.deletedCount} registros eliminados)`);
    return result;
  }
  return { deletedCount: 0, inMemoryOnly: true };
}

/**
 * Procesa un archivo o buffer subido (.xlsx, .xls, .md, .json)
 * Con soporte para reemplazo automático de períodos ('replace: true')
 */
async function processCatalogUpload({ buffer, filename, textContent, replace = false, periodo = '2026 - 002' }) {
  const isXlsx = filename && (filename.endsWith('.xlsx') || filename.endsWith('.xls'));
  const isMd = filename && (filename.endsWith('.md') || filename.endsWith('.markdown'));
  const isJson = filename && filename.endsWith('.json');

  let parsedResult;

  if (isXlsx && buffer) {
    parsedResult = parseXlsxBuffer(buffer, { periodo });
  } else if (isMd || textContent) {
    const content = textContent || (buffer ? buffer.toString('utf8') : '');
    parsedResult = parseMarkdownTable(content, { periodo });
  } else if (isJson) {
    const jsonStr = textContent || (buffer ? buffer.toString('utf8') : '[]');
    const jsonList = JSON.parse(jsonStr);
    const normalized = jsonList.map((r) => normalizeRow(r, periodo)).filter((r) => r.sigla && r.nombre);
    parsedResult = {
      totalRows: normalized.length,
      offerings: normalized,
      consolidated: consolidateSections(normalized),
    };
  } else {
    throw new Error('Formato de archivo no soportado. Debe ser .xlsx, .xls, .md o .json');
  }

  if (replace) {
    await wipePeriodData(periodo);
  }

  return parsedResult;
}

module.exports = {
  STANDARD_BLOCKS,
  toMinutes,
  parseDuocSchedule,
  normalizeHeaderKey,
  normalizeRow,
  normalizeRowToOffering,
  consolidateSections,
  xlsxToMarkdown,
  parseXlsxBuffer,
  parseMarkdownTable,
  wipePeriodData,
  wipeAllData,
  processCatalogUpload,
};
