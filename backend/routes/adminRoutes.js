const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
  verifyToken,
  requireAdmin,
  requireAdminOrCoordinator,
  requirePaedisCoordinator,
  requirePermission,
} = require('../middleware/authMiddleware');

// Todas las rutas de administración están protegidas estrictamente con JWT
router.use(verifyToken);

// Métricas de uso de la plataforma, estadísticas PAEDIS y predicción
router.get(
  '/metrics',
  requireAdminOrCoordinator,
  requirePermission('institutional_overview', 'sat_monitoring', 'manage_users', 'manage_students'),
  adminController.getMetrics
);
router.get(
  '/simulator-snapshots',
  requireAdminOrCoordinator,
  requirePermission('institutional_overview', 'sat_monitoring', 'manage_users', 'manage_students'),
  adminController.getSimulatorSnapshots
);

// Gestión y directorio de estudiantes con cálculo predictivo
router.get(
  '/students',
  requireAdminOrCoordinator,
  requirePermission('manage_students', 'manage_users', 'sat_monitoring', 'paedis_read'),
  adminController.getStudents
);
router.post(
  '/students',
  requireAdminOrCoordinator,
  requirePermission('manage_students', 'manage_users'),
  adminController.createStudent
);
router.put(
  '/students/:id/status',
  requireAdminOrCoordinator,
  requirePermission('manage_students', 'manage_users'),
  adminController.updateStudentStatus
);
router.patch(
  '/users/:id/role',
  requireAdmin,
  requirePermission('manage_users'),
  adminController.updateUserRole
);
router.patch(
  '/users/:id/permissions',
  requireAdmin,
  requirePermission('manage_users'),
  adminController.updateUserPermissions
);
router.delete(
  '/students/:id',
  requireAdmin,
  requirePermission('manage_users'),
  adminController.deleteStudent
);

// Gestión y carga de asignaturas/oferta académica para Toma de Ramos (Excel/MD/DB)
router.get(
  '/courses/summary',
  requireAdminOrCoordinator,
  requirePermission('manage_catalogs', 'institutional_overview', 'sat_monitoring'),
  adminController.getCoursesSummary
);
router.post(
  '/courses/import',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.importCourses
);
router.post(
  '/courses/seed',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.seedCourses
);
router.delete(
  '/courses',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.clearCourses
);

// Gestión dinámica de Carreras Duoc UC (CRUD)
router.get(
  '/careers',
  requireAdminOrCoordinator,
  requirePermission('manage_catalogs', 'manage_students', 'institutional_overview'),
  adminController.getCareers
);
router.post(
  '/careers',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.createCareer
);
router.put(
  '/careers/:id',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.updateCareer
);
router.delete(
  '/careers/:id',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.deleteCareer
);

// Gestión dinámica de Sedes Duoc UC (CRUD)
router.get(
  '/sedes',
  requireAdminOrCoordinator,
  requirePermission('manage_catalogs', 'manage_students', 'institutional_overview'),
  adminController.getSedes
);
router.post(
  '/sedes',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.createSede
);
router.put(
  '/sedes/:id',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.updateSede
);
router.delete(
  '/sedes/:id',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.deleteSede
);

// Intervenciones persistentes de seguimiento estudiantil (Bitácora interna SAT/PAEDIS)
router.post(
  '/students/:id/interventions',
  requireAdminOrCoordinator,
  requirePermission('manage_students', 'sat_monitoring', 'paedis_write'),
  adminController.createStudentIntervention
);
router.get(
  '/students/:id/interventions',
  requireAdminOrCoordinator,
  requirePermission('manage_students', 'sat_monitoring', 'paedis_write'),
  adminController.getStudentInterventions
);

// Sistema de Alerta Temprana (SAT) - Asistencia por Asignatura y Ficha 360 PAEDIS
router.get(
  '/sat-alerts',
  requireAdminOrCoordinator,
  requirePermission('sat_monitoring', 'manage_students'),
  adminController.getSatAlerts
);
router.patch(
  '/sat-alerts/:userId/simulate',
  requireAdminOrCoordinator,
  requirePermission('sat_monitoring'),
  adminController.simulateSatCourse
);
router.patch(
  '/sat-alerts/:userId/intervention',
  requireAdminOrCoordinator,
  requirePermission('sat_monitoring'),
  adminController.updateSatIntervention
);

// Gestión de Calendario Académico Duoc UC (PDF 2026-2027)
router.get(
  '/academic-calendar',
  requireAdminOrCoordinator,
  requirePermission('manage_catalogs', 'institutional_overview', 'sat_monitoring'),
  adminController.getAcademicCalendars
);
router.post(
  '/academic-calendar/import',
  requireAdmin,
  requirePermission('manage_catalogs'),
  adminController.importAcademicCalendar
);

// Bitácora de Auditoría Institucional (ActivityLog) - Exclusivo para Administrador (Ley N° 21.719)
router.get(
  '/activity-logs',
  requireAdmin,
  requirePermission('audit_logs'),
  adminController.getActivityLogs
);
router.get(
  '/activity-logs/export',
  requireAdmin,
  requirePermission('audit_logs'),
  adminController.exportActivityLogs
);

// Centro de Operaciones de Inclusión PAEDIS - Gestión de Ajustes Razonables y Ficha Docente Confidencial
// Exclusivo para Coordinadores PAEDIS (Ley N° 21.719)
router.get(
  '/paedis/:id/record',
  requirePaedisCoordinator,
  requirePermission('paedis_read'),
  adminController.getPaedisRecord
);
router.patch(
  '/paedis/:id/case',
  requirePaedisCoordinator,
  requirePermission('paedis_write'),
  adminController.updatePaedisCase
);

module.exports = router;
