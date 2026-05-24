const express = require('express');
const router = express.Router();
const { updateStatus, getUserById } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.patch('/:id/status', protect, authorize('admin', 'incharge'), updateStatus);
router.get('/:id', protect, authorize('admin', 'incharge', 'volunteer'), getUserById);

module.exports = router;
