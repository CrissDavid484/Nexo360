const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { verifyToken } = require('../middleware/authMiddleware');

// Rutas de módulos (se pueden consultar abiertamente o protegidas)
router.get('/', moduleController.getModules);
router.get('/:key', moduleController.getModuleByKey);

module.exports = router;
