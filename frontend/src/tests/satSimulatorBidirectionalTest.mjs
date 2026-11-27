import assert from 'node:assert/strict';
import {
  DUOC_ATTENDANCE_THRESHOLDS,
  calculateAttendanceRiskLevel,
  calculateBidirectionalSimulation,
  evaluateAttendanceStatus,
  explainPredictiveRisk,
} from '../utils/satUtils.js';
import satAlertService from '../../../backend/services/satAlertService.js';

console.log('--- RUNNING SAT BIDIRECTIONAL SIMULATOR TEST SUITE ---');

// 1. Canonical 70% threshold (70% Preventive, 69.9% RI, >=75% Regular, custom minAttendanceRequired)
console.log('Test 1: Canonical 70% threshold & custom minAttendanceRequired');
{
  assert.equal(DUOC_ATTENDANCE_THRESHOLDS.RI_CRITICAL, 70);
  assert.equal(DUOC_ATTENDANCE_THRESHOLDS.SAT_RI_LIMIT, undefined);

  const riExact = calculateAttendanceRiskLevel(69.9, { consecutiveAbsences: 0 });
  assert.equal(riExact.riskTier, 'Alto');
  assert.equal(riExact.level, 'LEVEL_2_CRITICAL');

  const exact70 = calculateAttendanceRiskLevel(70, { consecutiveAbsences: 0 });
  assert.equal(exact70.riskTier, 'Moderado');
  assert.equal(exact70.level, 'LEVEL_1_PREVENTIVE');

  const prev749 = evaluateAttendanceStatus(74.9);
  assert.equal(prev749.status, 'preventive');

  const regular75 = evaluateAttendanceStatus(75);
  assert.equal(regular75.status, 'normal');

  const customCourseRi = evaluateAttendanceStatus(78, { minAttendanceRequired: 80 });
  assert.equal(customCourseRi.status, 'ri');

  const consecutiveCritical = calculateAttendanceRiskLevel(85, { consecutiveAbsences: 3 });
  assert.equal(consecutiveCritical.riskTier, 'Alto');
  assert.equal(consecutiveCritical.level, 'LEVEL_2_CRITICAL');

  const justified = calculateAttendanceRiskLevel(50, { isJustified: true });
  assert.equal(justified.riskTier, 'Excepción');
  assert.equal(justified.level, 'PAEDIS_JUSTIFIED');
  console.log('✓ Test 1 Passed: Canonical 70% threshold');
}

// 2. Future projection 13/21 = 61.9%, 0 classes, past correction, impossible recovery
console.log('Test 2: calculateBidirectionalSimulation (13/21 = 61.9%, 0 classes, impossible recovery)');
{
  // 12/20 -> +1 future class attended = 13/21 = 61.9%
  const sim12of20 = calculateBidirectionalSimulation({
    courseCode: 'MAT2101',
    totalSessions: 20,
    attendedSessions: 12,
    consecutiveAbsences: 2,
    pendingSessions: 4,
  });
  assert.equal(sim12of20.currentPct, 60);
  assert.equal(sim12of20.currentRisk.riskTier, 'Alto');
  assert.equal(sim12of20.futureAttend.attended, 13);
  assert.equal(sim12of20.futureAttend.total, 21);
  assert.equal(sim12of20.futureAttend.pct, 61.9);
  assert.equal(sim12of20.futureMiss.attended, 12);
  assert.equal(sim12of20.futureMiss.total, 21);
  assert.equal(sim12of20.futureMiss.pct, 57.1);
  assert.equal(sim12of20.pastCorrectionPositive.attended, 13);
  assert.equal(sim12of20.pastCorrectionPositive.total, 20);
  assert.equal(sim12of20.pastCorrectionPositive.pct, 65);
  // 12/20 needs 7 consecutive future classes (19/27 = 70.4%), only 4 pending -> impossible
  assert.equal(sim12of20.recoveryPossible, false);
  assert.equal(sim12of20.futureClassesNeeded, 7);

  // Possible recovery when pendingSessions >= 7
  const simRecoverable = calculateBidirectionalSimulation({
    totalSessions: 20,
    attendedSessions: 12,
    pendingSessions: 7,
  });
  assert.equal(simRecoverable.recoveryPossible, true);

  // 0 classes handled safely without NaN or 20 fallback
  const simZero = calculateBidirectionalSimulation({
    courseCode: 'INI001',
    totalSessions: 0,
    attendedSessions: 0,
  });
  assert.equal(simZero.totalSessions, 0);
  assert.equal(simZero.currentPct, null);
  assert.equal(simZero.hasData, false);
  assert.equal(simZero.currentRisk.level, 'NO_DATA');
  assert.equal(simZero.futureAttend.attended, 1);
  assert.equal(simZero.futureAttend.total, 1);
  assert.equal(simZero.futureAttend.pct, 100);
  assert.equal(simZero.futureMiss.pct, 0);
  assert.equal(simZero.pastCorrectionPositive.available, false);

  // Exact 70% vs 69.9%
  const sim14of20 = calculateBidirectionalSimulation({
    totalSessions: 20,
    attendedSessions: 14,
  });
  assert.equal(sim14of20.currentPct, 70);
  assert.equal(sim14of20.currentRisk.riskTier, 'Moderado');

  console.log('✓ Test 2 Passed: calculateBidirectionalSimulation');
}

// 3. explainPredictiveRisk: no graduationProbability, isHeuristic: true, SIN_DATOS when missing records
console.log('Test 3: explainPredictiveRisk');
{
  const noData = explainPredictiveRisk({});
  assert.equal(noData.riskLevel, 'SIN_DATOS');
  assert.equal(noData.isHeuristic, true);
  assert.equal('graduationProbability' in noData, false);

  const atRisk = explainPredictiveRisk({
    enrolledCourses: [{ courseCode: 'MAT101', attendancePercentage: 69.9 }],
  });
  assert.equal(atRisk.riskLevel, 'ALTO');
  assert.equal(atRisk.isHeuristic, true);
  assert.equal('graduationProbability' in atRisk, false);
  console.log('✓ Test 3 Passed: explainPredictiveRisk');
}

// 4. Backend satAlertService.applySimulatedCourseUpdate: future actions & exact reset (never 95%)
console.log('Test 4: applySimulatedCourseUpdate actions & exact reset');
{
  const initialCourses = [
    {
      courseCode: 'ASY4131',
      courseName: 'Arquitectura de Software',
      totalSessions: 20,
      attendedSessions: 12,
      attendancePercentage: 60,
      consecutiveAbsences: 2,
      paedisJustified: false,
    },
  ];

  const afterAdd = satAlertService.applySimulatedCourseUpdate(initialCourses, {
    courseCode: 'ASY4131',
    action: 'add_attendance',
  });
  assert.equal(afterAdd[0].attendedSessions, 13);
  assert.equal(afterAdd[0].attendancePercentage, 65);

  const afterReset = satAlertService.applySimulatedCourseUpdate(initialCourses, {
    courseCode: 'ASY4131',
    action: 'reset',
  });
  // Exact reset must preserve baseline (60%), NEVER 95%
  assert.equal(afterReset[0].attendedSessions, 12);
  assert.equal(afterReset[0].attendancePercentage, 60);
  assert.equal(afterReset[0].consecutiveAbsences, 2);

  console.log('✓ Test 4 Passed: applySimulatedCourseUpdate');
}

console.log('--- ALL SAT BIDIRECTIONAL SIMULATOR TESTS PASSED! ---');
