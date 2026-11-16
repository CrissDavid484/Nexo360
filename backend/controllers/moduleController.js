const { INSTITUTIONAL_MODULES } = require('../data/institutionalModules');

/**
 * CONTROLADOR DE MÓDULOS Y CATEGORÍAS INSTITUCIONALES DUOC UC
 * Servidos directamente para la navegación del Centro de Ayuda de Nexo360
 */
exports.getModules = async (req, res) => {
  try {
    const { q } = req.query;

    if (q && q.trim() !== '') {
      const searchLower = q.toLowerCase().trim();
      const filtered = INSTITUTIONAL_MODULES.filter((cat) => {
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
      count: INSTITUTIONAL_MODULES.length,
      totalCategories: INSTITUTIONAL_MODULES.length,
      data: INSTITUTIONAL_MODULES,
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
    const category = INSTITUTIONAL_MODULES.find((m) => m.categoryKey === key);

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
