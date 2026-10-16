const dataScraperService = require('../services/dataScraperService');

/**
 * Obtener todos los módulos y FAQs con soporte de caché MongoDB
 * GET /api/modules
 */
exports.getModules = async (req, res) => {
  try {
    const modules = await dataScraperService.getAllModules();
    return res.status(200).json({
      success: true,
      data: modules,
    });
  } catch (error) {
    console.error('[moduleController.getModules]', error);
    return res.status(500).json({
      success: false,
      message: 'Error al recuperar los módulos institucionales.',
    });
  }
};

/**
 * Obtener detalles y FAQs de un módulo específico
 * GET /api/modules/:key
 */
exports.getModuleByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const category = await dataScraperService.getCategoryByKey(key);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Módulo institucional no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('[moduleController.getModuleByKey]', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la categoría seleccionada.',
    });
  }
};
