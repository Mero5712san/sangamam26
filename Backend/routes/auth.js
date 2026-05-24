const express = require('express');
const router = express.Router();
const { registerUser, authUser, verifyOtp, sendOtp, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/me', protect, getCurrentUser);
router.post('/verify-otp', verifyOtp);
router.post('/send-otp', sendOtp);

module.exports = router;
