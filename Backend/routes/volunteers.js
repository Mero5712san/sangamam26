const express = require('express');
const router = express.Router();
const { addVolunteer, assignEvent, getVolunteers } = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'incharge'), getVolunteers);
router.post('/', protect, authorize('admin'), addVolunteer);
router.patch('/:id/assign', protect, authorize('admin'), assignEvent);

module.exports = router;
