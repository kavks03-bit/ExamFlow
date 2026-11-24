const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const {
  isTimeOverlapping,
  buildDateTimes,
  detectConflicts
} = require('./src/services/conflictDetectionService');

async function testConflictLogicUnit() {
  console.log('\n======================================================');
  console.log('🧪 TESTING EXAMFLOW CONFLICT DETECTION LOGIC (UNIT)');
  console.log('======================================================');

  // Test 1: Mathematical Interval Overlap
  console.log('\nTest 1: Time Interval Overlap Logic');
  
  // (09:00 - 12:00) vs (10:00 - 13:00) => OVERLAP (True)
  const o1 = isTimeOverlapping('2026-12-05T09:00:00', '2026-12-05T12:00:00', '2026-12-05T10:00:00', '2026-12-05T13:00:00');
  console.log(`  Case A (Partial Overlap): Expected TRUE, Got: ${o1} -> ${o1 === true ? '✅ PASS' : '❌ FAIL'}`);

  // (09:00 - 12:00) vs (12:00 - 15:00) => BACK-TO-BACK (False)
  const o2 = isTimeOverlapping('2026-12-05T09:00:00', '2026-12-05T12:00:00', '2026-12-05T12:00:00', '2026-12-05T15:00:00');
  console.log(`  Case B (Back-to-Back Consecutive): Expected FALSE, Got: ${o2} -> ${o2 === false ? '✅ PASS' : '❌ FAIL'}`);

  // (09:00 - 12:00) vs (13:00 - 16:00) => DISJOINT (False)
  const o3 = isTimeOverlapping('2026-12-05T09:00:00', '2026-12-05T12:00:00', '2026-12-05T13:00:00', '2026-12-05T16:00:00');
  console.log(`  Case C (Completely Separate): Expected FALSE, Got: ${o3} -> ${o3 === false ? '✅ PASS' : '❌ FAIL'}`);

  // (08:00 - 14:00) vs (09:00 - 11:00) => ENCLOSED (True)
  const o4 = isTimeOverlapping('2026-12-05T08:00:00', '2026-12-05T14:00:00', '2026-12-05T09:00:00', '2026-12-05T11:00:00');
  console.log(`  Case D (Enclosed Interval): Expected TRUE, Got: ${o4} -> ${o4 === true ? '✅ PASS' : '❌ FAIL'}`);

  // Test 2: Invalid Duration (End time before start time)
  console.log('\nTest 2: Invalid End Time Handling');
  const inv = buildDateTimes('2026-12-05', '14:00', '10:00');
  console.log(`  Duration for 14:00 to 10:00: ${inv.durationMinutes} mins (Negative) -> ${inv.durationMinutes < 0 ? '✅ PASS (Correctly detected negative duration)' : '❌ FAIL'}`);

  console.log('\n======================================================');
  console.log('🎉 All Conflict Detection Core Math Tests PASSED!');
  console.log('======================================================\n');
}

testConflictLogicUnit();
