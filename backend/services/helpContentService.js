const mongoose = require('mongoose');
const HelpProcedure = require('../models/HelpProcedure');
const INSTITUTIONAL_MODULES_SEED = require('../data/institutionalModules.json');

/**
 * Servicio de Gestión Editorial de Contenidos y Trámites (Épica E-005)
 * Implementa el ciclo de vida editorial completo: borrador, publicación, archivo,
 * versionamiento inmutable, auditoría y recuperación de versiones históricas.
 */
class HelpContentService {
  constructor() {
    this._inMemoryProcedures = new Map();
    this._isInitialized = false;
  }

  /**
   * Sembrado e ingesta idempotente desde institutionalModules.json hacia MongoDB.
   */
  async ensureSeedProcedures() {
    const isDbReady = mongoose.connection.readyState === 1;

    for (const cat of INSTITUTIONAL_MODULES_SEED) {
      for (const sub of cat.submodules || []) {
        const procedureId = String(sub.id).toLowerCase().trim();
        const existingData = {
          procedureId,
          categoryKey: cat.categoryKey,
          categoryTitle: cat.categoryTitle,
          title: sub.title,
          description: sub.description,
          status: 'published',
          officialUrl: sub.directUrl || cat.portalUrl || '',
          destinationPortal: cat.portalUrl ? 'Portal Duoc UC' : 'Servicio Institucional',
          paedisTip: sub.paedisTip || '',
          requirements: [
            'Ser estudiante regular o postulante a Duoc UC - Sede Alameda.',
            'Disponer de credenciales institucionales activas (@duocuc.cl).',
          ],
          documents: [
            'Cédula de Identidad vigente.',
            'Documentación de respaldo según el trámite.',
          ],
          steps: [
            {
              stepNumber: 1,
              title: 'Ingreso al portal oficial',
              instruction: `Accede mediante tus credenciales al portal ${cat.categoryTitle}.`,
            },
            {
              stepNumber: 2,
              title: 'Completitud de formulario y recaudos',
              instruction: 'Llena los campos solicitados y adjunta la documentación de soporte requerida.',
            },
            {
              stepNumber: 3,
              title: 'Confirmación y comprobante',
              instruction: 'Guarda el número de solicitud o comprobante de recepción para seguimiento.',
            },
          ],
          faqs: cat.faqs || [],
          version: 1,
          publishedAt: new Date(),
          lastReviewedAt: new Date(),
          lastReviewedBy: {
            userId: 'system',
            email: 'admin.alameda@duoc.cl',
            name: 'Editorial Institucional Duoc UC',
          },
        };

        if (isDbReady) {
          try {
            await HelpProcedure.findOneAndUpdate(
              { procedureId },
              { $setOnInsert: existingData },
              { upsert: true, new: true }
            );
          } catch (err) {
            // Continuar con los demás si hay colisión
          }
        }

        // Siempre mantener respaldo en memoria
        if (!this._inMemoryProcedures.has(procedureId)) {
          this._inMemoryProcedures.set(procedureId, existingData);
        }
      }
    }

    this._isInitialized = true;
    return { count: this._inMemoryProcedures.size };
  }

  /**
   * Obtiene categorías y trámites publicados para el Centro de Ayuda del estudiante.
   * Agrupa los trámites publicados según la estructura requerida por el frontend.
   */
  async getPublishedCategories(searchTerm = '') {
    const isDbReady = mongoose.connection.readyState === 1;
    let procedures = [];

    if (isDbReady) {
      try {
        const query = { status: 'published' };
        if (searchTerm && searchTerm.trim()) {
          const regex = new RegExp(searchTerm.trim(), 'i');
          query.$or = [
            { title: regex },
            { description: regex },
            { categoryTitle: regex },
            { requirements: regex },
          ];
        }
        procedures = await HelpProcedure.find(query).lean();
      } catch (err) {
        procedures = [];
      }
    }

    if (procedures.length === 0) {
      procedures = Array.from(this._inMemoryProcedures.values()).filter(
        (p) => p.status === 'published'
      );
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        procedures = procedures.filter(
          (p) =>
            p.title.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.categoryTitle.toLowerCase().includes(term)
        );
      }
    }

    // Agrupar trámites por categoryKey para compatibilidad perfecta con DashboardPage
    const categoriesMap = new Map();

