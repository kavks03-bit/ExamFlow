const express = require('express');
const router = express.Router();
const {
  getAdminDashboardMetrics,
  getFacultyDashboard,
  getStudentDashboard,
  getAuditLogs
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboardMetrics);
router.get('/faculty', authorize('faculty', 'admin'), getFacultyDashboard);
router.get('/student', authorize('student', 'admin'), getStudentDashboard);
router.get('/audits', authorize('admin'), getAuditLogs);

module.exports = router;
