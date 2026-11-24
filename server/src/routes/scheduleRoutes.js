const express = require('express');
const router = express.Router();
const {
  getSchedules,
  getScheduleById,
  validateSlot,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  publishTimetable,
  autoSuggestSlot
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSchedules)
  .post(authorize('admin'), createSchedule);

router.post('/validate-slot', validateSlot);
router.post('/auto-suggest', authorize('admin'), autoSuggestSlot);
router.post('/publish/:examinationId', authorize('admin'), publishTimetable);

router.route('/:id')
  .get(getScheduleById)
  .put(authorize('admin'), updateSchedule)
  .delete(authorize('admin'), deleteSchedule);

module.exports = router;
