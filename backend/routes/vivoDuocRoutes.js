const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const vivoDuocController = require('../controllers/vivoDuocController');

router.use(verifyToken);

router.get('/dashboard', vivoDuocController.getDashboard);

module.exports = router;