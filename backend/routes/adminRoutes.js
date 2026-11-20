const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
  verifyToken,
  requireAdmin,
  requireAdminOrCoordinator,
  requirePaedisCoordinator,
} = require('../middleware/authMiddleware');

// Todas las rutas de administración están protegidas estrictamente con JWT
router.use(verifyToken);

// Métricas de uso de la plataforma, estadísticas PAEDIS y predicción
// Autorizado para Administradores y Coordinadores PAEDIS
router.get('/metrics', requireAdminOrCoordinator, adminController.getMetrics);

// Gestión y directorio de estudiantes con cálculo predictivo
// Consulta, alta y actualización de estado compartida; eliminación exclusiva para Administrador
router.get('/students', requireAdminOrCoordinator, adminController.getStudents);
router.post('/students', requireAdminOrCoordinator, adminController.createStudent);
router.put('/students/:id/status', requireAdminOrCoordinator, adminController.updateStudentStatus);
router.delete('/students/:id', requireAdmin, adminController.deleteStudent);

// Gestión y carga de asignaturas/oferta académica para Toma de Ramos (Excel/MD/DB)
// Consulta compartida; importación, inicialización (seed) y vaciado exclusivo de Administrador
router.get('/courses/summary', requireAdminOrCoordinator, adminController.getCoursesSummary);
router.post('/courses/import', requireAdmin, adminController.importCourses);
router.post('/courses/seed', requireAdmin, adminController.seedCourses);
router.delete('/courses', requireAdmin, adminController.clearCourses);

// Gestión dinámica de Carreras Duoc UC (CRUD)
// Consulta compartida; creación y eliminación exclusivas de Administrador
router.get('/careers', requireAdminOrCoordinator, adminController.getCareers);
router.post('/careers', requireAdmin, adminController.createCareer);
router.delete('/careers/:id', requireAdmin, adminController.deleteCareer);

// Gestión dinámica de Sedes Duoc UC (CRUD)
// Consulta compartida; creación y eliminación exclusivas de Administrador
router.get('/sedes', requireAdminOrCoordinator, adminController.getSedes);
router.post('/sedes', requireAdmin, adminController.createSede);
router.delete('/sedes/:id', requireAdmin, adminController.deleteSede);

// Sistema de Alerta Temprana (SAT) - Asistencia por Asignatura y Ficha 360 PAEDIS
// Autorizado para Administradores y Coordinadores PAEDIS
router.get('/sat-alerts', requireAdminOrCoordinator, adminController.getSatAlerts);
router.patch('/sat-alerts/:userId/simulate', requireAdminOrCoordinator, adminController.simulateSatCourse);
router.patch('/sat-alerts/:userId/intervention', requireAdminOrCoordinator, adminController.updateSatIntervention);

// Bitácora de Auditoría Institucional (ActivityLog) - Exclusivo para Administrador (Ley N° 21.719)
router.get('/activity-logs', requireAdmin, adminController.getActivityLogs);

// Centro de Operaciones de Inclusión PAEDIS - Gestión de Ajustes Razonables y Ficha Docente Confidencial
// Exclusivo para Coordinadores PAEDIS (Ley N° 21.719)
router.patch('/paedis/:id/case', requirePaedisCoordinator, adminController.updatePaedisCase);

module.exports = router;
