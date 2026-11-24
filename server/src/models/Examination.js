const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Examination title is required (e.g. End-Semester Examination Nov-Dec 2026)'],
    trim: true
  },
  examSeries: {
    type: String,
    enum: ['Mid-Term', 'End-Term', 'Supplementary', 'Unit-Test'],
    default: 'End-Term'
  },
  session: {
    type: String,
    required: [true, 'Academic session is required (e.g. 2026-2027)'],
    trim: true
  },
  semester: {
    type: String,
    enum: ['Odd', 'Even', 'All'],
    default: 'Odd'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'completed', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Examination', examinationSchema);
