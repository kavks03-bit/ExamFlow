const mongoose = require('mongoose');

const seatingAllocationSchema = new mongoose.Schema({
  examination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination',
    required: [true, 'Examination reference is required']
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'Schedule reference is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  studentGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentGroup',
    required: [true, 'Student Group reference is required']
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room reference is required']
  },
  seatNumber: {
    type: String,
    required: [true, 'Seat number is required (e.g. LH101-S001)']
  },
  benchNumber: {
    type: Number,
    required: true
  },
  deskPosition: {
    type: String,
    enum: ['Left', 'Right', 'Single', 'Center'],
    default: 'Single'
  },
  attendanceStatus: {
    type: String,
    enum: ['allocated', 'present', 'absent', 'malpractice'],
    default: 'allocated'
  }
}, {
  timestamps: true
});

// A student cannot have multiple seats for the same exam schedule
seatingAllocationSchema.index({ schedule: 1, student: 1 }, { unique: true });

// Two students cannot be assigned to the exact same seat in the same room and schedule
seatingAllocationSchema.index({ schedule: 1, room: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('SeatingAllocation', seatingAllocationSchema);