    for (const proc of procedures) {
      if (!categoriesMap.has(proc.categoryKey)) {
        categoriesMap.set(proc.categoryKey, {
          categoryKey: proc.categoryKey,
          categoryTitle: proc.categoryTitle,
          portalUrl: proc.officialUrl,
          submodules: [],
          faqs: proc.faqs || [],
        });
      }

      const catObj = categoriesMap.get(proc.categoryKey);
      catObj.submodules.push({
        id: proc.procedureId,
        title: proc.title,
        description: proc.description,
        directUrl: proc.officialUrl,
        paedisTip: proc.paedisTip,
        requirements: proc.requirements,
        documents: proc.documents,
        steps: proc.steps,
        version: proc.version,
        lastReviewedAt: proc.lastReviewedAt,
      });
    }

    return Array.from(categoriesMap.values());
  }

  /**
   * Obtiene un trámite por su identificador único.
   */
  async getProcedureById(procedureId) {
    const isDbReady = mongoose.connection.readyState === 1;
    const cleanId = String(procedureId || '').toLowerCase().trim();

    if (isDbReady) {
      try {
        const found = await HelpProcedure.findOne({ procedureId: cleanId }).lean();
        if (found) return found;
      } catch {
        // Fallback a memoria
      }
    }

    return this._inMemoryProcedures.get(cleanId) || null;
  }

  /**
   * Obtiene todos los trámites para el panel administrativo editorial.
   */
  async getAllProceduresAdmin({ status, categoryKey, search } = {}) {
    const isDbReady = mongoose.connection.readyState === 1;
    let list = [];

    if (isDbReady) {
      try {
        const query = {};
        if (status) query.status = status;
        if (categoryKey) query.categoryKey = categoryKey;
        if (search && search.trim()) {
          const regex = new RegExp(search.trim(), 'i');
          query.$or = [{ title: regex }, { procedureId: regex }, { description: regex }];
        }
        list = await HelpProcedure.find(query).sort({ updatedAt: -1 }).lean();
      } catch {
        list = [];
      }
    }

    if (list.length === 0) {
      list = Array.from(this._inMemoryProcedures.values());
      if (status) list = list.filter((p) => p.status === status);
      if (categoryKey) list = list.filter((p) => p.categoryKey === categoryKey);
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        list = list.filter(
          (p) => p.title.toLowerCase().includes(s) || p.procedureId.toLowerCase().includes(s)
        );
      }
    }

    return list;
  }

  /**
   * Crea un nuevo trámite con versionamiento inicial.
   */
  async createProcedure(payload, actor) {
    const isDbReady = mongoose.connection.readyState === 1;
    const cleanId = String(payload.procedureId || '').toLowerCase().trim();

    if (!cleanId) {
      const err = new Error('El identificador del trámite (procedureId) es obligatorio.');
      err.status = 400;
      throw err;
    }

    const existing = await this.getProcedureById(cleanId);
    if (existing) {
      const err = new Error(`El trámite con identificador '${cleanId}' ya existe.`);
      err.status = 409;
      throw err;
    }

    const newDoc = {
      procedureId: cleanId,
      categoryKey: String(payload.categoryKey || 'orientacion-general').toLowerCase().trim(),
      categoryTitle: payload.categoryTitle || 'Orientación General',
      categoryIcon: payload.categoryIcon || 'HelpCircle',
      title: payload.title,
      description: payload.description,
      status: payload.status || 'draft',
      purpose: payload.purpose || '',
      requirements: Array.isArray(payload.requirements) ? payload.requirements : [],
      documents: Array.isArray(payload.documents) ? payload.documents : [],
      steps: Array.isArray(payload.steps) ? payload.steps : [],
      officialUrl: payload.officialUrl || '',
      destinationPortal: payload.destinationPortal || 'Portal Institucional Duoc UC',
      paedisTip: payload.paedisTip || '',
      isInstitutionalService: Boolean(payload.isInstitutionalService),
      faqs: Array.isArray(payload.faqs) ? payload.faqs : [],
      keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
      version: 1,
      versionHistory: [],
      publishedAt: payload.status === 'published' ? new Date() : null,
      lastReviewedAt: new Date(),
      lastReviewedBy: {
        userId: actor?.id || actor?._id || 'unknown',
        email: actor?.email || 'admin@duocuc.cl',
        name: actor?.fullName || actor?.nombre || 'Editor Institucional',
      },
    };

    if (isDbReady) {
      const created = await HelpProcedure.create(newDoc);
      this._inMemoryProcedures.set(cleanId, created.toObject ? created.toObject() : created);
      return created;
    }

    this._inMemoryProcedures.set(cleanId, newDoc);
    return newDoc;
  }

  /**
   * Modifica un trámite existente, guardando instantánea en versionHistory e incrementando version.
   */
  async updateProcedure(procedureId, updatePayload, actor) {
    const isDbReady = mongoose.connection.readyState === 1;
    const cleanId = String(procedureId || '').toLowerCase().trim();
    const current = await this.getProcedureById(cleanId);

    if (!current) {
      const err = new Error(`Trámite '${cleanId}' no encontrado.`);
      err.status = 404;
      throw err;
    }

    // Instantánea inmutable de la versión previa
    const snapshot = {
      version: current.version || 1,
      title: current.title,
      status: current.status,
      updatedByEmail: actor?.email || 'admin@duocuc.cl',
      updatedAt: new Date(),
      changeSummary: updatePayload.changeSummary || 'Modificación editorial de contenido',
      snapshotData: {
        description: current.description,
        requirements: current.requirements,
        documents: current.documents,
        steps: current.steps,
        officialUrl: current.officialUrl,
        paedisTip: current.paedisTip,
      },
    };

    const nextVersion = (current.version || 1) + 1;
    const updatedFields = {
      ...updatePayload,
      version: nextVersion,
      lastReviewedAt: new Date(),
      lastReviewedBy: {
        userId: actor?.id || actor?._id || 'unknown',
        email: actor?.email || 'admin@duocuc.cl',
        name: actor?.fullName || actor?.nombre || 'Editor Institucional',
      },
    };

    if (updatePayload.status === 'published' && current.status !== 'published') {
      updatedFields.publishedAt = new Date();
    } else if (updatePayload.status === 'archived' && current.status !== 'archived') {
      updatedFields.archivedAt = new Date();
    }

    if (isDbReady) {
      const updated = await HelpProcedure.findOneAndUpdate(
        { procedureId: cleanId },
        {
          $set: updatedFields,
          $push: { versionHistory: snapshot },
        },
        { returnDocument: 'after', runValidators: true }
      );
      this._inMemoryProcedures.set(cleanId, updated.toObject ? updated.toObject() : updated);
      return updated;
    }

    const merged = {
      ...current,
      ...updatedFields,
      versionHistory: [...(current.versionHistory || []), snapshot],
    };
    this._inMemoryProcedures.set(cleanId, merged);
    return merged;
  }

  /**
   * Cambia el estado del ciclo de vida editorial (draft -> published -> archived).
   */
  async setProcedureStatus(procedureId, nextStatus, actor) {
    if (!['draft', 'published', 'archived'].includes(nextStatus)) {
      const err = new Error(`Estado editorial no válido: ${nextStatus}`);
      err.status = 400;
      throw err;
    }
    return this.updateProcedure(
      procedureId,
      { status: nextStatus, changeSummary: `Cambio de estado editorial a ${nextStatus}` },
      actor
    );
  }

  /**
   * Revierte el trámite a una versión anterior registrada en versionHistory.
   */
  async rollbackProcedureVersion(procedureId, targetVersionNum, actor) {
    const current = await this.getProcedureById(procedureId);
    if (!current) {
      const err = new Error(`Trámite '${procedureId}' no encontrado.`);
      err.status = 404;
      throw err;
    }

    const targetVersion = Number(targetVersionNum);
    const historyItem = (current.versionHistory || []).find((h) => h.version === targetVersion);

    if (!historyItem || !historyItem.snapshotData) {
      const err = new Error(`No existe respaldo histórico de la versión ${targetVersion} para este trámite.`);
      err.status = 404;
      throw err;
    }

    const restoredData = {
      ...historyItem.snapshotData,
      title: historyItem.title || current.title,
      status: historyItem.status || current.status,
      changeSummary: `Reversión a la versión histórica v${targetVersion}`,
    };

    return this.updateProcedure(procedureId, restoredData, actor);
  }
}

const helpContentService = new HelpContentService();
module.exports = helpContentService;
