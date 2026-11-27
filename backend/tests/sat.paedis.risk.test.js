const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const PaedisRecord = require('../models/PaedisRecord');
const UserProfile = require('../models/UserProfile');
const AttendanceSimulation = require('../models/AttendanceSimulation');
const StudentIntervention = require('../models/StudentIntervention');
const satAlertService = require('../services/satAlertService');
const predictiveRiskService = require('../services/predictiveRiskService');
const simulatorSnapshotService = require('../services/simulatorSnapshotService');
const { SicolAdapter } = require('../services/adapters/sicolAdapter');
const { LibCalAdapter } = require('../services/adapters/libcalAdapter');
const { SmtpAdapter, SMTP_DELIVERY_STATES } = require('../services/adapters/smtpAdapter');

describe('SAT, PAEDIS, Riesgo Predictivo, Snapshots y Adaptadores — Suite Integral', () => {
  // ============================================================
  // 1. satAlertService — Reglas canónicas, umbrales y simulación
  // ============================================================
  test('SAT: 0 clases registradas retorna severity NO_DATA y attendancePercentage null', () => {
    const resZero = satAlertService.calculateCourseSatStatus({
      courseCode: 'MAT101',
      totalSessions: 0,
      attendedSessions: 0,
      attendancePercentage: 100, // default Mongoose debe ser ignorado si total=0
    });
    assert.equal(resZero.severity, 'NO_DATA');
    assert.equal(resZero.attendancePercentage, null);
    assert.equal(resZero.isAlert, false);

    const resCompletedZero = satAlertService.calculateCourseSatStatus({
      courseCode: 'MAT102',
      completedSessions: 0,
      attendedSessions: 0,
    });
    assert.equal(resCompletedZero.severity, 'NO_DATA');
    assert.equal(resCompletedZero.attendancePercentage, null);
  });

  test('SAT: Umbrales exactos 69.9% (RI Crítico), 70.0% (Preventivo), 74.9% (Preventivo) y 75.0% (Regular)', () => {
    assert.equal(satAlertService.DEFAULT_MIN_ATTENDANCE, 70);
    assert.equal(satAlertService.PREVENTIVE_UPPER_BOUND, 74.9);

    const at699 = satAlertService.calculateCourseSatStatus({
      courseCode: 'PRG101',
      totalSessions: 1000,
      attendedSessions: 699,
      attendancePercentage: 69.9,
    });
    assert.equal(at699.severity, 'LEVEL_2_CRITICAL');
    assert.equal(at699.isAlert, true);

    const at700 = satAlertService.calculateCourseSatStatus({
      courseCode: 'PRG101',
      totalSessions: 20,
      attendedSessions: 14,
      attendancePercentage: 70.0,
    });
    assert.equal(at700.severity, 'LEVEL_1_PREVENTIVE');
    assert.equal(at700.isAlert, true);

    const at749 = satAlertService.calculateCourseSatStatus({
      courseCode: 'PRG101',
      totalSessions: 1000,
      attendedSessions: 749,
      attendancePercentage: 74.9,
    });
    assert.equal(at749.severity, 'LEVEL_1_PREVENTIVE');

    const at750 = satAlertService.calculateCourseSatStatus({
      courseCode: 'PRG101',
      totalSessions: 20,
      attendedSessions: 15,
      attendancePercentage: 75.0,
    });
    assert.equal(at750.severity, 'NONE');
    assert.equal(at750.isAlert, false);
  });

  test('SAT: Umbral diferenciado por asignatura teórica vs práctica (minAttendanceRequired)', () => {
    const teorica = satAlertService.calculateCourseSatStatus({
      courseCode: 'TEO101',
      activityType: 'TEORICA',
      minAttendanceRequired: 70,
      totalSessions: 20,
      attendedSessions: 15,
      attendancePercentage: 75.0,
    });
    assert.equal(teorica.severity, 'NONE');
    assert.equal(teorica.minAttendanceRequired, 70);

    const practica = satAlertService.calculateCourseSatStatus({
      courseCode: 'LAB201',
      activityType: 'PRACTICA',
      minAttendanceRequired: 80,
      totalSessions: 20,
      attendedSessions: 15,
      attendancePercentage: 75.0,
    });
    assert.equal(practica.severity, 'LEVEL_2_CRITICAL');
    assert.equal(practica.minAttendanceRequired, 80);
    assert.equal(practica.activityType, 'PRACTICA');
  });

  test('SAT Simulación: Asistencia futura (12/20 -> 13/21 = 61.9%) y falta futura (12/21 = 57.1%)', () => {
    const baseCourse = {
      courseCode: 'APY4461',
      courseName: 'Proyecto Capstone',
      totalSessions: 20,
      attendedSessions: 12,
      scheduledSessions: 24,
      attendancePercentage: 60.0,
      consecutiveAbsences: 2,
      missedKeySession: false,
      paedisJustified: false,
    };
    const originalSnapshot = JSON.stringify(baseCourse);
    const list = [baseCourse];

    const futureAttend = satAlertService.applySimulatedCourseUpdate(list, {
      courseCode: 'APY4461',
      action: 'future_class_attend',
    });
    assert.equal(futureAttend[0].totalSessions, 21);
    assert.equal(futureAttend[0].attendedSessions, 13);
    assert.equal(futureAttend[0].attendancePercentage, 61.9);
    assert.equal(futureAttend[0].consecutiveAbsences, 0);

    const futureMiss = satAlertService.applySimulatedCourseUpdate(list, {
      courseCode: 'APY4461',
      action: 'future_class_miss',
    });
    assert.equal(futureMiss[0].totalSessions, 21);
    assert.equal(futureMiss[0].attendedSessions, 12);
    assert.equal(futureMiss[0].attendancePercentage, 57.1);
    assert.equal(futureMiss[0].consecutiveAbsences, 3);

    // Corrección de registro pasado mantiene total=20 -> 13/20 = 65.0%
    const pastFix = satAlertService.applySimulatedCourseUpdate(list, {
      courseCode: 'APY4461',
      action: 'correct_past_attendance',
    });
    assert.equal(pastFix[0].totalSessions, 20);
    assert.equal(pastFix[0].attendedSessions, 13);
    assert.equal(pastFix[0].attendancePercentage, 65.0);

    // Asistencia original completamente intacta (inmutabilidad)
    assert.equal(JSON.stringify(baseCourse), originalSnapshot);
  });

  test('SAT Simulación: Recuperación imposible no excede totalSessions ni scheduledSessions', () => {
    const impossibleCourse = {
      courseCode: 'INF301',
      totalSessions: 20,
      completedSessions: 20,
      scheduledSessions: 22,
      pendingSessions: 2,
      attendedSessions: 10,
      attendancePercentage: 50.0,
      minAttendanceRequired: 70,
    };

    const recoveryInfo = satAlertService.computeRecoveryInfo(impossibleCourse);
    // 70% de 22 = 16; máximo alcanzable = 10 + 2 = 12 < 16
    assert.equal(recoveryInfo.recoveryPossible, false);
    assert.equal(recoveryInfo.requiredSessions, 16);
    assert.equal(recoveryInfo.maxPossibleAttended, 12);

    const simulated = satAlertService.applySimulatedCourseUpdate([impossibleCourse], {
      courseCode: 'INF301',
      action: 'recover_to_70',
    });
    assert.equal(simulated[0].recoveryPossible, false);
    assert.ok(simulated[0].attendedSessions <= simulated[0].totalSessions);
    assert.ok(simulated[0].totalSessions <= impossibleCourse.scheduledSessions);
    assert.equal(simulated[0].attendedSessions, 10);
  });

  test('SAT Simulación: Reset exacto sin 95% falso restaura valores originales', () => {
    const originalCourse = {
      courseCode: 'BDD201',
      totalSessions: 20,
      attendedSessions: 13,
      attendancePercentage: 65.0,
      consecutiveAbsences: 2,
      missedKeySession: true,
      paedisJustified: false,
    };

    const altered = satAlertService.applySimulatedCourseUpdate([originalCourse], {
      courseCode: 'BDD201',
      action: 'future_class_attend',
    });
    assert.equal(altered[0].attendedSessions, 14);

    const reset = satAlertService.applySimulatedCourseUpdate(altered, {
      courseCode: 'BDD201',
      action: 'reset',
      baselineCourse: originalCourse,
    });
    assert.equal(reset[0].totalSessions, 20);
    assert.equal(reset[0].attendedSessions, 13);
    assert.equal(reset[0].attendancePercentage, 65.0);
    assert.equal(reset[0].consecutiveAbsences, 2);
    assert.equal(reset[0].missedKeySession, true);
    assert.equal(reset[0].paedisJustified, false);
    assert.notEqual(reset[0].attendancePercentage, 95);
  });

  test('SAT: Escenarios de inasistencias consecutivas y sesión clave', () => {
    const twoConsec = satAlertService.calculateCourseSatStatus({
      courseCode: 'A1',
      totalSessions: 20,
      attendedSessions: 18,
      attendancePercentage: 90,
      consecutiveAbsences: 2,
    });
    assert.equal(twoConsec.severity, 'LEVEL_1_PREVENTIVE');

    const threeConsec = satAlertService.calculateCourseSatStatus({
      courseCode: 'A2',
      totalSessions: 20,
      attendedSessions: 17,
      attendancePercentage: 85,
      consecutiveAbsences: 3,
    });
    assert.equal(threeConsec.severity, 'LEVEL_2_CRITICAL');

    const missedKey = satAlertService.calculateCourseSatStatus({
      courseCode: 'A3',
      totalSessions: 20,
      attendedSessions: 19,
      attendancePercentage: 95,
      missedKeySession: true,
    });
    assert.equal(missedKey.severity, 'LEVEL_2_CRITICAL');
  });

  test('SAT: Excepción hipotética en simulador no otorga excepción oficial', () => {
    const course = {
      courseCode: 'MAT101',
      totalSessions: 20,
      attendedSessions: 12,
      attendancePercentage: 60.0,
      paedisJustified: false,
      officialExceptionAuthorized: false,
    };
    const simulated = satAlertService.applySimulatedCourseUpdate([course], {
      courseCode: 'MAT101',
      action: 'hypothetical_exception',
    });
    assert.equal(simulated[0].paedisJustified, true);
    assert.equal(simulated[0].officialExceptionGranted, false);
    assert.equal(simulated[0].officialExceptionAuthorized, false);

    const status = satAlertService.calculateCourseSatStatus(simulated[0]);
    assert.equal(status.severity, 'PAEDIS_JUSTIFIED');
    assert.equal(status.officialExceptionGranted, false);
    // Original intacto
    assert.equal(course.paedisJustified, false);
  });

  test('SAT: normalizeSimulationAction y validación de esquema AttendanceSimulation', async () => {
    assert.equal(satAlertService.normalizeSimulationAction('future_class_attend'), 'FUTURE_CLASS_ATTEND');
    assert.equal(satAlertService.normalizeSimulationAction('project_future_attendance'), 'FUTURE_CLASS_ATTEND');
    assert.equal(satAlertService.normalizeSimulationAction('future_class_miss'), 'FUTURE_CLASS_MISS');
    assert.equal(satAlertService.normalizeSimulationAction('project_future_absence'), 'FUTURE_CLASS_MISS');
    assert.equal(satAlertService.normalizeSimulationAction('correct_past_attendance'), 'CORRECT_PAST_ATTENDANCE');
    assert.equal(satAlertService.normalizeSimulationAction('remove_absence'), 'CORRECT_PAST_ATTENDANCE');
    assert.equal(satAlertService.normalizeSimulationAction('add_attendance'), 'POSITIVE_ATTENDANCE');
    assert.equal(satAlertService.normalizeSimulationAction('add_absence'), 'NEGATIVE_ABSENCE');
    assert.equal(satAlertService.normalizeSimulationAction('hypothetical_exception'), 'HYPOTHETICAL_EXCEPTION');
    assert.equal(satAlertService.normalizeSimulationAction('paedis_justify'), 'HYPOTHETICAL_EXCEPTION');
    assert.equal(satAlertService.normalizeSimulationAction('reset'), 'RESET_BASE');
    assert.equal(satAlertService.normalizeSimulationAction('unknown_action'), 'CUSTOM_STEPPER');

    const simDoc = new AttendanceSimulation({
      userEmail: 'est@duocuc.cl',
      courseCode: 'APY4461',
      actionApplied: satAlertService.normalizeSimulationAction('project_future_attendance'),
      baselineAttended: 12,
      baselineTotal: 20,
      simulatedAttended: 13,
      simulatedTotal: 21,
      recoveryPossible: true,
      minRequiredThreshold: 70,
      baselinePercentage: 60.0,
      simulatedPercentage: 61.9,
      deltaPercentage: 1.9,
    });
    await simDoc.validate();
    assert.equal(simDoc.actionApplied, 'FUTURE_CLASS_ATTEND');
    assert.equal(simDoc.simulatedTotal, 21);
  });

  // ============================================================
  // 2. PaedisRecord, UserProfile & StudentIntervention
  // ============================================================
  test('PaedisRecord: estados canónicos y fichaDocenteNotificada solo true en ENVIADA/ENTREGADA/ACUSADA', async () => {
    const draft = new PaedisRecord({
      userEmail: 'ana.paedis@duocuc.cl',
      studentName: 'Ana Pérez',
      estadoCaso: 'EVALUACION',
      fichaDocenteEstado: 'PREPARADA',
      fichaDocenteNotificada: true, // debe forzarse a false porque PREPARADA no es entrega real
      fichaDocenteHistorial: [
        {
          estado: 'PREPARADA',
          actorEmail: 'coord.paedis@duoc.cl',
          medioEntrega: 'DESCARGA_TXT',
          evidencia: 'Archivo generado localmente',
        },
      ],
    });
    await draft.validate();
    assert.equal(draft.studentEmail, 'ana.paedis@duocuc.cl');
    assert.equal(draft.fichaDocenteNotificada, false);
    assert.equal(draft.fichaDocenteHistorial.length, 1);

    const sent = new PaedisRecord({
      userEmail: 'luis.paedis@duocuc.cl',
      estadoCaso: 'APROBADO',
      fichaDocenteEstado: 'ENVIADA',
    });
    await sent.validate();
    assert.equal(sent.fichaDocenteNotificada, true);
    assert.ok(sent.fechaNotificacionDocente instanceof Date);

    await assert.rejects(async () => {
      const invalid = new PaedisRecord({
        userEmail: 'bad@duocuc.cl',
        estadoCaso: 'ESTADO_INEXISTENTE',
      });
      await invalid.validate();
    });
  });

  test('UserProfile: consentimiento default false, campos clínicos select:false y comparePassword sin plaintext', async () => {
    const user = new UserProfile({
      email: 'nuevo@duocuc.cl',
      fullName: 'Nuevo Estudiante',
    });
    await user.validate();

    assert.equal(user.tokenVersion, 0);
    assert.equal(user.isBlocked, false);
    assert.equal(user.isActive, true);
    assert.equal(user.consentMetadata.consentGiven, false);
    assert.equal(user.consentMetadata.consentDate, null);
    assert.equal(user.consentMetadata.legalBasis, 'PENDIENTE_REVISION_INSTITUCIONAL');
    assert.equal(user.consentMetadata.informationDelivered, false);

    assert.equal(UserProfile.schema.path('diagnosticoDeclarado').options.select, false);
    assert.equal(UserProfile.schema.path('notasConfidencialesPaedis').options.select, false);

    // comparePassword debe rechazar contraseñas en texto plano aunque coincidan
    user.password = 'TextoPlano123!';
    assert.equal(await user.comparePassword('TextoPlano123!'), false);

    // Con hash bcrypt válido debe validar correctamente
    user.password = await bcrypt.hash('Segura2026!', 10);
    assert.equal(await user.comparePassword('Segura2026!'), true);
    assert.equal(await user.comparePassword('Incorrecta!'), false);
  });

  test('StudentIntervention: validación canónica de bitácora persistente', async () => {
    const intervention = new StudentIntervention({
      studentEmail: 'EST@DUOCUC.CL',
      studentName: 'Estudiante Demo',
      actionTitle: 'Contacto telefónico preventivo SAT',
      actionCategory: 'SEGUIMIENTO_SAT',
      responsibleEmail: 'coord.paedis@duoc.cl',
      responsibleName: 'Coordinación PAEDIS',
      notes: 'Registrado para seguimiento manual.',
      history: [{ status: 'REGISTRADA', note: 'Alta inicial', actorEmail: 'coord.paedis@duoc.cl' }],
    });
    await intervention.validate();
    assert.equal(intervention.studentEmail, 'est@duocuc.cl');
    assert.equal(intervention.status, 'REGISTRADA');
    assert.equal(intervention.externalDerivationPerformed, false);
  });

  // ============================================================
  // 3. predictiveRiskService — Sin graduationProbability, sin sesgo y SIN_DATOS
  // ============================================================
  test('predictiveRiskService: sin graduationProbability, campos heurísticos, sin sesgo PAEDIS/simulador y SIN_DATOS', () => {
    const missingData = predictiveRiskService.calculatePredictiveRisk({
      academicStatus: 'activo',
      enrolledCourses: [],
    });
    assert.equal(missingData.riskLevel, 'SIN_DATOS');
    assert.equal(missingData.score, null);
    assert.equal(missingData.isHeuristic, true);
    assert.equal(missingData.indicatorType, 'HEURISTIC_EARLY_FOLLOWUP');
    assert.equal(missingData.requiresHumanReview, true);
    assert.ok(missingData.disclaimer.length > 20);
    assert.equal('graduationProbability' in missingData, false);

    const baseCourses = [
      { courseCode: 'PRG101', courseName: 'Programación', totalSessions: 20, attendedSessions: 17, attendancePercentage: 85 },
    ];
    const regularStudent = predictiveRiskService.calculatePredictiveRisk({
      academicStatus: 'activo',
      isPaedis: false,
      hasUsedSimulator: false,
      enrolledCourses: baseCourses,
    });
    const paedisNoTutorStudent = predictiveRiskService.calculatePredictiveRisk({
      academicStatus: 'activo',
      isPaedis: true,
      tutorPaedisAsignado: 'No',
      hasUsedSimulator: false,
      enrolledCourses: baseCourses,
    });

    assert.equal('graduationProbability' in regularStudent, false);
    assert.equal(regularStudent.isHeuristic, true);
    assert.equal(regularStudent.indicatorType, 'HEURISTIC_EARLY_FOLLOWUP');
    assert.equal(regularStudent.requiresHumanReview, true);
    assert.ok(paedisNoTutorStudent.score <= regularStudent.score);

    // No usar simulador tampoco penaliza (> 50)
    const simScore = predictiveRiskService.computeSimulatorScore({ hasUsedSimulator: false });
    assert.equal(simScore.score, 50);
  });

  // ============================================================
  // 4. simulatorSnapshotService — Sin distribución sintética y sin admins
  // ============================================================
  test('simulatorSnapshotService: sin distributeRealistic18Weeks, ceros/vacíos sin logs y exclusión de admins', () => {
    assert.equal(simulatorSnapshotService.distributeRealistic18Weeks, undefined);

    const students = [
      { email: 'c.guzman@duocuc.cl', role: 'admin', hasUsedSimulator: true },
      { email: 'est1@duocuc.cl', role: 'estudiante', hasUsedSimulator: false },
    ];
    assert.equal(simulatorSnapshotService.isStudentUser(students[0]), false);
    assert.equal(simulatorSnapshotService.isStudentUser(students[1]), true);

    const emptyAdoption = simulatorSnapshotService.buildSimulatorAdoptionMetrics(students, []);
    assert.equal(emptyAdoption.startedOnlyTotal, 0);
    assert.equal(emptyAdoption.completedTotal, 0);
    assert.deepEqual(emptyAdoption.startedOnlyWeekly, []);
    assert.deepEqual(emptyAdoption.completedWeekly, []);
    assert.deepEqual(emptyAdoption.historicalAdoption, []);
    assert.equal(emptyAdoption.bySemester.semestre1.completedTotal, 0);

    // Logs de admin deben ignorarse; logs reales de estudiante se agregan en su semana real
    const logs = [
      { userEmail: 'c.guzman@duocuc.cl', action: 'saved_toma_ramos', createdAt: new Date().toISOString() },
      { userEmail: 'est1@duocuc.cl', action: 'used_simulator_toma_ramos', createdAt: new Date().toISOString() },
    ];
    const withRealLog = simulatorSnapshotService.buildSimulatorAdoptionMetrics(students, logs);
    assert.equal(withRealLog.startedOnlyTotal, 1);
    assert.equal(withRealLog.completedTotal, 0);
    assert.equal(withRealLog.startedOnlyWeekly.length, 18);
    assert.equal(withRealLog.startedOnlyWeekly.reduce((a, b) => a + b.value, 0), 1);
  });

  // ============================================================
  // 5. Adaptadores institucionales (SICOL, LibCal, SMTP)
  // ============================================================
  test('SicolAdapter: unconfigured honesto, sin URL inventada y retry 1x ante 503', async () => {
    const unconfigured = new SicolAdapter({ apiUrl: '', apiKey: '' });
    assert.equal(unconfigured.isConfigured(), false);
    assert.equal(unconfigured.apiUrl, '');
    const resUnconf = await unconfigured.getStudentAttendance('est@duocuc.cl');
    assert.deepEqual(
      { configured: resUnconf.configured, mode: resUnconf.mode, data: resUnconf.data },
      { configured: false, mode: 'UNCONFIGURED', data: null }
    );

    let calls = 0;
    const configured = new SicolAdapter({
      apiUrl: 'https://sicol.example.edu/api',
      apiKey: 'secret-key-123456',
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) {
          return { ok: false, status: 503, json: async () => ({}) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ courses: [{ courseCode: 'PRG101', attendancePercentage: 82 }] }),
        };
      },
    });
    const resOk = await configured.getStudentAttendance('est@duocuc.cl');
    assert.equal(calls, 2);
    assert.equal(resOk.configured, true);
    assert.equal(resOk.mode, 'OFFICIAL');
    assert.equal(resOk.courses.length, 1);
  });

  test('LibCalAdapter: simulación formativa honesta sin placeholder ni DUOC-VR-2026 y OAuth2 client_credentials con caché', async () => {
    const unconfigured = new LibCalAdapter({ clientId: '', clientSecret: '' });
    const simRes = await unconfigured.reserveSpace({
      spaceId: 'vr-01',
      studentEmail: 'est@duocuc.cl',
      startTime: '2026-11-27T10:00:00Z',
      endTime: '2026-11-27T11:00:00Z',
    });
    assert.deepEqual(
      {
        success: simRes.success,
        configured: simRes.configured,
        isOfficialBooking: simRes.isOfficialBooking,
        bookingId: simRes.bookingId,
        mode: simRes.mode,
        message: simRes.message,
      },
      {
        success: true,
        configured: false,
        isOfficialBooking: false,
        bookingId: null,
        mode: 'PRACTICE_SIMULATION',
        message: 'Simulación formativa local: no genera reserva oficial en LibCal.',
      }
    );
    assert.equal(simRes.confirmationCode, undefined);

    let tokenCalls = 0;
    const configured = new LibCalAdapter({
      baseUrl: 'https://libcal.example.edu/1.1',
      clientId: 'cid',
      clientSecret: 'csecret-12345',
      fetchImpl: async (url) => {
        if (url.endsWith('/oauth/token')) {
          tokenCalls += 1;
          return {
            ok: true,
            status: 200,
            json: async () => ({ access_token: 'real-oauth-token', expires_in: 3600 }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ bookingId: 'LC-9988' }),
        };
      },
    });

    const t1 = await configured.getOAuthToken();
    const t2 = await configured.getOAuthToken();
    assert.equal(t1, 'real-oauth-token');
    assert.equal(t2, 'real-oauth-token');
    assert.equal(tokenCalls, 1);

    const bookRes = await configured.reserveSpace({ spaceId: 'vr-01', studentEmail: 'est@duocuc.cl' });
    assert.equal(bookRes.isOfficialBooking, true);
    assert.equal(bookRes.bookingId, 'LC-9988');
  });

  test('SmtpAdapter: diferencia PREPARADO, MODO_PRUEBA_LOCAL, ENVIADO_SMTP y FALLIDO sin declarar ENTREGADO', async () => {
    const localAdapter = new SmtpAdapter({ host: '', user: '' });
    const prepared = localAdapter.prepareEmail({
      to: 'docente@profesor.duoc.cl',
      subject: 'Aviso PAEDIS',
      text: 'Contenido',
    });
    assert.equal(prepared.deliveryState, SMTP_DELIVERY_STATES.PREPARADO);

    const localRes = await localAdapter.sendEmail({
      to: 'docente@profesor.duoc.cl',
      subject: 'Aviso PAEDIS',
      text: 'Contenido',
    });
    assert.equal(localRes.deliveryState, SMTP_DELIVERY_STATES.MODO_PRUEBA_LOCAL);
    assert.equal(localRes.dsnVerified, false);

    const smtpOk = new SmtpAdapter({
      host: 'smtp.example.edu',
      user: 'mailer@duoc.cl',
      sendSmtpFn: async () => true,
    });
    const sentRes = await smtpOk.sendEmail({
      to: 'docente@profesor.duoc.cl',
      subject: 'Aviso PAEDIS',
      text: 'Contenido',
    });
    assert.equal(sentRes.deliveryState, SMTP_DELIVERY_STATES.ENVIADO_SMTP);
    assert.equal(sentRes.dsnVerified, false);
    assert.notEqual(sentRes.deliveryState, 'ENTREGADO');

    const smtpFail = new SmtpAdapter({
      host: 'smtp.example.edu',
      user: 'mailer@duoc.cl',
      sendSmtpFn: async () => {
        throw new Error('550 Relay denied');
      },
    });
    const failRes = await smtpFail.sendEmail({
      to: 'docente@profesor.duoc.cl',
      subject: 'Aviso PAEDIS',
      text: 'Contenido',
    });
    assert.equal(failRes.success, false);
    assert.equal(failRes.deliveryState, SMTP_DELIVERY_STATES.FALLIDO);
  });

  test('Adaptadores stripTrailingSlashes, normalizeSimulationAction edge cases y createStudent segregado', async () => {
    const sicolSlashes = new SicolAdapter({ apiUrl: 'https://sicol.example.edu/v1///', apiKey: 'secret12345' });
    assert.equal(sicolSlashes.apiUrl, 'https://sicol.example.edu/v1');

    const libcalSlashes = new LibCalAdapter({ baseUrl: '  https://libcal.example.edu/1.1///  ', clientId: 'c', clientSecret: 'secret12345' });
    assert.equal(libcalSlashes.baseUrl, 'https://libcal.example.edu/1.1');

    assert.equal(satAlertService.normalizeSimulationAction(''), 'CUSTOM_STEPPER');
    assert.equal(satAlertService.normalizeSimulationAction(null), 'CUSTOM_STEPPER');
    assert.equal(satAlertService.normalizeSimulationAction('FUTURE_CLASS_ATTEND'), 'FUTURE_CLASS_ATTEND');
    assert.equal(satAlertService.normalizeSimulationAction('  Reset_Base '), 'RESET_BASE');

    const adminController = require('../controllers/adminController');
    const authService = require('../services/authService');
    const testEmail = `paedis.create.${Date.now()}@duocuc.cl`;
    let status = null;
    let body = null;
    try {
      await adminController.createStudent(
        {
          user: { role: 'admin', email: 'c.guzman@duocuc.cl', fullName: 'Cristian Guzmán' },
          body: {
            fullName: 'Estudiante Segregado',
            email: testEmail,
            rut: '21.111.222-3',
            role: 'estudiante_paedis',
            isPaedis: true,
            diagnosticoDeclarado: 'Diagnóstico clínico segregado',
          },
        },
        {
          status(code) {
            status = code;
            return this;
          },
          json(payload) {
            body = payload;
            return this;
          },
        }
      );
      assert.equal(status, 201);
      assert.equal(body?.success, true);
      const savedUser = await authService.findRegisteredUser(testEmail);
      assert.equal(savedUser.diagnosticoDeclarado, undefined);
    } finally {
      authService.removeUserFromMemory(testEmail);
    }
  });
});
