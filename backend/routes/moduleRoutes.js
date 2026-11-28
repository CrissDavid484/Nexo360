const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { verifyToken, requirePermission } = require('../middleware/authMiddleware');

// 1. Rutas públicas de consulta para estudiantes y Centro de Ayuda
router.get('/', moduleController.getModules);
router.get('/:key', moduleController.getModuleByKey);

// 2. Rutas administrativas de gestión editorial de contenidos (Épica E-005)
// Solo personal autorizado con manage_help_content, manage_catalogs o full_access
const editorialAuth = [verifyToken, requirePermission(['manage_help_content', 'manage_catalogs', 'full_access'])];

router.get('/admin/all', ...editorialAuth, moduleController.getAllProceduresAdmin);
router.post('/admin/procedure', ...editorialAuth, moduleController.createProcedure);
router.put('/admin/procedure/:id', ...editorialAuth, moduleController.updateProcedure);
router.patch('/admin/procedure/:id/status', ...editorialAuth, moduleController.updateProcedureStatus);
router.post('/admin/procedure/:id/rollback/:version', ...editorialAuth, moduleController.rollbackProcedureVersion);

module.exports = router;
