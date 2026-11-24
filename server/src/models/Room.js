const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number/code is required (e.g. LH-101, Hall-B)'],
    unique: true,
    trim: true,
    uppercase: true
  },
  building: {
    type: String,
    required: [true, 'Building or Block name is required (e.g. Science Block)'],
    trim: true
  },
  floor: {
    type: Number,
    required: [true, 'Floor number is required'],
    default: 1
  },
  benchCount: {
    type: Number,
    required: [true, 'Number of benches is required'],
    min: 1
  },
  totalCapacity: {
    type: Number,
    required: [true, 'Total lecture capacity is required'],
    min: 1
  },
  examCapacity: {
    type: Number,
    required: [true, 'Exam seating capacity is required (e.g. 1 student per bench)'],
    min: 1
  },
  hasProjector: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);
