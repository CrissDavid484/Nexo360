const mongoose = require('mongoose');
const CourseOffering = require('../models/CourseOffering');
const excelParserService = require('./excelParserService');
const {
  STANDARD_BLOCKS,
  toMinutes,
  parseDuocSchedule,
  normalizeHeaderKey,
  normalizeRowToOffering,
} = require('../utils/courseScheduleUtils');

const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
};

let alamedaSeedData = null;
try {
  alamedaSeedData = require('../data/alameda2026Seed.json');
} catch (e) {
  alamedaSeedData = null;
}

const SEED_ROWS_RAW = require('../data/seedCourseRows.json');

// Almacén en memoria fallback (en caso de que MongoDB no esté conectado)
let inMemoryCourses = [];

/**
 * Agrupa una lista de ofertas planas (secciones) en la estructura jerárquica esperada por el Simulador SAP
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
      // Combinar bloques adicionales si la sección aparece en varias filas (ej. Lunes y Viernes)
      for (const blk of item.bloques || []) {
        if (!existingSec.bloques.some((b) => b.dia === blk.dia && b.bloqueId === blk.bloqueId)) {
          existingSec.bloques.push(blk);
        }
      }
    } else {
      course.secciones.push({
        seccion: item.seccion,
        cuposTotales: item.cuposTotales || 30,
        cuposDisponibles: item.cuposDisponibles ?? 12,
        sala: item.modalidad || 'ONLINE SINCRONA',
        profesor: item.docente || 'Docente Duoc UC',
        horarioTexto: item.horarioRaw || 'Por definir',
        bloques: item.bloques || [],
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Servicio Central de Asignaturas y Oferta Académica
 */
