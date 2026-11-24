// Unit test simulation of the ExamFlow Seating Allocation & Room Overflow Algorithm

function simulateSeatingDistribution(rooms, studentsCount) {
  console.log('\n======================================================');
  console.log('🧪 TESTING SEATING ALLOCATION ALGORITHM');
  console.log(`Target: Distribute ${studentsCount} students across ${rooms.length} rooms`);
  console.log('======================================================');

  const totalCapacity = rooms.reduce((acc, r) => acc + r.examCapacity, 0);
  console.log(`Total Capacity Available: ${totalCapacity} seats`);

  if (totalCapacity < studentsCount) {
    throw new Error(`Capacity Deficit: ${studentsCount} students > ${totalCapacity} seats`);
  }

  const roomDistribution = [];
  let remainingStudents = studentsCount;

  for (const room of rooms) {
    const allocated = Math.min(room.examCapacity, remainingStudents);
    roomDistribution.push({
      roomNumber: room.roomNumber,
      capacity: room.examCapacity,
      allocatedSeats: allocated,
      startSeat: `${room.roomNumber}-S001`,
      endSeat: `${room.roomNumber}-S${String(allocated).padStart(3, '0')}`
    });
    remainingStudents -= allocated;
    if (remainingStudents <= 0) break;
  }

  return roomDistribution;
}

// User's exact prompt specification:
// Room 101: 50 seats, Room 102: 40 seats, Room 103: 40 seats. 120 students attend.
const testRooms = [
  { roomNumber: '101', examCapacity: 50 },
  { roomNumber: '102', examCapacity: 40 },
  { roomNumber: '103', examCapacity: 40 }
];

const result = simulateSeatingDistribution(testRooms, 120);

console.log('\nResults Breakdown:');
let totalAllocated = 0;
result.forEach(r => {
  console.log(`  • Room ${r.roomNumber}: Allocated ${r.allocatedSeats} / ${r.capacity} seats (${r.startSeat} to ${r.endSeat})`);
  totalAllocated += r.allocatedSeats;
});

console.log(`\nTotal Successfully Allocated: ${totalAllocated} / 120 students`);

// Assertions
const r101 = result.find(r => r.roomNumber === '101');
const r102 = result.find(r => r.roomNumber === '102');
const r103 = result.find(r => r.roomNumber === '103');

const pass = (
  r101.allocatedSeats === 50 &&
  r102.allocatedSeats === 40 &&
  r103.allocatedSeats === 30 &&
  totalAllocated === 120
);

if (pass) {
  console.log('\n======================================================');
  console.log('🎉 Seating Allocation Algorithm PASSED exactly as specified!');
  console.log('   Room 101: 50 | Room 102: 40 | Room 103: 30');
  console.log('======================================================\n');
} else {
  console.error('❌ Test failed!');
  process.exit(1);
}
