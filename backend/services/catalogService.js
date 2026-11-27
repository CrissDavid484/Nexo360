const mongoose = require('mongoose');
const Career = require('../models/Career');
const Sede = require('../models/Sede');
const { DEFAULT_SEDE, escapeRegex, sanitizeString } = require('../utils/validationUtils');

const DUOC_SCHOOLS = [
  'Escuela de Informática y Telecomunicaciones',
  'Escuela de Administración y Negocios',
  'Escuela de Diseño',
  'Escuela de Comunicación',
  'Escuela de Construcción',
  'Escuela de Ingeniería y Recursos Naturales',
  'Escuela de Salud',
  'Escuela de Turismo y Hotelería',
  'Escuela de Gastronomía',
];

const CHILE_REGIONS = [
  'Región de Arica y Parinacota',
  'Región de Tarapacá',
  'Región de Antofagasta',
  'Región de Atacama',
  'Región de Coquimbo',
  'Región de Valparaíso',
  'Región Metropolitana',
  "Región del Libertador General Bernardo O'Higgins",
  'Región del Maule',
  'Región de Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén del General Carlos Ibáñez del Campo',
  'Región de Magallanes y de la Antártica Chilena',
];

/**
 * Mapeo declarativo de palabras clave por escuela institucional
 */
const CAREER_SCHOOL_PATTERNS = [
  [['turística', 'turismo', 'ecoturismo', 'hotelería'], 'Escuela de Turismo y Hotelería'],
  [['administración', 'auditoría', 'comercio exterior', 'control de gestión', 'gestión de personas', 'gestión logística', 'operaciones logísticas', 'marketing'], 'Escuela de Administración y Negocios'],
  [['programador', 'software', 'ciberseguridad', 'ciencia de datos', 'informática', 'biomédica', 'web', 'conectividad', 'redes', 'telecomunicaciones', 'infraestructura tecnológica'], 'Escuela de Informática y Telecomunicaciones'],
  [['diseño', 'ilustración', 'ambientes', 'vestuario', 'restauración'], 'Escuela de Diseño'],
  [['actuación', 'animación digital', 'audiovisual', 'periodismo', 'publicidad', 'relaciones públicas', 'sonido', 'iluminación'], 'Escuela de Comunicación'],
  [['construcción', 'arquitectónico', 'estructural', 'topografía', 'modelador proyectista'], 'Escuela de Construcción'],
  [['culinarias', 'gastronomía'], 'Escuela de Gastronomía'],
  [['enfermería', 'fisioterapia', 'kinesiología', 'odontología', 'farmacia', 'laboratorio clínico', 'radiodiagnóstico', 'físico', 'calidad de alimentos'], 'Escuela de Salud'],
  [['agrícola', 'automatización', 'electricidad', 'mantenimiento', 'maquinaria', 'mecánica', 'medio ambiente', 'minas', 'mineros', 'prevención de riesgos', 'recursos naturales', 'geología', 'industrial', 'electromecánico', 'desabolladura', 'veterinario', 'energías renovables'], 'Escuela de Ingeniería y Recursos Naturales'],
];

/**
 * Mapea deterministamente una carrera a su Escuela Oficial Duoc UC
 */
function getSchoolForCareer(careerName = '') {
  const c = String(careerName || '').toLowerCase();
  for (let i = 0; i < CAREER_SCHOOL_PATTERNS.length; i++) {
    const [terms, school] = CAREER_SCHOOL_PATTERNS[i];
    if (terms.some((term) => c.includes(term))) {
      return school;
    }
  }
  return 'Escuela de Informática y Telecomunicaciones';
}

