const express = require('express');
const router = express.Router();
const { login, register, getMe, getDemoAccounts } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.get('/demo-accounts', getDemoAccounts);
router.get('/me', protect, getMe);

module.exports = router;
