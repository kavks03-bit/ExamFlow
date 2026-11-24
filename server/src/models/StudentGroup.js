const mongoose = require('mongoose');

const studentGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required (e.g. B.Tech CSE 2023-27 Sec A)'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required (e.g. Computer Science, Mechanical)'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester number is required (1 to 8)'],
    min: 1,
    max: 12
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required (e.g. 2026-2027)'],
    trim: true
  },
  capacity: {
    type: Number,
    default: 60,
    min: 1
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentGroup', studentGroupSchema);
