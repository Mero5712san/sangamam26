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

const { getEvents, getAssignedEvents, getEventBySlug, createEvent, updateEvent, updateReport, updateEventDocument, deleteEventDocument } = require('../controllers/eventController');
const { protect, authorize, attachUserIfPresent } = require('../middleware/authMiddleware');

router.get('/', attachUserIfPresent, getEvents);
router.get('/assigned', protect, getAssignedEvents);
router.get('/:slug', getEventBySlug);
router.post('/', protect, authorize('admin'), createEvent);
router.put('/:slug', protect, authorize('admin', 'incharge'), updateEvent);
router.patch('/:slug/report', protect, authorize('admin', 'incharge'), upload.single('geoImage'), updateReport);
router.patch('/:slug/documents/:type', protect, authorize('admin'), upload.single('document'), updateEventDocument);
router.delete('/:slug/documents/:type', protect, authorize('admin'), deleteEventDocument);

module.exports = router;
