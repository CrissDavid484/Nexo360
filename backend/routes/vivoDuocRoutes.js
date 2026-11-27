const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const vivoDuocController = require('../controllers/vivoDuocController');

router.use(verifyToken);

router.get('/dashboard', vivoDuocController.getDashboard);
router.get('/profile', vivoDuocController.getProfile);
router.get('/attendance', vivoDuocController.getAttendance);
router.get('/grades', vivoDuocController.getGrades);
router.get('/schedule', vivoDuocController.getSchedule);

module.exports = router;
