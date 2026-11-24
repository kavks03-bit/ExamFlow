const express = require('express');
const router = express.Router();
const {
  getSeatingPlan,
  generateSeating,
  clearSeating,
  getMySeating
} = require('../controllers/seatingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getSeatingPlan);
router.get('/my-seating', getMySeating);
router.post('/generate', authorize('admin'), generateSeating);
router.delete('/clear/:scheduleId', authorize('admin'), clearSeating);

module.exports = router;
