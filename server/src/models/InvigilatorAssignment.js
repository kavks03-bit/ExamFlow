const mongoose = require('mongoose');

const invigilatorAssignmentSchema = new mongoose.Schema({
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
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty reference is required']
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room reference is required']
  },
  role: {
    type: String,
    enum: ['chief_invigilator', 'assistant_invigilator', 'reliever'],
    default: 'assistant_invigilator'
  },
  status: {
    type: String,
    enum: ['assigned', 'confirmed', 'substituted', 'completed'],
    default: 'assigned'
  },
  reportingTime: {
    type: String,
    default: '30 mins before exam start'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Composite unique index: A faculty cannot be assigned multiple times to the exact same schedule and room
invigilatorAssignmentSchema.index({ schedule: 1, faculty: 1 }, { unique: true });

module.exports = mongoose.model('InvigilatorAssignment', invigilatorAssignmentSchema);