const INITIAL_CAREERS = [
  'Actuación',
  'Administración de Empresas',
  'Administración Pública',
  'Administración Turística Internacional',
  'Analista Programador Computacional',
  'Animación Digital',
  'Artes Culinarias',
  'Auditoría y Análisis de Negocios',
  'Comunicación Audiovisual',
  'Construcción Civil',
  'Desarrollo y Diseño Web',
  'Dibujo y Modelamiento Arquitectónico y Estructural',
  'Diseño de Ambientes',
  'Diseño de Vestuario',
  'Diseño Gráfico',
  'Diseño Industrial e Innovación en Productos',
  'Ecoturismo',
  'Gastronomía Internacional',
  'Ilustración para Contextos Globales',
  'Informática Biomédica',
  'Ingeniería Agrícola',
  'Ingeniería en Administración',
  'Ingeniería en Automatización y Control Industrial',
  'Ingeniería en Ciberseguridad',
  'Ingeniería en Ciencia de Datos',
  'Ingeniería en Comercio Exterior',
  'Ingeniería en Conectividad y Redes',
  'Ingeniería en Construcción',
  'Ingeniería en Control de Gestión',
  'Ingeniería en Desarrollo de Software',
  'Ingeniería en Electricidad y Automatización Industrial',
  'Ingeniería en Gestión Logística',
  'Ingeniería en Informática',
  'Ingeniería en Infraestructura Tecnológica',
  'Ingeniería en Mantenimiento Industrial',
  'Ingeniería en Maquinaria y Vehículos Pesados',
  'Ingeniería en Marketing Digital',
  'Ingeniería en Mecánica Automotriz y Autotrónica',
  'Ingeniería en Medio Ambiente',
  'Ingeniería en Minas',
  'Ingeniería en Prevención de Riesgos',
  'Ingeniería en Recursos Naturales y Sostenibilidad',
  'Ingeniería en Redes y Telecomunicaciones',
  'Ingeniería en Sonido',
  'Ingeniería Industrial',
  'Periodismo Digital',
  'Preparador Físico',
  'Publicidad',
  'Relaciones Públicas y Comunicación Organizacional',
  'Restauración de Bienes Patrimoniales',
  'Técnico Audiovisual',
  'Técnico en Administración',
  'Técnico en Calidad de Alimentos',
  'Técnico en Comercio Exterior',
  'Técnico en Conectividad y Redes',
  'Técnico en Construcción',
  'Técnico en Control y Monitoreo Remoto de Procesos Mineros',
  'Técnico en Desabolladura y Pintura Automotriz',
  'Técnico en Diseño Gráfico',
  'Técnico en Electricidad y Automatización Industrial',
  'Técnico en Electricidad y Energías Renovables',
  'Técnico en Enfermería',
  'Técnico en Gastronomía',
  'Técnico en Geología',
  'Técnico en Gestión de Personas',
  'Técnico en Gestión Logística',
  'Técnico en Infraestructura Tecnológica',
  'Técnico en Laboratorio Clínico, Banco de Sangre e Imagenología',
  'Técnico en Mantenimiento Electromecánico',
  'Técnico en Mantenimiento Industrial',
  'Técnico en Maquinaria y Vehículos Pesados',
  'Técnico en Mecánica Automotriz y Autotrónica',
  'Técnico en Odontología',
  'Técnico en Operación y Supervisión de Procesos Mineros',
  'Técnico en Operaciones Logísticas',
  'Técnico en Prevención de Riesgos Laborales',
  'Técnico en Química y Farmacia',
  'Técnico en Radiodiagnóstico y Radioterapia',
  'Técnico en Topografía y Geomática',
  'Técnico en Turismo y Hotelería',
  'Técnico Modelador Proyectista',
  'Técnico Veterinario y Pecuario',
  'Tecnología en Sonido e Iluminación',
  'Telecomunicaciones y Conectividad',
].sort((a, b) => a.localeCompare(b, 'es'));

