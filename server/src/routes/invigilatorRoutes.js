const express = require('express');
const router = express.Router();
const {
  getWorkload,
  getAssignments,
  createAssignment,
  autoAssign,
  deleteAssignment
} = require('../controllers/invigilatorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/workload', getWorkload);
router.get('/assignments', getAssignments);
router.post('/assign', authorize('admin'), createAssignment);
router.post('/auto-assign/:examinationId', authorize('admin'), autoAssign);
router.delete('/:id', authorize('admin'), deleteAssignment);

module.exports = router;
