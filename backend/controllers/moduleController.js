const dataScraperService = require('../services/dataScraperService');

/**
 * CONTROLADOR DE MÓDULOS Y CATEGORÍAS DUOC UC
 * Sirve la arquitectura de información desde MongoDB (con caché inteligente y fallback en memoria)
 */
exports.getModules = async (req, res) => {
  try {
    const { q } = req.query;
    const allModules = await dataScraperService.getAllModules();

    if (q && q.trim() !== '') {
      const searchLower = q.toLowerCase().trim();
      const filtered = allModules.filter((cat) => {
        const matchTitle = (cat.categoryTitle || '').toLowerCase().includes(searchLower);
        const matchSub = (cat.submodules || []).some(
          (sub) =>
            (sub.title || '').toLowerCase().includes(searchLower) ||
            (sub.description || '').toLowerCase().includes(searchLower)
        );
        const matchFaq = (cat.faqs || []).some(
          (f) =>
            (f.question || '').toLowerCase().includes(searchLower) ||
            (f.answer || '').toLowerCase().includes(searchLower)
        );
        return matchTitle || matchSub || matchFaq;
      });

      return res.status(200).json({
        success: true,
        count: filtered.length,
        totalCategories: filtered.length,
        data: filtered,
      });
    }

    return res.status(200).json({
      success: true,
      count: allModules.length,
      totalCategories: allModules.length,
      data: allModules,
    });
  } catch (error) {
    console.error('[ModuleController] Error obteniendo módulos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los módulos institucionales',
    });
  }
};

exports.getModuleByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const category = await dataScraperService.getCategoryByKey(key);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el módulo con clave '${key}'`,
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

exports.syncOfficialHelpCenter = async (req, res) => {
  try {
    const result = await dataScraperService.syncFromOfficialHelpCenter();
    return res.status(200).json({
      success: true,
      message: 'Sincronización con Centro de Ayuda Oficial Duoc UC completada',
      categoriesCount: result.categoriesCount,
      sectionsCount: result.sectionsCount,
      articlesCount: result.articlesCount,
    });
  } catch (error) {
    console.error('[ModuleController] Error sincronizando Centro de Ayuda:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudo sincronizar con centroayuda.duoc.cl',
    });
  }
};
