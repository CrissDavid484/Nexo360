const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Todas las rutas de administración están protegidas estrictamente con JWT y rol 'admin'
router.use(verifyToken);
router.use(requireAdmin);

// Métricas de uso de la plataforma, estadísticas PAEDIS y predicción
router.get('/metrics', adminController.getMetrics);

// Gestión y directorio de estudiantes con cálculo predictivo
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:id/status', adminController.updateStudentStatus);
router.delete('/students/:id', adminController.deleteStudent);

module.exports = router;
