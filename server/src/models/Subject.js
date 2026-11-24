const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject course code is required (e.g. CS501)'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 12
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    default: 3,
    min: 1
  },
  type: {
    type: String,
    enum: ['theory', 'practical', 'elective'],
    default: 'theory'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