// 20 Sedes Oficiales de Duoc UC a Nivel Nacional
const INITIAL_SEDES = [
  { name: 'Sede Alameda', region: 'Región Metropolitana', city: 'Santiago' },
  { name: 'Sede Antonio Varas', region: 'Región Metropolitana', city: 'Providencia' },
  { name: 'Sede Brasil', region: 'Región de Valparaíso', city: 'Valparaíso' },
  { name: 'Campus Arauco', region: 'Región del Biobío', city: 'Arauco' },
  { name: 'Campus Nacimiento', region: 'Región del Biobío', city: 'Nacimiento' },
  { name: 'Campus Villarrica', region: 'Región de La Araucanía', city: 'Villarrica' },
  { name: 'Sede Educación Continua', region: 'Región Metropolitana', city: 'Santiago' },
  { name: 'Sede Melipilla', region: 'Región Metropolitana', city: 'Melipilla' },
  { name: 'Sede Maipú', region: 'Región Metropolitana', city: 'Maipú' },
  { name: 'Sede Padre Alonso de Ovalle', region: 'Región Metropolitana', city: 'Santiago' },
  { name: 'Sede Plaza Norte', region: 'Región Metropolitana', city: 'Huechuraba' },
  { name: 'Sede Plaza Oeste', region: 'Región Metropolitana', city: 'Cerrillos' },
  { name: 'Sede Plaza Vespucio', region: 'Región Metropolitana', city: 'La Florida' },
  { name: 'Sede Puente Alto', region: 'Región Metropolitana', city: 'Puente Alto' },
  { name: 'Campus Puerto Montt', region: 'Región de Los Lagos', city: 'Puerto Montt' },
  { name: 'Sede San Bernardo', region: 'Región Metropolitana', city: 'San Bernardo' },
  { name: 'Sede San Carlos de Apoquindo', region: 'Región Metropolitana', city: 'Las Condes' },
  { name: 'Sede San Joaquín', region: 'Región Metropolitana', city: 'San Joaquín' },
  { name: 'Sede Valparaíso', region: 'Región de Valparaíso', city: 'Valparaíso' },
  { name: 'Sede Viña del Mar', region: 'Región de Valparaíso', city: 'Viña del Mar' },
];

const OFFICIAL_SEDES_SPECS = [
  { name: 'Sede Alameda', match: /^(Sede\s+)?Alameda$/i, region: 'Región Metropolitana', city: 'Santiago' },
  { name: 'Sede Antonio Varas', match: /^(Sede\s+)?Antonio Varas$/i, region: 'Región Metropolitana', city: 'Providencia' },
  { name: 'Sede Brasil', match: /^(Sede\s+)?Brasil$/i, region: 'Región de Valparaíso', city: 'Valparaíso' },
  { name: 'Campus Arauco', match: /^(Campus\s+|Sede\s+)?Arauco$/i, region: 'Región del Biobío', city: 'Arauco' },
  { name: 'Campus Nacimiento', match: /^(Campus\s+|Sede\s+)?Nacimiento$/i, region: 'Región del Biobío', city: 'Nacimiento' },
  { name: 'Campus Villarrica', match: /^(Campus\s+|Sede\s+)?Villarrica$/i, region: 'Región de La Araucanía', city: 'Villarrica' },
  { name: 'Sede Educación Continua', match: /^(Sede\s+)?Educaci[oó]n Continua$/i, region: 'Región Metropolitana', city: 'Santiago' },
  { name: 'Sede Melipilla', match: /^(Sede\s+)?Melipilla$/i, region: 'Región Metropolitana', city: 'Melipilla' },
  { name: 'Sede Maipú', match: /^(Sede\s+)?Maip[uú]$/i, region: 'Región Metropolitana', city: 'Maipú' },
  { name: 'Sede Padre Alonso de Ovalle', match: /^(Sede\s+)?Padre Alonso de Ovalle$/i, region: 'Región Metropolitana', city: 'Santiago' },
  { name: 'Sede Plaza Norte', match: /^(Sede\s+)?Plaza Norte$/i, region: 'Región Metropolitana', city: 'Huechuraba' },
  { name: 'Sede Plaza Oeste', match: /^(Sede\s+)?Plaza Oeste$/i, region: 'Región Metropolitana', city: 'Cerrillos' },
  { name: 'Sede Plaza Vespucio', match: /^(Sede\s+)?Plaza Vespucio$/i, region: 'Región Metropolitana', city: 'La Florida' },
  { name: 'Sede Puente Alto', match: /^(Sede\s+)?Puente Alto$/i, region: 'Región Metropolitana', city: 'Puente Alto' },
  { name: 'Campus Puerto Montt', match: /^(Campus\s+|Sede\s+)?Puerto Montt$/i, region: 'Región de Los Lagos', city: 'Puerto Montt' },
  { name: 'Sede San Bernardo', match: /^(Sede\s+)?San Bernardo$/i, region: 'Región Metropolitana', city: 'San Bernardo' },
  { name: 'Sede San Carlos de Apoquindo', match: /^(Sede\s+)?San Carlos de Apoquindo$/i, region: 'Región Metropolitana', city: 'Las Condes' },
  { name: 'Sede San Joaquín', match: /^(Sede\s+)?San Joaqu[ií]n$/i, region: 'Región Metropolitana', city: 'San Joaquín' },
  { name: 'Sede Valparaíso', match: /^(Sede\s+)?Valpara[ií]so$/i, region: 'Región de Valparaíso', city: 'Valparaíso' },
  { name: 'Sede Viña del Mar', match: /^(Sede\s+)?Viña del Mar$/i, region: 'Región de Valparaíso', city: 'Viña del Mar' },
];

