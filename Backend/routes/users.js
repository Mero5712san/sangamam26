const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    updateStatus,
    getUserById,
    getCollegeDetails,
    submitPaymentProof,
    getPaymentParticipants,
    reviewPayment
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const tempDir = path.join(__dirname, '..', 'uploads', 'tmp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});

const upload = multer({ storage });

router.patch('/:id/status', protect, authorize('admin', 'incharge'), updateStatus);
router.get('/college/:slug', protect, authorize('admin'), getCollegeDetails);
router.post('/payment-proof', protect, upload.single('proof'), submitPaymentProof);
router.get('/payments', protect, authorize('admin'), getPaymentParticipants);
router.patch('/:id/payment-decision', protect, authorize('admin'), reviewPayment);
router.get('/:id', protect, authorize('admin', 'incharge', 'volunteer'), getUserById);

module.exports = router;
