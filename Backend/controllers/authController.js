const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const buildMailShell = require('../utils/emailTemplate');

const PAYMENT_URL = 'https://payments.bitsathy.ac.in/muthamil-sangamam-2026';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const isInternalCollege = (college) => {
    const normalized = normalizeText(college);
    return normalized.includes('bannari amman institute of technology') || normalized === 'bit_sathy';
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        let otpRecord = await OtpVerification.findOne({ where: { email } });
        if (otpRecord) {
            otpRecord.otp = otp;
            otpRecord.otpExpires = otpExpires;
            otpRecord.isVerified = false;
            await otpRecord.save();
        } else {
            await OtpVerification.create({ email, otp, otpExpires });
        }

        const appBase = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

        await sendEmail({
            email: email,
            subject: 'Verify your email address - Sangamam',
            html: buildMailShell({
                appBase,
                title: 'Email verification',
                subtitle: 'Complete OTP verification to continue registration',
                content: `
                    <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hi there,</p>
                    <p style="font-size: 15px; color: #f5e1b3; line-height:1.6; margin:0 0 20px 0;">Use the 6-digit verification code below to verify your email address.</p>
                    <div style="margin: 20px 0;">
                        <div style="display:inline-block; padding:18px 36px; background-color:#f1c40f; color:#2a130d; font-size:28px; font-weight:700; letter-spacing:8px; border-radius:10px;">${otp}</div>
                        <div style="font-size:12px; color:#d6c7a3; margin-top:10px;">This code expires in 10 minutes</div>
                    </div>
                    <div style="margin-top:24px; font-size:13px; color:#d6c7a3;">If you did not request this, you can ignore this email.</div>
                `
            })
        });

        res.json({ message: 'OTP sent to ' + email });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, college, rollNo, department, year, phone, gender } = req.body;

        const otpRecord = await OtpVerification.findOne({ where: { email } });
        if (!otpRecord || !otpRecord.isVerified) {
            return res.status(400).json({ message: 'Email not verified with OTP' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const internalParticipant = isInternalCollege(college);
        const participantType = internalParticipant ? 'internal' : 'external';
        const paymentStatus = internalParticipant ? 'not_required' : 'pending';

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'participant',
            college,
            rollNo,
            department,
            year,
            phone,
            gender,
            participantType,
            paymentStatus
        });

        await otpRecord.destroy();

        console.log(`Attempting to send registration success email to: ${user.email}`);
        const appBase = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const registrationContent = internalParticipant
            ? `
                <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin-bottom: 18px;">
                    Hello <strong>${user.name}</strong>, your registration for <strong>Muthamizh Sangamam 2026</strong> is successful.
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #f5e1b3; margin: 0;">
                    You have successfully registered for Sangamam event.
                </p>
            `
            : `
                <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin-bottom: 18px;">
                    Hello <strong>${user.name}</strong>, your registration for <strong>Muthamizh Sangamam 2026</strong> is successful.
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #f5e1b3; margin: 0 0 18px 0;">
                    Registration successful, but payment is pending. Portal access is enabled without payment.
                </p>
                <a href="${PAYMENT_URL}" style="display:inline-block; padding:12px 22px; border-radius:10px; text-decoration:none; font-weight:700; background:#f1c40f; color:#2a130d;">Pay Now</a>
                <p style="font-size: 12px; color: #d6c7a3; margin-top: 14px;">If the button does not work, use this link: ${PAYMENT_URL}</p>
            `;

        await sendEmail({
            email: user.email,
            subject: 'Registration Successful - Muthamizh Sangamam 2026',
            html: buildMailShell({
                appBase,
                title: 'Registration Successful',
                subtitle: internalParticipant ? 'Internal participant access granted' : 'External participant payment pending',
                content: registrationContent
            })
        });

        res.status(201).json({
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role,
            assignedEventIds: user.assignedEventIds || [],
            participantType: user.participantType,
            paymentStatus: user.paymentStatus,
            paymentProofImage: user.paymentProofImage,
            token: generateToken(user.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.authUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (user && (await user.matchPassword(password))) {
            if (user.status && user.status !== 'active') {
                return res.status(403).json({
                    message: user.status === 'freezed'
                        ? 'Your account has been freezed. Contact the admin to regain access.'
                        : 'Your account has been disqualified and cannot log in.'
                });
            }

            res.json({
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                status: user.status,
                assignedEventIds: user.assignedEventIds || [],
                participantType: user.participantType,
                paymentStatus: user.paymentStatus,
                paymentProofImage: user.paymentProofImage,
                token: generateToken(user.id),
                isVerified: true
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        res.json({
            id: req.user.id,
            uuid: req.user.uuid,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            college: req.user.college,
            assignedEventIds: req.user.assignedEventIds || [],
            participantType: req.user.participantType,
            paymentStatus: req.user.paymentStatus,
            paymentProofImage: req.user.paymentProofImage,
            status: req.user.status,
            token: req.headers.authorization?.split(' ')[1] || req.user.token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpRecord = await OtpVerification.findOne({ where: { email } });

        if (!otpRecord) return res.status(404).json({ message: 'No OTP requested for this email' });

        if (otpRecord.otp === otp && new Date(otpRecord.otpExpires) > new Date()) {
            otpRecord.isVerified = true;
            await otpRecord.save();
            res.json({ message: 'Email verified successfully', isVerified: true });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