/**
 * Verifica si un error de MongoDB corresponde exclusivamente a colisión benigna por clave duplicada (E11000).
 */
function isDuplicateKeyBulkError(err) {
  if (!err) return false;
  if (err.code === 11000) return true;
  if (Array.isArray(err.writeErrors) && err.writeErrors.length > 0) {
    return err.writeErrors.every((we) => we && we.code === 11000);
  }
  return false;
}

/**
 * Crea un error HTTP controlado con statusCode.
 */
function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

let catalogMigrationDone = false;

/**
 * Factoría DRY para gestionar catálogos dinámicos (Carreras y Sedes) con respaldo en memoria.
 */
function createCatalogManager({
  Model,
  initialItems,
  idPrefix,
  singularLabel,
  pluralLabel,
  mapSeedDoc,
  buildCreatePayload,
}) {
  let inMemoryItems = initialItems.map((item, idx) => {
    const rawName = typeof item === 'object' && item !== null ? item.name : item;
    return {
      _id: `${idPrefix}_${idx + 1}`,
      id: `${idPrefix}_${idx + 1}`,
      ...mapSeedDoc(item, idx),
    };
  });

  async function seedIfEmptyInDb() {
    let dbItems = await Model.find({}).sort({ name: 1 }).lean();
    if (dbItems && dbItems.length > 0) {
      return dbItems;
    }

    const docs = inMemoryItems.map((entry, idx) => mapSeedDoc(entry, idx, entry));
    try {
      await Model.insertMany(docs, { ordered: false });
    } catch (insertErr) {
      if (!isDuplicateKeyBulkError(insertErr)) {
        console.warn(`[CatalogService] Error sembrando ${pluralLabel} en MongoDB:`, insertErr.message);
      }
    }

    dbItems = await Model.find({}).sort({ name: 1 }).lean();
    return dbItems;
  }

  async function list() {
    let items = [];
    if (mongoose.connection.readyState === 1) {
      try {
        const needsSync =
          !catalogMigrationDone ||
          (await Sede.countDocuments()) < 20 ||
          (await Sede.exists({
            $or: [{ city: { $in: [null, '', 'Región Metropolitana'] } }, { region: { $in: [null, ''] } }],
          })) ||
          (await Career.exists({ school: { $regex: /escuela duoc uc/i } }));

        if (needsSync) {
          await migrateCatalogDuocData();
        }

        const dbItems = await Model.find({}).sort({ name: 1 }).lean();
        if (dbItems && dbItems.length > 0) {
          items = dbItems;
        }
      } catch (err) {
        console.warn(`[CatalogService] Fallback a memoria para ${pluralLabel}:`, err.message);
      }
    }

    if (items.length === 0) {
      items = [...inMemoryItems];
    }

    items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
    return items;
  }

  async function create(rawBody = {}) {
    const cleanName = sanitizeString(rawBody.name, 150) || '';
    if (!cleanName) {
      throw createHttpError(400, `El nombre de la ${singularLabel} es obligatorio.`);
    }

    const duplicateMsg = `La ${singularLabel} ingresada ya se encuentra registrada en el sistema.`;
    const nameRegex = new RegExp(`^${escapeRegex(cleanName, 150)}$`, 'i');
    const payload = buildCreatePayload(cleanName, rawBody);

    let created = null;
    if (mongoose.connection.readyState === 1) {
      const existing = await Model.findOne({ name: { $regex: nameRegex } });
      if (existing) {
        throw createHttpError(409, duplicateMsg);
      }
      created = await Model.create(payload);
    } else {
      const existsInMemory = inMemoryItems.some(
        (item) => item.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existsInMemory) {
        throw createHttpError(409, duplicateMsg);
      }
      created = {
        _id: `${idPrefix}_${Date.now()}`,
        id: `${idPrefix}_${Date.now()}`,
        ...payload,
      };
    }

    const alreadyInMemory = inMemoryItems.some(
      (item) => item.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (!alreadyInMemory) {
      inMemoryItems.push(created);
      inMemoryItems.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }

    return created;
  }

  async function remove(rawId) {
    const target = decodeURIComponent(String(rawId || '')).trim();
    if (!target) {
      throw createHttpError(400, `Identificador de la ${singularLabel} no proporcionado.`);
    }

    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      const resDb = mongoose.Types.ObjectId.isValid(target)
        ? await Model.findByIdAndDelete(target)
        : await Model.findOneAndDelete({
            name: { $regex: new RegExp(`^${escapeRegex(target, 150)}$`, 'i') },
          });
      if (resDb) deleted = true;
    }

    const prevLen = inMemoryItems.length;
    inMemoryItems = inMemoryItems.filter(
      (item) =>
        String(item._id) !== target &&
        String(item.id) !== target &&
        item.name.toLowerCase() !== target.toLowerCase()
    );
    if (inMemoryItems.length < prevLen) deleted = true;

    if (!deleted) {
      throw createHttpError(404, `No se encontró la ${singularLabel} especificada.`);
    }

    return { deleted: true };
  }

  return { list, create, remove };
}

