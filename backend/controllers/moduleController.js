const helpContentService = require('../services/helpContentService');
const INSTITUTIONAL_MODULES_FALLBACK = require('../data/institutionalModules.json');

/**
 * CONTROLADOR DE MÓDULOS Y TRÁMITES INSTITUCIONALES (ÉPICA E-005)
 * Soporta navegación pública del Centro de Ayuda y gestión editorial administrativa.
 */

// 1. Obtiene categorías y trámites publicados (público)
exports.getModules = async (req, res) => {
  try {
    const { q } = req.query;
    let categories = await helpContentService.getPublishedCategories(q);
    if (!categories || categories.length === 0) {
      categories = INSTITUTIONAL_MODULES_FALLBACK;
    }

    return res.status(200).json({
      success: true,
      count: categories.length,
      totalCategories: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('[ModuleController] Error obteniendo módulos:', error.message);
    // Fallback defensivo a semilla estática si ocurre una falla imprevista
    return res.status(200).json({
      success: true,
      count: INSTITUTIONAL_MODULES_FALLBACK.length,
      totalCategories: INSTITUTIONAL_MODULES_FALLBACK.length,
      data: INSTITUTIONAL_MODULES_FALLBACK,
    });
  }
};

// 2. Obtiene un módulo/trámite por clave (público)
exports.getModuleByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const cleanKey = String(key || '').toLowerCase().trim();

    // Primero buscar trámite individual
    const procedure = await helpContentService.getProcedureById(cleanKey);
    if (procedure && procedure.status === 'published') {
      return res.status(200).json({
        success: true,
        data: procedure,
      });
    }

    // Buscar como categoría agrupada
    const categories = await helpContentService.getPublishedCategories();
    const category = categories.find((c) => c.categoryKey === cleanKey);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el módulo o trámite con clave '${key}'`,
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('[ModuleController] Error obteniendo módulo por clave:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar el módulo solicitado',
    });
  }
};

// 3. Listado administrativo completo de trámites (borradores, publicados, archivados)
exports.getAllProceduresAdmin = async (req, res) => {
  try {
    const { status, categoryKey, search } = req.query;
    const list = await helpContentService.getAllProceduresAdmin({ status, categoryKey, search });
    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    console.error('[ModuleController] Error listando trámites admin:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al listar trámites editoriales',
    });
  }
};

// 4. Crear nuevo trámite (administración editorial)
exports.createProcedure = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.procedureId) {
      return res.status(400).json({
        success: false,
        message: 'Título y código del trámite son obligatorios.',
      });
    }

    const created = await helpContentService.createProcedure(body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Trámite editorial creado exitosamente.',
      data: created,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al crear trámite editorial',
    });
  }
};

// 5. Modificar trámite existente (incrementa versión y guarda historial)
exports.updateProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const updated = await helpContentService.updateProcedure(id, body, req.user);
    return res.status(200).json({
      success: true,
      message: `Trámite '${id}' actualizado a versión ${updated.version}.`,
      data: updated,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al actualizar trámite editorial',
    });
  }
};

// 6. Cambiar estado de publicación (draft, published, archived)
exports.updateProcedureStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Estado de publicación requerido (draft, published, archived).',
      });
    }

    const updated = await helpContentService.setProcedureStatus(id, status, req.user);
    return res.status(200).json({
      success: true,
      message: `Estado del trámite '${id}' cambiado a '${status}'.`,
      data: updated,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al actualizar estado editorial',
    });
  }
};

// 7. Reversión a versión anterior (rollback)
exports.rollbackProcedureVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    const restored = await helpContentService.rollbackProcedureVersion(id, version, req.user);
    return res.status(200).json({
      success: true,
      message: `Trámite '${id}' restaurado exitosamente desde la versión v${version}.`,
      data: restored,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al restaurar versión del trámite',
    });
  }
};
