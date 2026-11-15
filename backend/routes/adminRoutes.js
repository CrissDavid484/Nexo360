const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdminOrCoordinator } = require('../middleware/authMiddleware');

// Todas las rutas de administración están protegidas estrictamente con JWT
router.use(verifyToken);

// Métricas de uso de la plataforma, estadísticas PAEDIS y predicción
// Autorizado para Administradores y Coordinadores PAEDIS
router.get('/metrics', requireAdminOrCoordinator, adminController.getMetrics);

// Gestión y directorio de estudiantes con cálculo predictivo
// Autorizado para Administradores y Coordinadores PAEDIS
router.get('/students', requireAdminOrCoordinator, adminController.getStudents);
router.post('/students', requireAdminOrCoordinator, adminController.createStudent);
router.put('/students/:id/status', requireAdminOrCoordinator, adminController.updateStudentStatus);
router.delete('/students/:id', requireAdminOrCoordinator, adminController.deleteStudent);

// Gestión y carga de asignaturas/oferta académica para Toma de Ramos (Excel/MD/DB)
// Autorizado para Administradores y Coordinadores PAEDIS
router.get('/courses/summary', requireAdminOrCoordinator, adminController.getCoursesSummary);
router.post('/courses/import', requireAdminOrCoordinator, adminController.importCourses);
router.post('/courses/seed', requireAdminOrCoordinator, adminController.seedCourses);
router.delete('/courses', requireAdminOrCoordinator, adminController.clearCourses);

// Gestión dinámica de Carreras Duoc UC (CRUD)
router.get('/careers', requireAdminOrCoordinator, adminController.getCareers);
router.post('/careers', requireAdminOrCoordinator, adminController.createCareer);
router.delete('/careers/:id', requireAdminOrCoordinator, adminController.deleteCareer);

// Gestión dinámica de Sedes Duoc UC (CRUD)
router.get('/sedes', requireAdminOrCoordinator, adminController.getSedes);
router.post('/sedes', requireAdminOrCoordinator, adminController.createSede);
router.delete('/sedes/:id', requireAdminOrCoordinator, adminController.deleteSede);

module.exports = router;
