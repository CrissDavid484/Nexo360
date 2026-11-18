const mongoose = require('mongoose');
const Career = require('../models/Career');
const Sede = require('../models/Sede');
const { DEFAULT_SEDE, escapeRegex, sanitizeString } = require('../utils/validationUtils');

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

// Piloto exclusivo Duoc UC - Sede Alameda (CRUD dinámico permite extender sedes en tiempo de ejecución)
const INITIAL_SEDES = [DEFAULT_SEDE];

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
  let inMemoryItems = initialItems.map((item, idx) => ({
    _id: `${idPrefix}_${idx + 1}`,
    id: `${idPrefix}_${idx + 1}`,
    ...mapSeedDoc(item, idx),
  }));

  async function seedIfEmptyInDb() {
    let dbItems = await Model.find({}).sort({ name: 1 }).lean();
    if (dbItems && dbItems.length > 0) {
      return dbItems;
    }

    const docs = inMemoryItems.map((entry, idx) => mapSeedDoc(entry.name, idx, entry));
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
        const dbItems = await seedIfEmptyInDb();
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

    const duplicateMsg = `La ${singularLabel} "${cleanName}" ya se encuentra registrada en el sistema.`;
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
  mapSeedDoc: (name, idx, existing) => ({
    name,
    code: existing?.code || `CARR-${idx + 1}`,
    school: existing?.school || 'Escuela Duoc UC',
  }),
  buildCreatePayload: (cleanName, rawBody) => ({
    name: cleanName,
    code: sanitizeString(rawBody.code, 20) || '',
    school: sanitizeString(rawBody.school, 120) || 'Escuela Duoc UC',
  }),
});

const sedeCatalog = createCatalogManager({
  Model: Sede,
  initialItems: INITIAL_SEDES,
  idPrefix: 'sede',
  singularLabel: 'sede',
  pluralLabel: 'sedes',
  mapSeedDoc: (name, _idx, existing) => ({
    name,
    city: existing?.city || 'Región Metropolitana',
  }),
  buildCreatePayload: (cleanName, rawBody) => ({
    name: cleanName,
    city: sanitizeString(rawBody.city, 80) || 'Región Metropolitana',
  }),
});

module.exports = {
  INITIAL_CAREERS,
  INITIAL_SEDES,
  careerCatalog,
  sedeCatalog,
};
