const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// @route   GET /api/health
// @desc    Check system health and database connectivity
// @access  Public
router.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'ExamFlow API is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: isConnected ? 'connected' : 'disconnected',
    databaseName: isConnected ? mongoose.connection.name : null,
    clusterHost: isConnected ? mongoose.connection.host : null,
    version: '1.0.0'
  });
});

module.exports = router;
