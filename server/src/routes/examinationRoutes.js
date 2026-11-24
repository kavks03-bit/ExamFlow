const express = require('express');
const router = express.Router();
const {
  getExaminations,
  getExaminationById,
  createExamination,
  updateExamination,
  deleteExamination
} = require('../controllers/examinationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getExaminations)
  .post(authorize('admin'), createExamination);

router.route('/:id')
  .get(getExaminationById)
  .put(authorize('admin'), updateExamination)
  .delete(authorize('admin'), deleteExamination);

module.exports = router;
