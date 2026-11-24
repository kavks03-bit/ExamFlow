const mongoose = require('mongoose');

const conflictDetailSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['STUDENT_OVERLAP', 'ROOM_OVERLAP', 'ROOM_CAPACITY', 'FACULTY_OVERLAP', 'TIME_INVALID'],
    required: true
  },
  severity: {
    type: String,
    enum: ['ERROR', 'WARNING'],
    default: 'ERROR'
  },
  message: {
    type: String,
    required: true
  },
  conflictingEntity: {
    type: String,
    default: ''
  }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  examination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination',
    required: [true, 'Examination reference is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  studentGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentGroup',
    required: [true, 'Student group is required']
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Examination room is required']
  },
  invigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null
  },
  date: {
    type: Date,
    required: [true, 'Examination date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required (e.g. 09:30)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required (e.g. 12:30)']
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 30
  },
  status: {
    type: String,
    enum: ['scheduled', 'conflict', 'published', 'cancelled'],
    default: 'scheduled'
  },
  conflicts: [conflictDetailSchema],
  hasConflicts: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexing for efficient conflict lookups
scheduleSchema.index({ examination: 1, date: 1 });
scheduleSchema.index({ studentGroup: 1, startDateTime: 1, endDateTime: 1 });
scheduleSchema.index({ room: 1, startDateTime: 1, endDateTime: 1 });
scheduleSchema.index({ invigilator: 1, startDateTime: 1, endDateTime: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
