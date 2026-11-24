const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const zlib = require('zlib');
const jwt = require('jsonwebtoken');

const app = require('../server');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { request, setBaseUrl } = require('./testHelper');
const academicCalendarService = require('../services/academicCalendarService');
const simulatorSnapshotService = require('../services/simulatorSnapshotService');

let server;
let baseUrl;

function buildSyntheticPdfBuffer(lines) {
  const streamOps = [
    'BT',
    '/F1 12 Tf',
    ...lines.flatMap((line, idx) => [
      `1 0 0 1 40 ${760 - idx * 20} Tm`,
      `(${line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj`,
      'T*',
    ]),
    'ET',
  ].join('\n');

  const compressed = zlib.deflateSync(Buffer.from(streamOps, 'latin1'));
  return Buffer.concat([
    Buffer.from('%PDF-1.7\n1 0 obj\n<< /Length ' + compressed.length + ' /Filter /FlateDecode >>\nstream\n', 'latin1'),
    compressed,
    Buffer.from('\nendstream\nendobj\n%%EOF', 'latin1'),
  ]);
}

describe('CALENDARIO ACADÉMICO DUOC UC (2026-2027) Y SNAPSHOTS SIMULADOR (03:00 / 15:00)', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        setBaseUrl(baseUrl);
        resolve();
      });
    });
  });

  after(async () => {
    simulatorSnapshotService.stopSnapshotScheduler();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    simulatorSnapshotService.resetInMemorySnapshots();
  });

  const adminToken = jwt.sign(
    { id: 'seed_admin_c_guzman', email: 'c.guzman@duocuc.cl', role: 'admin', fullName: 'Cristian Guzmán' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );
  const coordinatorToken = jwt.sign(
    { id: 'seed_coord_paedis', email: 'coord.paedis@duoc.cl', role: 'coordinador_paedis', fullName: 'Coordinador PAEDIS' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );
  const studentToken = jwt.sign(
    { id: 'seed_est_m_contreras', email: 'm.contreras@duocuc.cl', role: 'estudiante', fullName: 'Matías Contreras' },
    getJwtSecret(),
    { algorithm: 'HS256' }
  );

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const coordinatorHeaders = { Authorization: `Bearer ${coordinatorToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  test('1. Regla oficial Duoc UC 2026-2027: Semana 0 exclusiva 1° año, Semana 1..N y reinicio en Semestre 2', () => {
    // TAV Enero 2026
    const tav2026 = academicCalendarService.resolveAcademicWeekStatus('2026-01-10');
    assert.equal(tav2026.year, 2026);
    assert.equal(tav2026.phase, 'TAV');
    assert.equal(tav2026.weekNumber, 1);

    // Semana 0 exclusiva 1° año (2026 y 2027)
    const w0_2026 = academicCalendarService.resolveAcademicWeekStatus('2026-03-04');
    assert.equal(w0_2026.phase, 'WEEK_ZERO');
    assert.equal(w0_2026.weekNumber, 0);
    assert.equal(w0_2026.totalWeeks, 18);
    assert.equal(w0_2026.isWeekZero, true);
    assert.equal(w0_2026.firstYearOnly, true);
    assert.equal(w0_2026.label, 'Semana 0 (1° Año) • 1° Semestre');
    assert.ok(w0_2026.upperYearNote.includes('2026-03-09'));

    const w0_2027 = academicCalendarService.resolveAcademicWeekStatus('2027-03-03');
    assert.equal(w0_2027.year, 2027);
    assert.equal(w0_2027.phase, 'WEEK_ZERO');
    assert.equal(w0_2027.totalWeeks, 18);
    assert.equal(w0_2027.isWeekZero, true);
    assert.equal(w0_2027.firstYearOnly, true);
    assert.equal(w0_2027.label, 'Semana 0 (1° Año) • 1° Semestre');
    assert.ok(w0_2027.upperYearNote.includes('2027-03-08'));

    // Semana 1 Semestre 1 (2026-03-09)
    const s1w1 = academicCalendarService.resolveAcademicWeekStatus('2026-03-09');
    assert.equal(s1w1.semester, 1);
    assert.equal(s1w1.weekNumber, 1);
    assert.equal(s1w1.totalWeeks, 18);
    assert.equal(s1w1.phase, 'CLASSES');
    assert.equal(s1w1.isWeekZero, false);
    assert.equal(s1w1.label, 'Semana 1/18 • 1° Semestre');

    // Exámenes Semestre 1 (2026-07-08 y semana tardía 2026-07-20 clamped a 18/18)
    const s1Exams = academicCalendarService.resolveAcademicWeekStatus('2026-07-08');
    assert.equal(s1Exams.semester, 1);
    assert.equal(s1Exams.phase, 'EXAMS');
    assert.equal(s1Exams.weekNumber, 18);
    assert.equal(s1Exams.totalWeeks, 18);
    assert.equal(s1Exams.label, 'Semana 18/18 (Exámenes) • 1° Semestre');

    const s1ExamsLate = academicCalendarService.resolveAcademicWeekStatus('2026-07-20');
    assert.equal(s1ExamsLate.phase, 'EXAMS');
    assert.equal(s1ExamsLate.weekNumber, 18);
    assert.equal(s1ExamsLate.totalWeeks, 18);
    assert.equal(s1ExamsLate.label, 'Semana 18/18 (Exámenes) • 1° Semestre');

    // Receso de Invierno (2026-07-28)
    const recess = academicCalendarService.resolveAcademicWeekStatus('2026-07-28');
    assert.equal(recess.phase, 'RECESS');
    assert.equal(recess.weekNumber, null);
    assert.equal(recess.totalWeeks, 18);

    // Reinicio a Semana 1 en Semestre 2 (2026-08-10 y 2027-08-09)
    const s2w1_2026 = academicCalendarService.resolveAcademicWeekStatus('2026-08-10');
    assert.equal(s2w1_2026.semester, 2);
    assert.equal(s2w1_2026.weekNumber, 1);
    assert.equal(s2w1_2026.totalWeeks, 18);
    assert.equal(s2w1_2026.phase, 'CLASSES');
    assert.equal(s2w1_2026.label, 'Semana 1/18 • 2° Semestre');

    const s2w1_2027 = academicCalendarService.resolveAcademicWeekStatus('2027-08-09');
    assert.equal(s2w1_2027.year, 2027);
    assert.equal(s2w1_2027.semester, 2);
    assert.equal(s2w1_2027.weekNumber, 1);
    assert.equal(s2w1_2027.totalWeeks, 18);
    assert.equal(s2w1_2027.label, 'Semana 1/18 • 2° Semestre');

    // Fecha actual de referencia 2026-11-24 -> Semana 16/18 • 2° Semestre
    const nov24 = academicCalendarService.resolveAcademicWeekStatus('2026-11-24');
    assert.equal(nov24.semester, 2);
    assert.equal(nov24.weekNumber, 16);
    assert.equal(nov24.totalWeeks, 18);
    assert.equal(nov24.label, 'Semana 16/18 • 2° Semestre');
  });

  test('2. Parser PDF Calendario Académico descomprime FlateDecode y extrae fechas de nuevos años', () => {
    const pdfBuffer = buildSyntheticPdfBuffer([
      'RESOLUCION N° 9/2028 FIJA CALENDARIO ACADEMICO 2028',
      '1er Semestre 2028-1',
      'Induccion Estudiantes de Inicio (Semana Cero) 06-03-2028 al 11-03-2028',
      'Clases Temporada Academica Ordinaria 13-03-2028 al 22-07-2028',
      'Periodo de Examenes 03-07-2028 al 22-07-2028',
      'Cierre Academico y Termino del Semestre 24-07-2028',
      '2do Semestre 2028-2',
      'Clases Temporada Academica Ordinaria 07-08-2028 al 19-12-2028',
      'Periodo de Examenes 04-12-2028 al 19-12-2028',
      'Cierre Academico y Termino del Semestre 20-12-2028',
    ]);

    const parsed = academicCalendarService.parseAcademicCalendarPdf({
      buffer: pdfBuffer,
      fileName: 'calendario-2028.pdf',
    });

    assert.equal(parsed.calendar.year, 2028);
    assert.equal(parsed.calendar.semesters[0].weekZeroStart, '2028-03-06');
    assert.equal(parsed.calendar.semesters[0].weekZeroEnd, '2028-03-11');
    assert.equal(parsed.calendar.semesters[0].classesStart, '2028-03-13');
    assert.equal(parsed.calendar.semesters[0].examsStart, '2028-07-03');
    assert.equal(parsed.calendar.semesters[0].closeDate, '2028-07-24');
    assert.equal(parsed.calendar.semesters[1].classesStart, '2028-08-07');
    assert.equal(parsed.calendar.semesters[1].closeDate, '2028-12-20');
    assert.equal(parsed.calendar.winterRecess.start, '2028-07-25');
    assert.equal(parsed.calendar.winterRecess.end, '2028-08-06');
    assert.ok(parsed.detectedFields.includes('Semana 0 (1° Año)'));
    assert.ok(parsed.detectedFields.includes('Período de Clases'));
    assert.equal(parsed.warnings.length, 0);
  });

  test('3. Snapshots programados del simulador: cortes 03:00 / 15:00, deduplicación y lectura sin recálculo', async () => {
    // getNextScheduledCut antes de las 03:00, entre 03:00 y 15:00, y después de las 15:00 Chile (-03:00 en noviembre)
    const before03 = new Date('2026-11-24T05:30:00Z'); // 02:30 Chile
    assert.equal(simulatorSnapshotService.getNextScheduledCut(before03), '2026-11-24 03:00 (America/Santiago)');

    const midDay = new Date('2026-11-24T13:00:00Z'); // 10:00 Chile
    assert.equal(simulatorSnapshotService.getNextScheduledCut(midDay), '2026-11-24 15:00 (America/Santiago)');

    const evening = new Date('2026-11-24T22:00:00Z'); // 19:00 Chile
    assert.equal(simulatorSnapshotService.getNextScheduledCut(evening), '2026-11-25 03:00 (America/Santiago)');

    // runScheduledTick fuera de ventana (10:00) no crea snapshot
    const ignored = await simulatorSnapshotService.runScheduledTick(midDay);
    assert.equal(ignored, null);

    // runScheduledTick a las 03:01 Chile (06:01Z en noviembre) crea snapshot '03:00' y deduplica si se reintenta
    const at03 = new Date('2026-11-24T06:01:00Z');
    const cut03 = await simulatorSnapshotService.runScheduledTick(at03);
    assert.ok(cut03);
    assert.equal(cut03.slot, '03:00');
    assert.equal(cut03.slotDateKey, '2026-11-24_03:00');

    const duplicate03 = await simulatorSnapshotService.runScheduledTick(at03);
    assert.equal(duplicate03, null);

    // runScheduledTick a las 15:02 Chile (18:02Z en noviembre) crea snapshot '15:00'
    const at15 = new Date('2026-11-24T18:02:00Z');
    const cut15 = await simulatorSnapshotService.runScheduledTick(at15);
    assert.ok(cut15);
    assert.equal(cut15.slot, '15:00');
    assert.equal(cut15.slotDateKey, '2026-11-24_15:00');

    const latest = await simulatorSnapshotService.getLatestSnapshot();
    assert.equal(latest.slotDateKey, '2026-11-24_15:00');
    assert.ok(Array.isArray(latest.careerBreakdown));
    assert.ok(Array.isArray(latest.topDemandedSections));

    const history = await simulatorSnapshotService.listSnapshots(10);
    assert.equal(history.length, 2);
  });

  test('4. Endpoints HTTP: /api/calendar/current, /api/admin/simulator-snapshots y /api/admin/academic-calendar/import', async () => {
    const publicCal = await request('/api/calendar/current?date=2026-11-24', { headers: studentHeaders });
    assert.equal(publicCal.status, 200);
    assert.equal(publicCal.body.success, true);
    assert.equal(publicCal.body.current.semester, 2);
    assert.equal(publicCal.body.current.weekNumber, 16);
    assert.equal(publicCal.body.current.totalWeeks, 18);
    assert.equal(publicCal.body.current.label, 'Semana 16/18 • 2° Semestre');

    // Lunes de inicio Semestre 2 (no debe retroceder al domingo por parseo UTC)
    const boundaryMonday = await request('/api/calendar/current?date=2026-08-10', { headers: studentHeaders });
    assert.equal(boundaryMonday.status, 200);
    assert.equal(boundaryMonday.body.current.phase, 'CLASSES');
    assert.equal(boundaryMonday.body.current.semester, 2);
    assert.equal(boundaryMonday.body.current.weekNumber, 1);
    assert.equal(boundaryMonday.body.current.totalWeeks, 18);
    assert.equal(boundaryMonday.body.current.label, 'Semana 1/18 • 2° Semestre');

    const badDate = await request('/api/calendar/current?date=no-valida', { headers: studentHeaders });
    assert.equal(badDate.status, 400);

    const snapsStudent = await request('/api/admin/simulator-snapshots', { headers: studentHeaders });
    assert.equal(snapsStudent.status, 403);

    const snapsAdmin = await request('/api/admin/simulator-snapshots?limit=5', { headers: adminHeaders });
    assert.equal(snapsAdmin.status, 200);
    assert.equal(snapsAdmin.body.success, true);
    assert.ok(snapsAdmin.body.latest);
    assert.deepEqual(snapsAdmin.body.schedule.slots, ['03:00', '15:00']);

    // Coordinador PAEDIS puede consultar calendario admin pero NO importar PDF (solo Admin)
    const coordCal = await request('/api/admin/academic-calendar', { headers: coordinatorHeaders });
    assert.equal(coordCal.status, 200);
    assert.ok(Array.isArray(coordCal.body.calendars));

    const pdfBuf = buildSyntheticPdfBuffer([
      'Calendario Academico 2029',
      '1er Semestre 2029-1',
      'Induccion Estudiantes de Inicio 05-03-2029 al 10-03-2029',
      'Clases Temporada Academica Ordinaria 12-03-2029 al 21-07-2029',
      '2do Semestre 2029-2',
      'Clases Temporada Academica Ordinaria 06-08-2029 al 18-12-2029',
    ]);
    const fileBase64 = pdfBuf.toString('base64');

    const coordImport = await request('/api/admin/academic-calendar/import?dryRun=true', {
      method: 'POST',
      headers: coordinatorHeaders,
      body: { fileBase64, fileName: 'calendario-2029.pdf' },
    });
    assert.equal(coordImport.status, 403);

    const dryRunRes = await request('/api/admin/academic-calendar/import?dryRun=true', {
      method: 'POST',
      headers: adminHeaders,
      body: { fileBase64, fileName: 'calendario-2029.pdf' },
    });
    assert.equal(dryRunRes.status, 200);
    assert.equal(dryRunRes.body.dryRun, true);
    assert.equal(dryRunRes.body.preview.calendar.year, 2029);
    assert.equal(dryRunRes.body.preview.calendar.semesters[0].weekZeroStart, '2029-03-05');
  });
});
