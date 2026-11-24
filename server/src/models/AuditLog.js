const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'LOGIN', 'SCHEDULE_CONFLICT', 'SEATING_ALLOCATION']
  },
  module: {
    type: String,
    required: true,
    enum: ['AUTH', 'STUDENT', 'FACULTY', 'SUBJECT', 'GROUP', 'ROOM', 'EXAMINATION', 'SCHEDULE', 'INVIGILATION', 'SEATING']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performerName: {
    type: String,
    default: 'System'
  },
  targetId: {
    type: String
  },
  targetTitle: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
