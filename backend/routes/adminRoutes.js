const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin, requireAdminOrCoordinator } = require('../middleware/authMiddleware');

// Todas las rutas de administración están protegidas estrictamente con JWT
router.use(verifyToken);

// Métricas de uso de la plataforma, estadísticas PAEDIS y predicción (Solo Administrador)
router.get('/metrics', requireAdmin, adminController.getMetrics);

// Gestión y directorio de estudiantes con cálculo predictivo (Solo Administrador)
router.get('/students', requireAdmin, adminController.getStudents);
router.post('/students', requireAdmin, adminController.createStudent);
router.put('/students/:id/status', requireAdmin, adminController.updateStudentStatus);
router.delete('/students/:id', requireAdmin, adminController.deleteStudent);

// Gestión y carga de asignaturas/oferta académica para Toma de Ramos (Excel/MD/DB)
// Autorizado para Administradores y Coordinadores PAEDIS
router.get('/courses/summary', requireAdminOrCoordinator, adminController.getCoursesSummary);
router.post('/courses/import', requireAdminOrCoordinator, adminController.importCourses);
router.post('/courses/seed', requireAdminOrCoordinator, adminController.seedCourses);
router.delete('/courses', requireAdminOrCoordinator, adminController.clearCourses);

module.exports = router;