const careerCatalog = createCatalogManager({
  Model: Career,
  initialItems: INITIAL_CAREERS,
  idPrefix: 'career',
  singularLabel: 'carrera',
  pluralLabel: 'carreras',
  mapSeedDoc: (item, idx, existing) => {
    const name = typeof item === 'object' && item !== null ? item.name : item;
    return {
      name,
      code: existing?.code || `CARR-${idx + 1}`,
      school: existing?.school || getSchoolForCareer(name),
    };
  },
  buildCreatePayload: (cleanName, rawBody) => ({
    name: cleanName,
    code: sanitizeString(rawBody.code, 20) || '',
    school: sanitizeString(rawBody.school, 120) || getSchoolForCareer(cleanName),
  }),
});

const sedeCatalog = createCatalogManager({
  Model: Sede,
  initialItems: INITIAL_SEDES,
  idPrefix: 'sede',
  singularLabel: 'sede',
  pluralLabel: 'sedes',
  mapSeedDoc: (item, _idx, existing) => {
    const isObj = typeof item === 'object' && item !== null;
    const name = isObj ? item.name : item;
    const region = isObj ? item.region : (existing?.region || 'Región Metropolitana');
    const city = isObj ? item.city : (existing?.city || 'Santiago');
    return {
      name,
      region,
      city,
    };
  },
  buildCreatePayload: (cleanName, rawBody) => {
    const region = sanitizeString(rawBody.region, 100) || 'Región Metropolitana';
    const city = sanitizeString(rawBody.city, 80) || (region === 'Región Metropolitana' ? 'Santiago' : '');
    return {
      name: cleanName,
      region,
      city,
    };
  },
});

