const express = require('express');
const router = express.Router();
const courseService = require('../services/courseService');
const adminController = require('../controllers/adminController');
const { optionalToken, verifyToken, requireAdminOrCoordinator } = require('../middleware/authMiddleware');

router.use(optionalToken);

/**
 * GET /api/courses
 * Obtiene la lista de asignaturas y secciones para el simulador de estudiantes y tutores
 * Query params: ?carrera=...&periodo=...&jornada=...&random=true&limit=...&format=md|json
 */
router.get('/', async (req, res) => {
  try {
    const { carrera, periodo, jornada, random, limit, format } = req.query;
    const courses = await courseService.getCoursesForSimulation({
      carrera,
      periodo: periodo || '2026 - 002',
      jornada,
      random: random === 'true' || random === '1',
      limit: limit ? parseInt(limit, 10) : 8,
    });

    if (format === 'md' || format === 'markdown') {
      const markdown = await courseService.exportToMarkdown({
        carrera,
        periodo: periodo || '2026 - 002',
      });
      return res.status(200).type('text/markdown').send(markdown);
    }

    res.status(200).json({
      success: true,
      total: courses.length,
      carrera: carrera || 'TODAS',
      periodo: periodo || '2026 - 002',
      courses,
    });
  } catch (error) {
    console.error('Error al obtener asignaturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al consultar asignaturas para el simulador.',
      error: error.message,
    });
  }
});

/**
 * GET /api/courses/careers
 * Obtiene el resumen de carreras disponibles con sus planes y conteos
 */
router.get('/careers', async (req, res) => {
  try {
    const careers = await courseService.getCareersSummary();
    res.status(200).json({
      success: true,
      total: careers.length,
      careers,
    });
  } catch (error) {
    console.error('Error al obtener carreras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar carreras.',
      error: error.message,
    });
  }
});

/**
 * POST /api/courses/import
 * Soporte de carga e importación para administradores y coordinadores PAEDIS
 */
router.post('/import', verifyToken, requireAdminOrCoordinator, adminController.importCourses);

module.exports = router;
