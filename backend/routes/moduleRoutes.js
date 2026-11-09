const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');

// Rutas públicas de módulos institucionales (con caché inteligente en MongoDB)
router.get('/', moduleController.getModules);
router.get('/:key', moduleController.getModuleByKey);

module.exports = router;