/**
 * Migración y normalización automática del catálogo institucional Duoc UC en MongoDB:
 * 1. Reemplaza "Escuela Duoc UC" (o escuelas genéricas/vacías/no oficiales) por la Escuela Oficial Duoc UC en todas las carreras.
 * 2. Upsert de las 20 sedes oficiales Duoc UC con su Región y Ciudad reales a nivel nacional.
 * 3. Depuración de sedes obsoletas (ej. Sede San Andrés de Concepción).
 */
async function migrateCatalogDuocData() {
  if (mongoose.connection.readyState !== 1) {
    return { success: false, message: 'Database not connected' };
  }

  const results = {
    careersUpdated: 0,
    sedesUpserted: 0,
  };

  try {
    // 1. Sembrar carreras iniciales si la colección está vacía
    const existingCareersCount = await Career.countDocuments();
    if (existingCareersCount === 0) {
      const docs = INITIAL_CAREERS.map((name, idx) => ({
        name,
        code: `CARR-${idx + 1}`,
        school: getSchoolForCareer(name),
      }));
      await Career.insertMany(docs, { ordered: false }).catch((err) => {
        if (!isDuplicateKeyBulkError(err)) {
          console.warn('[CatalogService] Warning sembrando carreras:', err.message);
        }
      });
    }

    // 2. Actualizar todas las carreras existentes con bulkWrite
    const careersToMigrate = await Career.find({
      $or: [
        { school: { $regex: /escuela duoc uc/i } },
        { school: { $in: ['', null] } },
        { school: { $exists: false } },
        { school: { $nin: DUOC_SCHOOLS } },
      ],
    }).lean();

    if (careersToMigrate.length > 0) {
      const careerOps = careersToMigrate.map((car) => ({
        updateOne: {
          filter: { _id: car._id },
          update: { $set: { school: getSchoolForCareer(car.name) } },
        },
      }));
      await Career.bulkWrite(careerOps, { ordered: false });
      results.careersUpdated = careerOps.length;
    }

    // 3. Limpiar sedes obsoletas que ya no pertenecen al catálogo de 20 sedes oficiales
    await Sede.deleteMany({
      name: { $regex: /san andr[eé]s de concepci[oó]n/i },
    });

    // 4. Corregir explícitamente cualquier Sede Alameda antigua con ciudad o región anómala
    await Sede.updateMany(
      { name: /alameda/i },
      { $set: { name: 'Sede Alameda', region: 'Región Metropolitana', city: 'Santiago' } }
    );

    // 5. Upsert forzado de las 20 sedes oficiales de Duoc UC con bulkWrite
    const sedeOps = OFFICIAL_SEDES_SPECS.map((spec) => ({
      updateOne: {
        filter: {
          $or: [
            { name: spec.name },
            { name: { $regex: spec.match } },
          ],
        },
        update: {
          $set: {
            name: spec.name,
            region: spec.region,
            city: spec.city,
          },
        },
        upsert: true,
      },
    }));

    if (sedeOps.length > 0) {
      await Sede.bulkWrite(sedeOps, { ordered: false });
    }
    results.sedesUpserted = OFFICIAL_SEDES_SPECS.length;

    catalogMigrationDone = true;
    return { success: true, ...results };
  } catch (err) {
    console.error('[CatalogService] Error en migrateCatalogDuocData:', err.message);
    return { success: false, error: err.message };
  }
}

const ensureOfficialDuocCatalog = migrateCatalogDuocData;

module.exports = {
  DUOC_SCHOOLS,
  CHILE_REGIONS,
  INITIAL_CAREERS,
  INITIAL_SEDES,
  OFFICIAL_SEDES_SPECS,
  careerCatalog,
  sedeCatalog,
  getSchoolForCareer,
  migrateCatalogDuocData,
  ensureOfficialDuocCatalog,
};
