const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tempDir = path.join(__dirname, '..', 'uploads', 'tmp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({ storage });

const { getSharedDocuments, uploadSharedDocument, deleteSharedDocument } = require('../controllers/documentsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getSharedDocuments);
router.patch('/:type', protect, authorize('admin'), upload.single('document'), uploadSharedDocument);
router.delete('/:type', protect, authorize('admin'), deleteSharedDocument);

module.exports = router;
