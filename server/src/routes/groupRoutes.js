const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup
} = require('../controllers/groupController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getGroups)
  .post(authorize('admin'), createGroup);

router.route('/:id')
  .get(getGroupById)
  .put(authorize('admin'), updateGroup)
  .delete(authorize('admin'), deleteGroup);

module.exports = router;
