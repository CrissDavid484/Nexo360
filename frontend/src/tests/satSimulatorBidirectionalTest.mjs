import assert from 'node:assert/strict';
import {
  calculateAttendanceRiskLevel,
  calculateBidirectionalSimulation,
  evaluateAttendanceStatus,
} from '../utils/satUtils.js';
import satAlertService from '../../../backend/services/satAlertService.js';

console.log('--- RUNNING SAT BIDIRECTIONAL SIMULATOR TEST SUITE ---');

// 1. Test calculateAttendanceRiskLevel
console.log('Test 1: calculateAttendanceRiskLevel');
{
  const critical = calculateAttendanceRiskLevel(68, { consecutiveAbsences: 0 });
  assert.equal(critical.riskTier, 'Alto');
  assert.equal(critical.level, 'LEVEL_2_CRITICAL');

  const consecutiveCritical = calculateAttendanceRiskLevel(85, { consecutiveAbsences: 3 });
  assert.equal(consecutiveCritical.riskTier, 'Alto');
  assert.equal(consecutiveCritical.level, 'LEVEL_2_CRITICAL');

  const preventive = calculateAttendanceRiskLevel(76, { consecutiveAbsences: 1 });
  assert.equal(preventive.riskTier, 'Moderado');
  assert.equal(preventive.level, 'LEVEL_1_PREVENTIVE');

  const normal = calculateAttendanceRiskLevel(88, { consecutiveAbsences: 0 });
  assert.equal(normal.riskTier, 'Normal');
  assert.equal(normal.level, 'NONE');

  const justified = calculateAttendanceRiskLevel(50, { isJustified: true });
  assert.equal(justified.riskTier, 'Excepción');
  assert.equal(justified.level, 'PAEDIS_JUSTIFIED');
  console.log('✓ Test 1 Passed: calculateAttendanceRiskLevel');
}

// 2. Test calculateBidirectionalSimulation
console.log('Test 2: calculateBidirectionalSimulation');
{
  const course = {
    courseCode: 'MAT2101',
    courseName: 'Matemática Aplicada',
    totalSessions: 20,
    attendedSessions: 14, // 70% -> Alto
    consecutiveAbsences: 2,
    paedisJustified: false,
  };

  const sim = calculateBidirectionalSimulation(course);
  assert.ok(sim, 'Simulation object must exist');
  assert.equal(sim.currentPct, 70);
  assert.equal(sim.currentRisk.riskTier, 'Alto');
  assert.equal(sim.remainingAllowedAbsences, 0); // 15 required for 75%, attended 14 => 0 remaining

  // Positive projection (+1 attended: 15/20 => 75%)
  assert.equal(sim.positive.attended, 15);
  assert.equal(sim.positive.pct, 75);
  assert.equal(sim.positive.risk.riskTier, 'Moderado');
  assert.equal(sim.positive.remainingAllowed, 0); // at 75%, remaining allowed is 0
  assert.equal(sim.positive.consecutiveAbsences, 1);
  assert.equal(sim.positive.deltaPct, 5);

  // Negative projection (+1 missed: 13/20 => 65%)
  assert.equal(sim.negative.attended, 13);
  assert.equal(sim.negative.pct, 65);
  assert.equal(sim.negative.risk.riskTier, 'Alto');
  assert.equal(sim.negative.consecutiveAbsences, 3);
  assert.equal(sim.negative.triggersRi, true);

  // Recovery
  assert.equal(sim.recovery.neededFor75, 1);
  console.log('✓ Test 2 Passed: calculateBidirectionalSimulation');
}

// 3. Test applySimulatedCourseUpdate backend service
console.log('Test 3: applySimulatedCourseUpdate backend positive actions');
{
  const initialCourses = [
    {
      courseCode: 'ASY4131',
      courseName: 'Arquitectura de Software',
      totalSessions: 20,
      attendedSessions: 14, // 70%
      consecutiveAbsences: 2,
      paedisJustified: false,
    },
  ];

  // 3.1: add_attendance (+1)
  const afterAdd = satAlertService.applySimulatedCourseUpdate(initialCourses, {
    courseCode: 'ASY4131',
    action: 'add_attendance',
  });
  assert.equal(afterAdd[0].attendedSessions, 15);
  assert.equal(afterAdd[0].attendancePercentage, 75);
  assert.equal(afterAdd[0].consecutiveAbsences, 1);

  // 3.2: remove_absence (1 falta menos)
  const afterRemoveAbsence = satAlertService.applySimulatedCourseUpdate(initialCourses, {
    courseCode: 'ASY4131',
    action: 'remove_absence',
  });
  assert.equal(afterRemoveAbsence[0].attendedSessions, 15);
  assert.equal(afterRemoveAbsence[0].attendancePercentage, 75);

  // 3.3: recover_to_75
  const afterRecover = satAlertService.applySimulatedCourseUpdate(initialCourses, {
    courseCode: 'ASY4131',
    action: 'recover_to_75',
  });
  assert.equal(afterRecover[0].attendedSessions, 15); // Math.ceil(20 * 0.75) = 15
  assert.equal(afterRecover[0].attendancePercentage, 75);
  assert.equal(afterRecover[0].consecutiveAbsences, 0);

  // 3.4: future_perfect
  const afterPerfect = satAlertService.applySimulatedCourseUpdate(initialCourses, {
    courseCode: 'ASY4131',
    action: 'future_perfect',
  });
  assert.equal(afterPerfect[0].attendedSessions, 20);
  assert.equal(afterPerfect[0].attendancePercentage, 100);
  assert.equal(afterPerfect[0].consecutiveAbsences, 0);

  // 3.5: deltaAttendance
  const afterDelta = satAlertService.applySimulatedCourseUpdate(initialCourses, {
    courseCode: 'ASY4131',
    deltaAttendance: 2,
  });
  assert.equal(afterDelta[0].attendedSessions, 16);
  assert.equal(afterDelta[0].attendancePercentage, 80);

  console.log('✓ Test 3 Passed: applySimulatedCourseUpdate positive actions');
}

console.log('--- ALL SAT BIDIRECTIONAL SIMULATOR TESTS PASSED! ---');
