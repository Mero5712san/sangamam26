const express = require('express');
const router = express.Router();
const { registerEvent, getMyRegistrations, markAttendance, getEventRegistrations, getUserRegistrations, getEligibleTeamMembers, getAssignedRegistrations, getAllRegistrations } = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, registerEvent);
router.get('/my', protect, getMyRegistrations);
router.get('/all', protect, authorize('admin'), getAllRegistrations);
router.get('/assigned', protect, getAssignedRegistrations);
router.get('/eligible-members/:eventId', protect, getEligibleTeamMembers);
router.patch('/:id/attendance', protect, authorize('admin', 'incharge', 'volunteer'), markAttendance);
router.get('/event/:eventId', protect, authorize('admin', 'incharge'), getEventRegistrations);
router.get('/user/:uuid', protect, authorize('admin', 'incharge', 'volunteer'), getUserRegistrations);

module.exports = router;
