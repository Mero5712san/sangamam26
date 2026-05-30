const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendEmail = require('../utils/sendEmail');
const buildMailShell = require('../utils/emailTemplate');

const PAYMENT_URL = 'https://payments.bitsathy.ac.in/muthamil-sangamam-2026';
const paymentProofDir = path.join(__dirname, '..', 'uploads', 'payment-proofs');

if (!fs.existsSync(paymentProofDir)) {
    fs.mkdirSync(paymentProofDir, { recursive: true });
}

// Payment decision content builder (wrapped by shared buildMailShell when sending)
const buildPaymentDecisionContent = ({ name, approved }) => {
    const title = approved ? 'Payment Confirmed' : 'Payment Rejected';
    const body = approved
        ? `
            <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 15px; color: #f5e1b3; line-height:1.6; margin:0;">Your payment proof for the event has been verified successfully. Your access is now confirmed for Muthamizh Sangamam 2026.</p>
        `
        : `
            <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 15px; color: #f5e1b3; line-height:1.6; margin:0 0 14px 0;">Your payment proof for the event was rejected. Your account has been blocked from portal access.</p>
            <p style="font-size: 13px; color:#d6c7a3; margin:0;">If this was a mistake, contact support and resubmit payment at <a href="${PAYMENT_URL}" style="color:#f1c40f;">${PAYMENT_URL}</a>.</p>
        `;

    return { title, content: body };
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const slugifyCollege = (value) => normalizeText(value)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getCollegeNameFromSlug = async (slug) => {
    const normalizedSlug = normalizeText(slug);
    const colleges = await User.findAll({
        attributes: ['college'],
        where: {
            college: { [Op.ne]: null }
        },
        group: ['college'],
        raw: true
    });

    const match = colleges.find((row) => slugifyCollege(row.college) === normalizedSlug);
    return match?.college || null;
};

exports.updateStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { status } = req.body;
        if (!['active', 'freezed', 'disqualified'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.status = status;
        await user.save();

        res.json({ message: 'Status updated', status: user.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCollegeDetails = async (req, res) => {
    try {
        const collegeName = await getCollegeNameFromSlug(req.params.slug);
        if (!collegeName) {
            return res.status(404).json({ message: 'College not found' });
        }

        const students = await User.findAll({
            where: { college: collegeName },
            attributes: ['id', 'name', 'gender'],
            raw: true
        });

        const registrations = await Registration.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'gender', 'college'] },
                { model: Event, as: 'event', attributes: ['id', 'name'] }
            ]
        });

        const collegeRegistrations = registrations.filter((registration) => normalizeText(registration.user?.college) === normalizeText(collegeName));

        const uniqueStudentMap = new Map();
        for (const student of students) {
            uniqueStudentMap.set(student.id, student);
        }

        const totals = {
            total: uniqueStudentMap.size,
            boys: 0,
            girls: 0,
            internal: uniqueStudentMap.size
        };

        for (const student of uniqueStudentMap.values()) {
            const gender = normalizeText(student.gender);
            if (gender === 'male') totals.boys += 1;
            else if (gender === 'female') totals.girls += 1;
        }

        const eventMap = new Map();
        for (const registration of collegeRegistrations) {
            const event = registration.event;
            if (!event) continue;

            const existing = eventMap.get(event.id) || {
                id: event.id,
                name: event.name,
                boys: 0,
                girls: 0,
                total: 0
            };

            existing.total += 1;
            const gender = normalizeText(registration.user?.gender);
            if (gender === 'male') existing.boys += 1;
            else if (gender === 'female') existing.girls += 1;

            eventMap.set(event.id, existing);
        }

        const eventWise = Array.from(eventMap.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

        res.json({
            college: {
                name: collegeName,
                slug: slugifyCollege(collegeName)
            },
            stats: totals,
            eventWise
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitPaymentProof = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'participant') {
            return res.status(403).json({ message: 'Only participants can submit payment proof' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.participantType !== 'external') {
            return res.status(400).json({ message: 'Internal participants do not require payment proof' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Payment proof image is required' });
        }

        const safeName = req.file.originalname.replace(/\s+/g, '-');
        const filename = `payment-${user.id}-${Date.now()}-${safeName}`;
        const destination = path.join(paymentProofDir, filename);
        fs.renameSync(req.file.path, destination);

        if (user.paymentProofImage) {
            const oldFileName = path.basename(user.paymentProofImage);
            const oldPath = path.join(paymentProofDir, oldFileName);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        user.paymentProofImage = `/uploads/payment-proofs/${filename}`;
        user.paymentStatus = 'submitted';
        user.paymentProofSubmittedAt = new Date();
        await user.save();

        return res.json({
            message: 'Payment proof submitted successfully',
            paymentStatus: user.paymentStatus,
            paymentProofImage: user.paymentProofImage
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getPaymentParticipants = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: 'participant',
                participantType: 'external'
            },
            attributes: [
                'id',
                'uuid',
                'name',
                'email',
                'college',
                'phone',
                'participantType',
                'paymentStatus',
                'paymentProofImage',
                'paymentProofSubmittedAt',
                'paymentDecisionAt',
                'status'
            ],
            order: [['paymentProofSubmittedAt', 'DESC'], ['createdAt', 'DESC']]
        });

        const normalizedEmail = (value) => String(value || '').trim().toLowerCase();
        const dedupedByEmail = new Map();

        for (const user of users) {
            const emailKey = normalizedEmail(user.email) || `id:${user.id}`;
            if (!dedupedByEmail.has(emailKey)) {
                dedupedByEmail.set(emailKey, user.toJSON());
            }
        }

        return res.json(Array.from(dedupedByEmail.values()));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.reviewPayment = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { decision } = req.body;

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Invalid payment decision' });
        }

        const user = await User.findByPk(userId);
        if (!user || user.role !== 'participant' || user.participantType !== 'external') {
            return res.status(404).json({ message: 'External participant not found' });
        }

        if (!user.paymentProofImage) {
            return res.status(400).json({ message: 'No payment proof submitted for this participant' });
        }

        user.paymentStatus = decision;
        user.paymentDecisionAt = new Date();
        user.status = decision === 'approved' ? 'active' : 'disqualified';
        await user.save();

        const appBase = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const decisionData = buildPaymentDecisionContent({ name: user.name, approved: decision === 'approved' });
        await sendEmail({
            email: user.email,
            subject: decision === 'approved' ? 'Payment Confirmed - Muthamizh Sangamam 2026' : 'Payment Rejected - Muthamizh Sangamam 2026',
            html: buildMailShell({ appBase, title: decisionData.title, subtitle: '', content: decisionData.content })
        });

        return res.json({
            message: decision === 'approved' ? 'Payment approved successfully' : 'Payment rejected and user disqualified',
            user: {
                id: user.id,
                paymentStatus: user.paymentStatus,
                status: user.status,
                paymentDecisionAt: user.paymentDecisionAt
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
