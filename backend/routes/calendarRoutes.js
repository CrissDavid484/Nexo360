const express = require('express');
const router = express.Router();
const academicCalendarService = require('../services/academicCalendarService');
const { optionalToken } = require('../middleware/authMiddleware');

router.use(optionalToken);

/**
 * GET /api/calendar/current
 * Retorna la semana y semestre académico Duoc UC vigente (calculado dinámicamente).
 */
router.get('/current', async (req, res) => {
  try {
    const rawDate = req.query?.date ? String(req.query.date).trim() : '';
    if (rawDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use YYYY-MM-DD.',
        });
      }
      const [y, m, d] = rawDate.split('-').map(Number);
      const check = new Date(Date.UTC(y, m - 1, d));
      if (
        check.getUTCFullYear() !== y ||
        check.getUTCMonth() + 1 !== m ||
        check.getUTCDate() !== d
      ) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de calendario fuera de rango válido.',
        });
      }
    }

    const calendars = await academicCalendarService.getAllCalendars();
    const refDate = rawDate || new Date();
    const current = academicCalendarService.resolveAcademicWeekStatus(refDate, calendars);
    return res.status(200).json({
      success: true,
      current,
      calendarsCount: calendars.length,
    });
  } catch {
    console.error('[CalendarRoutes] Error obteniendo semana académica actual.');
    return res.status(500).json({
      success: false,
      message: 'No se pudo consultar el calendario académico actual.',
    });
  }
});

module.exports = router;
