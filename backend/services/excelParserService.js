/**
 * Servicio de Ingesta, Conversión y Parseo de Asignaturas Duoc UC (Excel / Markdown).
 * Soporta archivos .xlsx, .xls y .md con tablas estándar o segmentadas horizontalmente.
 */

const nodeXlsx = require('node-xlsx');
const mongoose = require('mongoose');
const CourseOffering = require('../models/CourseOffering');
const {
  parseDuocSchedule,
  normalizeHeaderKey,
  normalizeRowToOffering,
  mergeUniqueBlocks,
} = require('../utils/courseScheduleUtils');

const normalizeRow = normalizeRowToOffering;

/**
 * Agrupa y consolida filas por sección combinando sus bloques de horario.
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
      mergeUniqueBlocks(existing.bloques, item.bloques);
    }
  }

  return Array.from(map.values());
}

/**
 * Convierte un libro de Excel (.xlsx / .xls) o Buffer a una tabla Markdown.
 */
function xlsxToMarkdown(bufferOrPath, options = {}) {
  const sheets = nodeXlsx.parse(bufferOrPath);
  if (!sheets || sheets.length === 0) return '';

  const sheetName = options.sheet || sheets[0].name;
  const worksheet = options.sheet
    ? sheets.find((s) => s.name === options.sheet)
    : sheets[0];

  if (!worksheet || !worksheet.data || worksheet.data.length === 0) {
    throw new Error(`Hoja "${sheetName}" no encontrada en el libro Excel.`);
  }

  const data = worksheet.data;
  const headers = (data[0] || []).map((h) => String(h || '').trim());
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => ':-:').join(' | ')} |`;

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every((cell) => cell === '' || cell === null || cell === undefined)) continue;
    const formatted = headers.map((_, colIdx) =>
      String(row[colIdx] || '').replace(/\|/g, '\\|').trim()
    );
    rows.push(`| ${formatted.join(' | ')} |`);
  }

  return [headerLine, separatorLine, ...rows].join('\n');
}

/**
 * Parsea un buffer o archivo Excel directamente a filas normalizadas.
 */
function parseXlsxBuffer(buffer, options = {}) {
  const sheets = nodeXlsx.parse(buffer);
  if (!sheets || sheets.length === 0) {
    throw new Error('El archivo Excel no contiene hojas de datos.');
  }

  const sheetName = options.sheet || sheets[0].name;
  const worksheet = options.sheet
    ? sheets.find((s) => s.name === options.sheet)
    : sheets[0];

  if (!worksheet) {
    throw new Error(`Hoja "${sheetName}" no encontrada.`);
  }

  const data = worksheet.data || [];
  if (data.length === 0) {
    return { sheetName, totalRows: 0, offerings: [], consolidated: [] };
  }

  const [headerRow = [], ...dataRows] = data;
  const headers = headerRow.map((h) => String(h || '').trim());

  const rawRows = dataRows.map((row) => {
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx] !== undefined && row[idx] !== null ? row[idx] : '';
    });
    return obj;
  });

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
 * Limpia y extrae celdas de una línea de tabla Markdown.
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
 * Extrae filas limpias de tabla Markdown dentro de un rango de líneas.
 */
function extractCleanMdRows(lines, start, end) {
  const rows = [];
  for (let i = start; i < end; i++) {
    const parts = parseMdRow(lines[i]);
    if (parts && !parts[0].includes('**')) {
      rows.push(parts);
    }
  }
  return rows;
}

const SEGMENT_MARKERS = [
  { key: 'p2_start', min: 20000, max: 25000, includes: ['**Sede**', '**Sigla'] },
  { key: 'p2_col2', min: 29000, max: 32000, includes: ['**Nombre', '**Sección'] },
  { key: 'p2_col3', min: 36000, max: 39000, includes: ['**Horario**', '**Docente'] },
  { key: 'p3_start', min: 44000, max: Infinity, includes: ['**Sede**', '**Sigla**'] },
  { key: 'p3_col2', min: 44000, max: Infinity, includes: ['**Asignatura**', '**Nivel**'] },
  { key: 'p3_col3', min: 44000, max: Infinity, includes: ['**Sección**', '**Horario**'] },
  { key: 'p3_col4', min: 44000, max: Infinity, includes: ['**ASIGNATURA VIRTUAL SINCRONICA**'] },
];

/**
 * Localiza los índices clave de bloques segmentados horizontalmente en el Markdown oficial.
 */
function locateSegmentedHeaderIndices(lines) {
  const indices = {
    p2_start: -1,
    p2_col2: -1,
    p2_col3: -1,
    p3_start: -1,
    p3_col2: -1,
    p3_col3: -1,
    p3_col4: -1,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const matched = SEGMENT_MARKERS.find(
      (marker) =>
        i >= marker.min &&
        i < marker.max &&
        marker.includes.every((token) => line.includes(token))
    );
    if (matched) {
      indices[matched.key] = i + 1;
    }
  }

  return indices;
}

/**
 * Combina segmentos horizontales alineados y los normaliza en CourseOffering.
 */
function zipSegmentedColumns(columns, mapRowFn, defaultPeriodo) {
  if (columns.some((col) => col.length === 0)) return [];
  const minLen = Math.min(...columns.map((col) => col.length));
  const offerings = [];

  for (let i = 0; i < minLen; i++) {
    const raw = mapRowFn(columns.map((col) => col[i]), defaultPeriodo);
    const norm = normalizeRow(raw, defaultPeriodo);
    if (norm.sigla && norm.nombre) {
      offerings.push(norm);
    }
  }

  return offerings;
}

/**
 * Parsea archivos Markdown con chunks segmentados horizontalmente.
 */
function parseSegmentedMarkdown(lines, defaultPeriodo) {
  const idx = locateSegmentedHeaderIndices(lines);
  const allOfferings = [];

  if (idx.p2_start !== -1 && idx.p2_col2 !== -1 && idx.p2_col3 !== -1) {
    const p2End = idx.p3_start !== -1 ? idx.p3_start : lines.length;
    const p2Columns = [
      extractCleanMdRows(lines, idx.p2_start, idx.p2_col2),
      extractCleanMdRows(lines, idx.p2_col2, idx.p2_col3),
      extractCleanMdRows(lines, idx.p2_col3, p2End),
    ];
    allOfferings.push(
      ...zipSegmentedColumns(
        p2Columns,
        ([r1, r2, r3], periodo) => ({
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
          periodo,
        }),
        defaultPeriodo
      )
    );
  }

  if (idx.p3_start !== -1 && idx.p3_col2 !== -1 && idx.p3_col3 !== -1 && idx.p3_col4 !== -1) {
    const p3Columns = [
      extractCleanMdRows(lines, idx.p3_start, idx.p3_col2),
      extractCleanMdRows(lines, idx.p3_col2, idx.p3_col3),
      extractCleanMdRows(lines, idx.p3_col3, idx.p3_col4),
      extractCleanMdRows(lines, idx.p3_col4, lines.length),
    ];
    allOfferings.push(
      ...zipSegmentedColumns(
        p3Columns,
        ([r1, r2, r3, r4], periodo) => ({
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
          periodo,
        }),
        defaultPeriodo
      )
    );
  }

  return {
    totalRows: allOfferings.length,
    offerings: allOfferings,
    consolidated: consolidateSections(allOfferings),
  };
}

/**
 * Parsea tablas Markdown estándar con una sola cabecera unificada.
 */
function parseStandardMarkdown(lines, defaultPeriodo) {
  const offerings = [];
  let headers = null;

  for (const line of lines) {
    const parts = parseMdRow(line);
    if (!parts) continue;

    if (!headers) {
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
 * Parsea un contenido Markdown con tablas simples o segmentadas horizontalmente.
 */
function parseMarkdownTable(markdownContent, options = {}) {
  const defaultPeriodo = options.periodo || '2026 - 002';
  const lines = markdownContent.split(/\r?\n/);

  const headerTokens = ['**Sede**', '**Nombre', '**Horario**', '**Sección**', '**Asignatura**'];
  const headerLocations = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && headerTokens.some((tok) => trimmed.includes(tok));
  });

  if (headerLocations.length >= 3) {
    return parseSegmentedMarkdown(lines, defaultPeriodo);
  }

  return parseStandardMarkdown(lines, defaultPeriodo);
}

/**
 * Limpia asignaturas de un período específico en MongoDB (para evitar duplicados entre años).
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
 * Limpia la totalidad del catálogo oficial.
 */
async function wipeAllData() {
  if (mongoose.connection.readyState === 1) {
    const result = await CourseOffering.deleteMany({});
    console.log(
      `[excelParserService] Catálogo completo vaciado (${result.deletedCount} registros eliminados)`
    );
    return result;
  }
  return { deletedCount: 0, inMemoryOnly: true };
}

/**
 * Procesa un archivo o buffer subido (.xlsx, .xls, .md, .json).
 */
async function processCatalogUpload({
  buffer,
  filename,
  textContent,
  replace = false,
  periodo = '2026 - 002',
}) {
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
    const normalized = jsonList
      .map((r) => normalizeRow(r, periodo))
      .filter((r) => r.sigla && r.nombre);
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
