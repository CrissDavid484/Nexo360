const mongoose = require('mongoose');
const CourseOffering = require('../models/CourseOffering');
const excelParserService = require('./excelParserService');
const { escapeRegex } = require('../utils/validationUtils');
const {
  parseDuocSchedule,
  normalizeRowToOffering,
  mergeUniqueBlocks,
} = require('../utils/courseScheduleUtils');

let alamedaSeedData = null;
try {
  alamedaSeedData = require('../data/alameda2026Seed.json');
} catch {
  alamedaSeedData = null;
}

/**
 * Carga síncrona del catálogo semilla oficial Alameda 2026-002 (con fallback lazy si no existiera).
 */
function loadDefaultSeedOfferings() {
  if (Array.isArray(alamedaSeedData) && alamedaSeedData.length > 0) {
    return [...alamedaSeedData];
  }
  const fallbackRows = require('../data/seedCourseRows.json');
  return fallbackRows.map((row) => normalizeRowToOffering(row));
}

// Almacén en memoria inicializado síncronamente sin promesas flotantes al importar el módulo
let inMemoryCourses = loadDefaultSeedOfferings();

/**
 * Agrupa una lista de ofertas planas (secciones) en la estructura jerárquica esperada por el Simulador SAP.
 */
function groupOfferingsIntoCourses(offerings) {
  const map = new Map();

  for (const item of offerings) {
    if (!item.sigla || !item.nombre) continue;

    if (!map.has(item.sigla)) {
      map.set(item.sigla, {
        sigla: item.sigla,
        siglaEq: item.siglaEq || '',
        nombre: item.nombre,
        creditos: item.creditos,
        tipo: item.tipo || 'optativo',
        nivel: item.nivel,
        carrera: item.carrera,
        plan: item.plan,
        periodo: item.periodo,
        secciones: [],
      });
    }

    const course = map.get(item.sigla);
    const existingSec = course.secciones.find((s) => s.seccion === item.seccion);

    if (existingSec) {
      mergeUniqueBlocks(existingSec.bloques, item.bloques);
    } else {
      course.secciones.push({
        seccion: item.seccion,
        cuposTotales: item.cuposTotales || 30,
        cuposDisponibles: item.cuposDisponibles ?? 12,
        sala: item.modalidad || 'ONLINE SINCRONA',
        profesor: item.docente || 'Docente Duoc UC',
        horarioTexto: item.horarioRaw || 'Por definir',
        bloques: [...(item.bloques || [])],
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Consulta ofertas filtradas desde MongoDB o desde el respaldo en memoria (DRY).
 */
async function fetchMatchingOfferings({ carrera, periodo = '2026 - 002', jornada } = {}) {
  let items = inMemoryCourses;
  const safeCarrera = typeof carrera === 'string' ? escapeRegex(carrera.trim()) : '';
  const safePeriodo = typeof periodo === 'string' ? periodo.trim().slice(0, 50) : '2026 - 002';
  const safeJornada = typeof jornada === 'string' ? escapeRegex(jornada.trim()) : '';

  if (mongoose.connection.readyState === 1) {
    try {
      const query = {};
      if (safeCarrera) query.carrera = { $regex: safeCarrera, $options: 'i' };
      if (safePeriodo) query.periodo = { $eq: safePeriodo };
      if (safeJornada) query.jornada = { $regex: safeJornada, $options: 'i' };
      items = await CourseOffering.find(query).lean();
    } catch (err) {
      console.warn('[courseService] Fallback a memoria consultando asignaturas:', err.message);
    }
  }

  if (carrera) {
    const careerLower = carrera.toLowerCase();
    items = items.filter((it) => (it.carrera || '').toLowerCase().includes(careerLower));
  }

  return items;
}

/**
 * Resultado homogéneo de extractImportPayload (filas a procesar + filas rechazadas por el parser).
 */
function buildPayload(rowsToProcess, sourceFormat, replace, periodo, rejected = []) {
  return { rowsToProcess, rejected, sourceFormat, replace, periodo };
}

function fromParsed(parsed, sourceFormat, replace, periodo) {
  return buildPayload(parsed.offerings, sourceFormat, replace, periodo, parsed.rejected);
}

/**
 * Extrae filas de entrada para importación masiva desde JSON, Markdown o Excel.
 * No escribe nada: solo parsea (compartido por la importación real y el dry-run).
 */
async function extractImportPayload(input, periodo) {
  if (Array.isArray(input)) {
    return buildPayload(input, 'JSON', undefined, periodo);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return buildPayload(Array.isArray(parsed) ? parsed : parsed.rows || [], 'JSON', undefined, periodo);
      } catch {
        // No es JSON válido: se interpreta como tabla Markdown
      }
    }
    return fromParsed(excelParserService.parseMarkdownTable(trimmed, { periodo }), 'MARKDOWN', undefined, periodo);
  }

  if (Buffer.isBuffer(input)) {
    const uploadRes = await excelParserService.processCatalogUpload({
      buffer: input,
      filename: 'upload.xlsx',
      replace: false,
      periodo,
    });
    return fromParsed(uploadRes, 'XLSX', undefined, periodo);
  }

  if (input && typeof input === 'object') {
    const effectivePeriodo = input.periodo || periodo;
    const effectiveReplace = input.replace !== undefined ? Boolean(input.replace) : undefined;

    if (input.markdown || input.md || input.textContent) {
      const mdText = input.markdown || input.md || input.textContent;
      const mdRes = excelParserService.parseMarkdownTable(mdText, { periodo: effectivePeriodo });
      return fromParsed(mdRes, 'MARKDOWN', effectiveReplace, effectivePeriodo);
    }

    if (input.base64 || input.fileBase64) {
      const buf = Buffer.from(input.base64 || input.fileBase64, 'base64');
      const filename = input.filename || 'upload.xlsx';
      const uploadRes = await excelParserService.processCatalogUpload({
        buffer: buf,
        filename,
        replace: false,
        periodo: effectivePeriodo,
      });
      const sourceFormat = filename.endsWith('.md') ? 'MARKDOWN' : 'XLSX';
      return fromParsed(uploadRes, sourceFormat, effectiveReplace, effectivePeriodo);
    }

    if (Array.isArray(input.rows)) {
      return buildPayload(input.rows, 'JSON', effectiveReplace, effectivePeriodo);
    }
  }

  return buildPayload([], 'JSON', undefined, periodo);
}

const PREVIEW_CAP = 50;
const PREVIEW_SAMPLE_SIZE = 10;

/**
 * Clasifica una sección Duoc en Diurna (D), Vespertina (V) o ambigua.
 * Usa el último tramo tras '-' (p. ej. "ING101-001D" => "001D") para no confundirse con la sigla.
 */
function classifySection(rawLabel) {
  const label = String(rawLabel || '').trim().toUpperCase().split('-').pop();
  const isD = label.startsWith('D') || label.endsWith('D');
  const isV = label.startsWith('V') || label.endsWith('V');
  if (isD === isV) return 'ambiguous';
  return isD ? 'D' : 'V';
}

function countSectionKinds(rows) {
  const counts = { D: 0, V: 0, ambiguous: 0 };
  for (const row of rows) counts[classifySection(row.seccion)] += 1;
  return counts;
}

/** Valor crudo de la sección (antes de que normalizeRow le asigne un valor por defecto). */
function rawSectionLabel(raw) {
  const entry = Object.entries(raw && typeof raw === 'object' ? raw : {}).find(
    ([key]) => excelParserService.normalizeHeaderKey(key) === 'seccion'
  );
  return entry ? entry[1] : '';
}

function buildPreviewWarnings({ invalidCount, sections, mixedSections, duplicates, validCount, errorsTruncated }) {
  const warnings = [];
  if (validCount === 0) warnings.push('No se detectaron filas válidas para importar.');
  if (invalidCount > 0) warnings.push(`${invalidCount} fila(s) inválida(s) serán omitidas.`);
  if (errorsTruncated) warnings.push(`Solo se muestran los primeros ${PREVIEW_CAP} errores.`);
  if (mixedSections) warnings.push('El archivo mezcla secciones diurnas (D) y vespertinas (V).');
  if (sections.ambiguous > 0) {
    warnings.push(`${sections.ambiguous} sección(es) no se pueden clasificar como diurna (D) o vespertina (V).`);
  }
  if (duplicates > 0) warnings.push(`${duplicates} sección(es) duplicada(s) (misma carrera, sigla y sección).`);
  return warnings;
}

/**
 * Construye el informe de validación (dry-run) a partir de las filas ya extraídas. No persiste nada.
 */
function buildImportPreview({ rowsToProcess, rejected = [], periodo }) {
  const errors = [...rejected];
  const sections = { D: 0, V: 0, ambiguous: 0 };
  const ambiguousRows = [];
  const sample = [];
  const seen = new Set();
  let validCount = 0;
  let duplicates = 0;

  rowsToProcess.forEach((raw, idx) => {
    const row = idx + 1;
    const norm = excelParserService.normalizeRow(raw, periodo);
    if (!excelParserService.isValidOffering(norm)) {
      errors.push({ row, message: excelParserService.INVALID_ROW_MESSAGE });
      return;
    }
    validCount += 1;

    const kind = classifySection(rawSectionLabel(raw) || norm.seccion);
    sections[kind] += 1;
    if (kind === 'ambiguous' && ambiguousRows.length < PREVIEW_CAP) {
      ambiguousRows.push({ row, sigla: norm.sigla, seccion: norm.seccion });
    }

    const key = `${norm.carrera}||${norm.sigla}||${norm.seccion}`;
    if (seen.has(key)) duplicates += 1;
    seen.add(key);

    if (sample.length < PREVIEW_SAMPLE_SIZE) {
      sample.push({ sigla: norm.sigla, nombre: norm.nombre, seccion: norm.seccion, jornada: norm.jornada });
    }
  });

  errors.sort((a, b) => a.row - b.row);
  const mixedSections = sections.D > 0 && sections.V > 0;

  return {
    totalDetected: rowsToProcess.length + rejected.length,
    validCount,
    invalidCount: errors.length,
    errors: errors.slice(0, PREVIEW_CAP),
    sections,
    mixedSections,
    ambiguousRows,
    warnings: buildPreviewWarnings({
      invalidCount: errors.length,
      sections,
      mixedSections,
      duplicates,
      validCount,
      errorsTruncated: errors.length > PREVIEW_CAP,
    }),
    sample,
  };
}
/**
 * Inserta ofertas en lotes de 1000 documentos para optimizar memoria BSON en MongoDB.
 */
async function insertOfferingsInChunks(items) {
  for (let i = 0; i < items.length; i += 1000) {
    const chunk = items.slice(i, i + 1000);
    await CourseOffering.insertMany(chunk, { ordered: false });
  }
}

const courseService = {
  /**
   * Inicializa la base de datos o almacén en memoria con el catálogo semilla oficial.
   */
  async seedInitialCourses({ force = false } = {}) {
    try {
      const seedItems = loadDefaultSeedOfferings();
      inMemoryCourses = seedItems;

      if (mongoose.connection.readyState === 1) {
        const count = await CourseOffering.countDocuments();
        if (count === 0 || force) {
          if (force) {
            await excelParserService.wipeAllData();
          }
          await insertOfferingsInChunks(seedItems);
          console.log(
            `[courseService] Sembradas ${seedItems.length} secciones oficiales de Alameda 2026 en MongoDB`
          );
        }
      }

      return {
        success: true,
        count: inMemoryCourses.length,
        sections: countSectionKinds(inMemoryCourses),
        source: alamedaSeedData ? 'ALAMEDA_2026_OFFICIAL_CATALOG' : 'SEED_ROWS_RAW',
      };
    } catch (err) {
      console.warn('[courseService] Advertencia sembrando en BD:', err.message);
      return { success: true, count: inMemoryCourses.length, warning: err.message };
    }
  },

  /**
   * Retorna todas las carreras disponibles con conteos.
   */
  async getCareersSummary() {
    let all = inMemoryCourses;
    if (mongoose.connection.readyState === 1) {
      try {
        all = await CourseOffering.find({}).lean();
      } catch (err) {
        console.warn('[courseService] Fallback a memoria para resumen de carreras:', err.message);
      }
    }

    const careerMap = new Map();
    for (const item of all) {
      const key = item.carrera;
      if (!careerMap.has(key)) {
        careerMap.set(key, {
          carrera: item.carrera,
          plan: item.plan,
          sede: item.sede,
          periodo: item.periodo,
          totalSecciones: 0,
          asignaturasUnicas: new Set(),
        });
      }
      const data = careerMap.get(key);
      data.totalSecciones++;
      data.asignaturasUnicas.add(item.sigla);
    }

    return Array.from(careerMap.values()).map((c) => ({
      carrera: c.carrera,
      plan: c.plan,
      sede: c.sede,
      periodo: c.periodo,
      totalSecciones: c.totalSecciones,
      totalAsignaturas: c.asignaturasUnicas.size,
    }));
  },

  /**
   * Obtiene la lista de asignaturas para el simulador.
   */
  async getCoursesForSimulation({
    carrera,
    periodo = '2026 - 002',
    jornada,
    random = false,
    limit = 8,
  }) {
    const items = await fetchMatchingOfferings({ carrera, periodo, jornada });
    let grouped = groupOfferingsIntoCourses(items);

    if (grouped.length === 0) {
      grouped = groupOfferingsIntoCourses(inMemoryCourses);
    }

    if (random && grouped.length > 0) {
      const shuffled = [...grouped];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const takeCount = Math.min(Math.max(limit, 6), shuffled.length);
      grouped = shuffled.slice(0, takeCount).map((g, idx) => ({
        ...g,
        yaInscrito: idx === 0,
        seccionInscrita: idx === 0 && g.secciones[0] ? g.secciones[0].seccion : undefined,
      }));
    }

    return grouped;
  },

  /**
   * Importación masiva desde datos parseados de Excel (.xlsx / .csv), Markdown (.md) o JSON.
   */
  async bulkImport(input, { replace = false, periodo = '2026 - 002' } = {}) {
    const extracted = await extractImportPayload(input, periodo);
    const rowsToProcess = extracted.rowsToProcess;
    const sourceFormat = extracted.sourceFormat;
    const effectiveReplace = extracted.replace !== undefined ? extracted.replace : replace;
    const effectivePeriodo = extracted.periodo || periodo;

    if (!Array.isArray(rowsToProcess) || rowsToProcess.length === 0) {
      throw new Error('No se recibieron filas válidas para importar.');
    }

    const normalized = rowsToProcess
      .map((r) => excelParserService.normalizeRow(r, effectivePeriodo))
      .filter(excelParserService.isValidOffering);

    if (normalized.length === 0) {
      throw new Error('Ninguna fila contiene sigla y nombre de asignatura válidos.');
    }

    inMemoryCourses = effectiveReplace ? [...normalized] : [...inMemoryCourses, ...normalized];

    const safePeriodo =
      typeof effectivePeriodo === 'string' ? effectivePeriodo.trim().slice(0, 50) : '2026 - 002';

    if (mongoose.connection.readyState === 1) {
      try {
        if (effectiveReplace) {
          await excelParserService.wipePeriodData(safePeriodo);
        }
        await insertOfferingsInChunks(normalized);
      } catch (err) {
        console.warn('[courseService] Advertencia al persistir en MongoDB:', err.message);
      }
    }

    const uniqueSiglas = new Set(normalized.map((n) => n.sigla));
    const uniqueCarreras = new Set(normalized.map((n) => n.carrera));

    return {
      success: true,
      sourceFormat,
      totalFilas: rowsToProcess.length,
      seccionesImportadas: normalized.length,
      asignaturasUnicas: uniqueSiglas.size,
      carrerasDetectadas: Array.from(uniqueCarreras),
      sections: countSectionKinds(normalized),
      periodo: safePeriodo,
      reemplazado: effectiveReplace,
    };
  },

  /**
   * Dry-run de importación: parsea y valida igual que bulkImport pero NO escribe en memoria ni en MongoDB.
   */
  async previewImport(input, { periodo = '2026 - 002' } = {}) {
    const extracted = await extractImportPayload(input, periodo);
    return buildImportPreview({ ...extracted, periodo: extracted.periodo || periodo });
  },

  /**
   * Genera una representación en formato Markdown (.md) de los cursos disponibles.
   */
  async exportToMarkdown({ carrera, periodo = '2026 - 002' } = {}) {
    const items = await fetchMatchingOfferings({ carrera, periodo });
    const headers = [
      'Sede',
      'Carrera',
      'Plan',
      'Jornada',
      'Sigla Asignatura',
      'Nombre Asignatura',
      'Nivel',
      'Sección',
      'Horario',
      'Docente',
      'Modalidad',
    ];
    const headerRow = `| ${headers.map((h) => `**${h}**`).join(' | ')} |`;
    const alignRow = `| ${headers.map(() => ':-:').join(' | ')} |`;
    const dataRows = items.map(
      (it) =>
        `| ${it.sede || 'ALAMEDA'} | ${it.carrera || ''} | ${it.plan || ''} | ${it.jornada || ''} | ${it.sigla || ''} | ${it.nombre || ''} | ${it.nivel || ''} | ${it.seccion || ''} | ${it.horarioRaw || ''} | ${it.docente || ''} | ${it.modalidad || ''} |`
    );
    return [headerRow, alignRow, ...dataRows].join('\n');
  },

  /**
   * Limpia las asignaturas registradas en memoria y en MongoDB.
   */
  async clearAll() {
    const removedCount = inMemoryCourses.length;
    inMemoryCourses = [];
    await excelParserService.wipeAllData();
    return { success: true, removedCount };
  },

  parseDuocSchedule,
};

module.exports = courseService;