const courseService = {
  /**
   * Inicializa la base de datos o almacén en memoria con las filas semilla oficiales
   * Carga prioritariamente el catálogo Alameda 2026 completo (7,174 ofertas)
   */
  async seedInitialCourses({ force = false } = {}) {
    try {
      const seedItems = Array.isArray(alamedaSeedData) && alamedaSeedData.length > 0
        ? alamedaSeedData
        : SEED_ROWS_RAW.map((row) => normalizeRowToOffering(row));

      inMemoryCourses = [...seedItems];

      if (mongoose.connection.readyState === 1) {
        const count = await CourseOffering.countDocuments();
        if (count === 0 || force) {
          if (force) {
            await CourseOffering.deleteMany({});
          }
          // Inserción en bloques de 1000 para optimizar rendimiento y memoria BSON
          for (let i = 0; i < seedItems.length; i += 1000) {
            const chunk = seedItems.slice(i, i + 1000);
            await CourseOffering.insertMany(chunk, { ordered: false });
          }
          console.log(`[courseService] Sembradas ${seedItems.length} secciones oficiales de Alameda 2026 en MongoDB`);
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
   * Retorna todas las carreras disponibles con conteos
   */
  async getCareersSummary() {
    let all = inMemoryCourses;
    if (mongoose.connection.readyState === 1) {
      try {
        all = await CourseOffering.find({}).lean();
      } catch (e) {
        // Fallback a inMemory
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
   * Obtiene la lista de asignaturas para el simulador
   * Si random=true, baraja y selecciona un subconjunto dinámico (5 a 8) de la carrera
   */
  async getCoursesForSimulation({ carrera, periodo = '2026 - 002', jornada, random = false, limit = 8 }) {
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
      } catch (e) {
        // fallback
      }
    }

    if (carrera) {
      items = items.filter((it) => it.carrera.toLowerCase().includes(carrera.toLowerCase()));
    }

    // Agrupar en cursos
    let grouped = groupOfferingsIntoCourses(items);

    if (grouped.length === 0) {
      // Fallback a todos los ramos en memoria si la carrera no tiene asignaturas cargadas aún
      grouped = groupOfferingsIntoCourses(inMemoryCourses);
    }

    if (random && grouped.length > 0) {
      // Barajar cursos con algoritmo Fisher-Yates
      const shuffled = [...grouped];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Asegurar que haya entre 5 y 8 ramos
      const takeCount = Math.min(Math.max(limit, 6), shuffled.length);
      grouped = shuffled.slice(0, takeCount);

      // En el simulador oficial SAP, marcar 1 ramo al azar como ya inscrito para realismo
      if (grouped.length > 0) {
        grouped = grouped.map((g, idx) => ({
          ...g,
          yaInscrito: idx === 0,
          seccionInscrita: idx === 0 && g.secciones[0] ? g.secciones[0].seccion : undefined,
        }));
      }
    }

    return grouped;
  },

  /**
   * Importación masiva desde datos parseados de Excel (.xlsx / .csv), Markdown (.md) o JSON
   * Soporta payloads con { rows, markdown, md, base64, buffer, replace: true }
   */
  async bulkImport(input, { replace = false, periodo = '2026 - 002' } = {}) {
    let rowsToProcess = [];
    let sourceFormat = 'JSON';

    if (Array.isArray(input)) {
      rowsToProcess = input;
    } else if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          rowsToProcess = Array.isArray(parsed) ? parsed : (parsed.rows || []);
        } catch {
          const mdRes = excelParserService.parseMarkdownTable(trimmed, { periodo });
          rowsToProcess = mdRes.offerings;
          sourceFormat = 'MARKDOWN';
        }
      } else {
        const mdRes = excelParserService.parseMarkdownTable(trimmed, { periodo });
        rowsToProcess = mdRes.offerings;
        sourceFormat = 'MARKDOWN';
      }
    } else if (Buffer.isBuffer(input)) {
      const uploadRes = await excelParserService.processCatalogUpload({
        buffer: input,
        filename: 'upload.xlsx',
        replace: false,
        periodo,
      });
      rowsToProcess = uploadRes.offerings;
      sourceFormat = 'XLSX';
    } else if (input && typeof input === 'object') {
      if (input.markdown || input.md || input.textContent) {
        const mdText = input.markdown || input.md || input.textContent;
        const mdRes = excelParserService.parseMarkdownTable(mdText, { periodo: input.periodo || periodo });
        rowsToProcess = mdRes.offerings;
        sourceFormat = 'MARKDOWN';
      } else if (input.base64 || input.fileBase64) {
        const buf = Buffer.from(input.base64 || input.fileBase64, 'base64');
        const filename = input.filename || 'upload.xlsx';
        const uploadRes = await excelParserService.processCatalogUpload({
          buffer: buf,
          filename,
          replace: false,
          periodo: input.periodo || periodo,
        });
        rowsToProcess = uploadRes.offerings;
        sourceFormat = filename.endsWith('.md') ? 'MARKDOWN' : 'XLSX';
      } else if (Array.isArray(input.rows)) {
        rowsToProcess = input.rows;
      }
      if (input.replace !== undefined) {
        replace = Boolean(input.replace);
      }
      if (input.periodo) {
        periodo = input.periodo;
      }
    }

    if (!Array.isArray(rowsToProcess) || rowsToProcess.length === 0) {
      throw new Error('No se recibieron filas válidas para importar.');
    }

    const normalized = rowsToProcess
      .map((r) => excelParserService.normalizeRow(r, periodo))
      .filter((r) => r.sigla && r.nombre);

    if (normalized.length === 0) {
      throw new Error('Ninguna fila contiene sigla y nombre de asignatura válidos.');
    }

    if (replace) {
      inMemoryCourses = [...normalized];
    } else {
      inMemoryCourses = [...inMemoryCourses, ...normalized];
    }

    const safePeriodo = typeof periodo === 'string' ? periodo.trim().slice(0, 50) : '2026 - 002';
    if (mongoose.connection.readyState === 1) {
      try {
        if (replace) {
          // Limpia asignaturas del período (o todo) para evitar duplicados entre años
          await CourseOffering.deleteMany({ periodo: { $eq: safePeriodo } });
        }
        for (let i = 0; i < normalized.length; i += 1000) {
          const chunk = normalized.slice(i, i + 1000);
          await CourseOffering.insertMany(chunk, { ordered: false });
        }
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
      reemplazado: replace,
    };
  },

  /**
   * Genera una representación en formato Markdown (.md) de los cursos disponibles
   */
  async exportToMarkdown({ carrera, periodo = '2026 - 002' } = {}) {
    let items = inMemoryCourses;
    const safeCarrera = typeof carrera === 'string' ? escapeRegex(carrera.trim()) : '';
    const safePeriodo = typeof periodo === 'string' ? periodo.trim().slice(0, 50) : '2026 - 002';

    if (mongoose.connection.readyState === 1) {
      try {
        const q = {};
        if (safeCarrera) q.carrera = { $regex: safeCarrera, $options: 'i' };
        if (safePeriodo) q.periodo = { $eq: safePeriodo };
        items = await CourseOffering.find(q).lean();
      } catch (e) {}
    }
    if (carrera) {
      items = items.filter((it) => it.carrera.toLowerCase().includes(carrera.toLowerCase()));
    }
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
   * Limpia o reinicia las asignaturas registradas
   */
  async clearAll() {
    inMemoryCourses = [];
    if (mongoose.connection.readyState === 1) {
      await CourseOffering.deleteMany({});
    }
    return { success: true };
  },

  parseDuocSchedule,
};

// Inicializar semilla al cargar el módulo
courseService.seedInitialCourses().catch((err) => {
  console.warn('[courseService] Falló inicialización inicial de cursos:', err.message);
});

module.exports = courseService;
