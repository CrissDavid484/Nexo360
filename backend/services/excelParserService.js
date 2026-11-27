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

const INVALID_ROW_MESSAGE = 'Fila sin sigla o nombre de asignatura.';

/** Una oferta es importable solo si trae sigla y nombre. */
function isValidOffering(offering) {
  return Boolean(offering && offering.sigla && offering.nombre);
}

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

  const normalized = [];
  const rejected = [];
  rawRows.forEach((raw, idx) => {
    if (Object.values(raw).every((v) => String(v).trim() === '')) return;
    const norm = normalizeRow(raw, options.periodo || '2026 - 002');
    if (isValidOffering(norm)) {
      normalized.push(norm);
    } else {
      rejected.push({ row: idx + 2, message: INVALID_ROW_MESSAGE });
    }
  });

  return {
    sheetName,
    totalRows: rawRows.length,
    offerings: normalized,
    rejected,
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
    if (isValidOffering(norm)) {
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
  const rejected = [];
  let headers = null;

  for (const [lineIdx, line] of lines.entries()) {
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
    if (isValidOffering(norm)) {
      offerings.push(norm);
    } else {
      rejected.push({ row: lineIdx + 1, message: INVALID_ROW_MESSAGE });
    }
  }

  return {
    totalRows: offerings.length,
    offerings,
    rejected,
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
 * Decodifica entidades XML básicas y referencias numéricas.
 */
function decodeXmlEntities(str) {
  return String(str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number.parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function stripTagsAndClean(raw) {
  const str = String(raw || '');
  let withoutTags = '';
  let inTag = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '<') {
      inTag = true;
    } else if (ch === '>') {
      inTag = false;
    } else if (!inTag) {
      withoutTags += ch;
    }
  }
  return decodeXmlEntities(withoutTags)
    .replace(/\r?\n+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function parseGenericXmlElements(xml, filterTagName = null) {
  const elements = [];
  if (!xml || typeof xml !== 'string') return elements;
  const targetLower = filterTagName ? filterTagName.toLowerCase() : null;
  let i = 0;
  const len = xml.length;

  while (i < len) {
    const openIdx = xml.indexOf('<', i);
    if (openIdx === -1) break;

    const tagCloseIdx = xml.indexOf('>', openIdx);
    if (tagCloseIdx === -1) break;

    const fullTag = xml.slice(openIdx + 1, tagCloseIdx).trim();
    if (fullTag.startsWith('/') || fullTag.startsWith('?') || fullTag.startsWith('!')) {
      i = tagCloseIdx + 1;
      continue;
    }

    const spaceIdx = fullTag.search(/\s/);
    const tagNameWithNs = (spaceIdx === -1 ? fullTag : fullTag.slice(0, spaceIdx)).replace(/\/$/, '');
    const colonIdx = tagNameWithNs.indexOf(':');
    const localName = colonIdx === -1 ? tagNameWithNs : tagNameWithNs.slice(colonIdx + 1);

    if (targetLower && localName.toLowerCase() !== targetLower) {
      i = openIdx + 1;
      continue;
    }

    const attrs = spaceIdx === -1 ? '' : fullTag.slice(spaceIdx).replace(/\/$/, '').trim();

    if (fullTag.endsWith('/')) {
      elements.push({ tag: localName, fullTag: tagNameWithNs, attrs, inner: '' });
      i = tagCloseIdx + 1;
      continue;
    }

    const closingTag = `</${tagNameWithNs}>`.toLowerCase();
    const fallbackClosing = `</${localName}>`.toLowerCase();
    const lowerSub = xml.toLowerCase();
    let closeIdx = lowerSub.indexOf(closingTag, tagCloseIdx);
    let closeLen = closingTag.length;
    if (closeIdx === -1) {
      closeIdx = lowerSub.indexOf(fallbackClosing, tagCloseIdx);
      closeLen = fallbackClosing.length;
    }

    if (closeIdx === -1) {
      i = tagCloseIdx + 1;
      continue;
    }

    const inner = xml.slice(tagCloseIdx + 1, closeIdx);
    elements.push({ tag: localName, fullTag: tagNameWithNs, attrs, inner });
    i = closeIdx + closeLen;
  }

  return elements;
}

function parseSpreadsheetMlRows(xml) {
  const rowBlocks = parseGenericXmlElements(xml, 'Row');
  if (!rowBlocks || rowBlocks.length === 0) return null;

  const matrix = [];
  for (const rowBlock of rowBlocks) {
    const row = [];
    const cellBlocks = parseGenericXmlElements(rowBlock.inner, 'Cell');
    for (const cellBlock of cellBlocks) {
      const idxAttr = cellBlock.attrs.match(/Index\s*=\s*["'](\d+)["']/i);
      if (idxAttr) {
        const rawIdx = idxAttr[1];
        const targetIdx = Math.max(0, Number.parseInt(rawIdx, 10) - 1);
        while (row.length < targetIdx) row.push('');
      }
      const dataBlocks = parseGenericXmlElements(cellBlock.inner, 'Data');
      const text = dataBlocks.length > 0 ? dataBlocks[0].inner : cellBlock.inner;
      row.push(stripTagsAndClean(text));
    }
    if (row.some((v) => v !== '')) matrix.push(row);
  }
  return matrix.length >= 2 ? matrix : null;
}

function extractXmlAttributes(attrString) {
  const result = {};
  if (!attrString || typeof attrString !== 'string') return result;

  let i = 0;
  const len = attrString.length;
  while (i < len) {
    while (i < len && attrString.charCodeAt(i) <= 32) i++;
    if (i >= len) break;

    const nameStart = i;
    while (i < len && attrString[i] !== '=' && attrString.charCodeAt(i) > 32) i++;
    const rawKey = attrString.slice(nameStart, i);

    while (i < len && attrString.charCodeAt(i) <= 32) i++;
    if (i >= len || attrString[i] !== '=') break;
    i++;
    while (i < len && attrString.charCodeAt(i) <= 32) i++;
    if (i >= len) break;

    const quote = attrString[i];
    let val = '';
    if (quote === '"' || quote === "'") {
      i++;
      const valStart = i;
      while (i < len && attrString[i] !== quote) i++;
      val = attrString.slice(valStart, i);
      if (i < len && attrString[i] === quote) i++;
    } else {
      const valStart = i;
      while (i < len && attrString.charCodeAt(i) > 32 && attrString[i] !== '>') i++;
      val = attrString.slice(valStart, i);
    }

    const key = rawKey.includes(':') ? rawKey.split(':').pop() : rawKey;
    if (key) {
      result[key] = decodeXmlEntities(val).replace(/\|/g, '\\|').trim();
    }
  }
  return result;
}

function stripXmlCommentsAndProlog(xml) {
  let s = String(xml || '');
  while (true) {
    const start = s.indexOf('<?');
    if (start === -1) break;
    const end = s.indexOf('?>', start + 2);
    if (end === -1) break;
    s = s.slice(0, start) + s.slice(end + 2);
  }
  while (true) {
    const start = s.indexOf('<!--');
    if (start === -1) break;
    const end = s.indexOf('-->', start + 4);
    if (end === -1) break;
    s = s.slice(0, start) + s.slice(end + 3);
  }
  return s.trim();
}

function parseGenericXmlRecords(xml) {
  const cleaned = stripXmlCommentsAndProlog(xml);
  let body = cleaned;
  if (cleaned.startsWith('<') && cleaned.endsWith('>')) {
    const firstClose = cleaned.indexOf('>');
    const lastOpen = cleaned.lastIndexOf('</');
    if (firstClose !== -1 && lastOpen > firstClose) {
      body = cleaned.slice(firstClose + 1, lastOpen);
    }
  }

  const preferredNames = ['curso', 'asignatura', 'oferta', 'offering', 'course', 'section', 'seccion', 'row', 'record', 'registro', 'item'];
  const children = parseGenericXmlElements(body);
  if (children.length === 0) return [];

  const tagCounts = new Map();
  for (const c of children) {
    tagCounts.set(c.tag, (tagCounts.get(c.tag) || 0) + 1);
  }

  let recordTag = children.find((c) => preferredNames.includes(c.tag.toLowerCase()))?.tag;
  if (!recordTag) {
    let bestCount = 0;
    for (const [tag, cnt] of tagCounts.entries()) {
      if (cnt > bestCount) {
        bestCount = cnt;
        recordTag = tag;
      }
    }
  }

  const recordNodes = children.filter((c) => c.tag === recordTag);
  const hasNestedContainer =
    recordNodes.length === 1 &&
    !preferredNames.includes(recordTag.toLowerCase()) &&
    recordNodes[0].inner.includes('<');

  if (hasNestedContainer) {
    const nested = parseGenericXmlRecords(`<${recordNodes[0].tag}>${recordNodes[0].inner}</${recordNodes[0].tag}>`);
    if (nested.length > 0) return nested;
  }

  return recordNodes.map((node) => {
    const obj = { ...extractXmlAttributes(node.attrs) };
    const fields = parseGenericXmlElements(node.inner);
    for (const field of fields) {
      const val = stripTagsAndClean(field.inner);
      if (val !== '' || !(field.tag in obj)) {
        obj[field.tag] = val;
      }
    }
    return obj;
  });
}

/**
 * Convierte un archivo o texto XML (SpreadsheetML de Excel o XML estructurado con nodos de curso/oferta)
 * a una tabla Markdown estándar lista para parseMarkdownTable.
 */
function xmlToMarkdown(xmlContent) {
  const xml = String(xmlContent || '').trim();
  if (!xml) return '';

  const spreadsheetRows = parseSpreadsheetMlRows(xml);
  if (spreadsheetRows) {
    const [headers, ...dataRows] = spreadsheetRows;
    const cleanHeaders = headers.map((h, i) => h || `Col${i + 1}`);
    const headerLine = `| ${cleanHeaders.join(' | ')} |`;
    const separatorLine = `| ${cleanHeaders.map(() => ':-:').join(' | ')} |`;
    const bodyLines = dataRows.map((row) => {
      const cells = cleanHeaders.map((_, idx) => String(row[idx] || '').trim());
      return `| ${cells.join(' | ')} |`;
    });
    return [headerLine, separatorLine, ...bodyLines].join('\n');
  }

  const records = parseGenericXmlRecords(xml);
  if (!records || records.length === 0) return '';

  const headers = [];
  const headerSet = new Set();
  for (const rec of records) {
    for (const key of Object.keys(rec)) {
      if (!headerSet.has(key)) {
        headerSet.add(key);
        headers.push(key);
      }
    }
  }
  if (headers.length === 0) return '';

  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => ':-:').join(' | ')} |`;
  const bodyLines = records.map((rec) => {
    const cells = headers.map((h) => String(rec[h] || '').trim());
    return `| ${cells.join(' | ')} |`;
  });

  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

/**
 * Procesa un archivo o buffer subido (.xlsx, .xls, .xml, .md, .json).
 */
async function processCatalogUpload({
  buffer,
  filename,
  textContent,
  replace = false,
  periodo = '2026 - 002',
}) {
  const lowerName = String(filename || '').toLowerCase();
  const isXlsx = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
  const isXml = lowerName.endsWith('.xml');
  const isMd = lowerName.endsWith('.md') || lowerName.endsWith('.markdown');
  const isJson = lowerName.endsWith('.json');

  let parsedResult;

  if (isXlsx && buffer) {
    parsedResult = parseXlsxBuffer(buffer, { periodo });
  } else if (isXml) {
    const xmlStr = textContent || (buffer ? buffer.toString('utf8') : '');
    const mdContent = xmlToMarkdown(xmlStr);
    parsedResult = parseMarkdownTable(mdContent, { periodo });
  } else if (isMd || textContent) {
    const content = textContent || (buffer ? buffer.toString('utf8') : '');
    parsedResult = parseMarkdownTable(content, { periodo });
  } else if (isJson) {
    const jsonStr = textContent || (buffer ? buffer.toString('utf8') : '[]');
    const jsonList = JSON.parse(jsonStr);
    const normalized = jsonList.map((r) => normalizeRow(r, periodo)).filter(isValidOffering);
    parsedResult = {
      totalRows: normalized.length,
      offerings: normalized,
      consolidated: consolidateSections(normalized),
    };
  } else {
    throw new Error('Formato de archivo no soportado. Debe ser .xml, .xlsx, .xls, .md o .json');
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
  xmlToMarkdown,
  parseXlsxBuffer,
  parseMarkdownTable,
  wipePeriodData,
  wipeAllData,
  processCatalogUpload,
  isValidOffering,
  INVALID_ROW_MESSAGE,
};
