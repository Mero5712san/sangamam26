const express = require('express');
const router = express.Router();
const { getRecentLogs } = require('../controllers/logsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/recent', protect, authorize('admin'), getRecentLogs);

module.exports = router;