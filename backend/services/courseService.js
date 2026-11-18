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
 * Extrae filas de entrada para importación masiva desde JSON, Markdown o Excel.
 */
async function extractImportPayload(input, periodo) {
  if (Array.isArray(input)) {
    return { rowsToProcess: input, sourceFormat: 'JSON', replace: undefined, periodo };
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          rowsToProcess: Array.isArray(parsed) ? parsed : parsed.rows || [],
          sourceFormat: 'JSON',
          replace: undefined,
          periodo,
        };
      } catch {
        const mdRes = excelParserService.parseMarkdownTable(trimmed, { periodo });
        return { rowsToProcess: mdRes.offerings, sourceFormat: 'MARKDOWN', replace: undefined, periodo };
      }
    }
    const mdRes = excelParserService.parseMarkdownTable(trimmed, { periodo });
    return { rowsToProcess: mdRes.offerings, sourceFormat: 'MARKDOWN', replace: undefined, periodo };
  }

  if (Buffer.isBuffer(input)) {
    const uploadRes = await excelParserService.processCatalogUpload({
      buffer: input,
      filename: 'upload.xlsx',
      replace: false,
      periodo,
    });
    return { rowsToProcess: uploadRes.offerings, sourceFormat: 'XLSX', replace: undefined, periodo };
  }

  if (input && typeof input === 'object') {
    const effectivePeriodo = input.periodo || periodo;
    const effectiveReplace = input.replace !== undefined ? Boolean(input.replace) : undefined;

    if (input.markdown || input.md || input.textContent) {
      const mdText = input.markdown || input.md || input.textContent;
      const mdRes = excelParserService.parseMarkdownTable(mdText, { periodo: effectivePeriodo });
      return {
        rowsToProcess: mdRes.offerings,
        sourceFormat: 'MARKDOWN',
        replace: effectiveReplace,
        periodo: effectivePeriodo,
      };
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
      return {
        rowsToProcess: uploadRes.offerings,
        sourceFormat: filename.endsWith('.md') ? 'MARKDOWN' : 'XLSX',
        replace: effectiveReplace,
        periodo: effectivePeriodo,
      };
    }

    if (Array.isArray(input.rows)) {
      return {
        rowsToProcess: input.rows,
        sourceFormat: 'JSON',
        replace: effectiveReplace,
        periodo: effectivePeriodo,
      };
    }
  }

  return { rowsToProcess: [], sourceFormat: 'JSON', replace: undefined, periodo };
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
      .filter((r) => r.sigla && r.nombre);

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
      periodo: safePeriodo,
      reemplazado: effectiveReplace,
    };
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
    inMemoryCourses = [];
    await excelParserService.wipeAllData();
    return { success: true };
  },

  parseDuocSchedule,
};

module.exports = courseService;
