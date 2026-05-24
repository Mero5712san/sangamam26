const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({ storage });

const { getEvents, getAssignedEvents, getEventBySlug, createEvent, updateEvent, updateReport } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.get('/assigned', protect, getAssignedEvents);
router.get('/:slug', getEventBySlug);
router.post('/', protect, authorize('admin'), createEvent);
router.put('/:slug', protect, authorize('admin', 'incharge'), updateEvent);
router.patch('/:slug/report', protect, authorize('admin', 'incharge'), upload.single('geoImage'), updateReport);

module.exports = router;
