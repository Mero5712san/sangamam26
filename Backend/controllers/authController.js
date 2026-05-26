const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        // Check if user already exists in permanent table
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Upsert OTP record
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
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #2a130d; padding: 20px;">
                    <div style="background: linear-gradient(180deg,#3d1c13,#2a130d); border-radius: 12px; overflow: hidden; border: 2px solid #6b3f26;">
                        <!-- Header with Logo -->
                        <div style="padding: 24px; text-align: center;">
                            <img src="${appBase}/logo.png" alt="Sangamam" style="width:72px; height:72px; object-fit:contain; display:block; margin:0 auto;" />
                        </div>

                        <!-- Banner -->
                        <div style="background: linear-gradient(90deg,#3d1c13,#2a130d); padding: 30px 20px; text-align: center;">
                            <h1 style="color: #f1c40f; font-size: 22px; margin: 0;">Email verification</h1>
                        </div>

                        <!-- Content -->
                        <div style="padding: 30px; color: #f5e1b3; text-align: center;">
                            <p style="font-size: 16px; color: #ffffff; margin: 0 0 12px 0;">Hi there,</p>
                            <p style="font-size: 15px; color: #f5e1b3; line-height:1.6; margin:0 0 20px 0;">You're almost set to start using <strong>Sangamam Portal</strong>. Use the 6-digit verification code below to verify your email address.</p>

                            <div style="margin: 20px 0;">
                                <div style="display:inline-block; padding:18px 36px; background-color:#f1c40f; color:#2a130d; font-size:28px; font-weight:700; letter-spacing:8px; border-radius:10px;">${otp}</div>
                                <div style="font-size:12px; color:#d6c7a3; margin-top:10px;">This code expires in 10 minutes</div>
                            </div>

                            <div style="margin-top:24px; font-size:13px; color:#d6c7a3;">If you didn't request this, you can safely ignore this email.</div>
                        </div>

                        <!-- Footer -->
                        <div style="padding:18px; text-align:center; background:#3d1c13; color:#b8860b; font-size:12px;">
                            <div>Bannari Amman Institute of Technology — Sathyamangalam</div>
                            <div style="margin-top:8px;"><a href="#" style="color:#b8860b; text-decoration:underline;">Privacy Policy</a> | <a href="#" style="color:#b8860b; text-decoration:underline;">Contact</a></div>
                        </div>
                    </div>
                </div>
            `
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

        // 1. Check if email is verified in the temp table
        const otpRecord = await OtpVerification.findOne({ where: { email } });
        if (!otpRecord || !otpRecord.isVerified) {
            return res.status(400).json({ message: 'Email not verified with OTP' });
        }

        // 2. Final check if user exists (concurrency safety)
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // 3. Create the permanent user record
        const user = await User.create({
            name, email, password, role: role || 'participant', college, rollNo, department, year, phone, gender
        });

        // 4. Cleanup the temp OTP record
        await otpRecord.destroy();

        // 5. Send Success Email
        console.log(`Attempting to send registration success email to: ${user.email}`);
        const appBase = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        await sendEmail({
            email: user.email,
            subject: 'Registration Successful - Muthamizh Sangamam 2026',
            html: `
                <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #2a130d; color: #f1c40f; border: 4px solid #b8860b; border-radius: 12px; overflow: hidden;">
                    <!-- Header Banner -->
                    <div style="padding: 30px; text-align: center; background: linear-gradient(to bottom, #3d1c13, #2a130d);">
                         <div style="color: #f1c40f; font-size: 14px; margin-bottom: 5px;">பண்ணாரி அம்மன் தொழில்நுட்பக் கல்லூரி</div>
                         <div style="color: #ffffff; font-size: 12px; letter-spacing: 2px;">சத்தியமங்கலம் - 638401</div>
                         <h1 style="color: #f1c40f; font-size: 32px; margin: 15px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">முத்தமிழ் மன்றம்</h1>
                         <div style="color: #ffffff; font-style: italic; font-size: 14px;">தமிழன்புடன் வழங்கும்</div>
                    </div>

                    <!-- Cultural Graphic (Emblem) -->
                    <div style="text-align: center; padding: 20px;">
                        <img src="${encodeURI(appBase + '/public/Mandran Logo.png')}" width="120" style="display:block; margin:0 auto;" />
                    </div>

                    <!-- Main Content -->
                    <div style="padding: 40px; text-align: center; background-image: url('https://www.transparenttextures.com/patterns/dark-matter.png');">
                        <h2 style="font-size: 28px; margin-bottom: 10px; color: #ffffff;">Success!</h2>
                        <div style="font-size: 18px; margin-bottom: 30px; color: #f1c40f;">பதிவு வெற்றிகரமாக முடிந்தது</div>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin-bottom: 30px;">
                            வணக்கம் <strong>${user.name}</strong>,<br/>
                            Your account for <strong>Muthamizh Sangamam 2026</strong> has been successfully created. 
                            Get ready to experience the grand celebration of Tamil culture, art, and literature.
                        </p>

                        <!-- Success Badge -->
                        <div style="display: inline-block; padding: 20px; border: 2px dashed #f1c40f; border-radius: 50%; margin-bottom: 30px;">
                            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="40" style="filter: invert(85%) sepia(54%) saturate(3133%) hue-rotate(359deg) brightness(103%) contrast(106%);" />
                        </div>

                        <div style="font-size: 14px; color: #b8860b; margin-top: 20px;">
                            சங்கமத்தில் சங்கமிப்போம்!<br/>
                            <span style="color: #ffffff; font-size: 12px;">ஜூலை 11, 2026, சனிக்கிழமை</span>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 20px; text-align: center; background-color: #3d1c13; font-size: 11px; color: #8d6e63; border-top: 1px solid #b8860b;">
                        © 2026 Muthamizh Mandram | BIT Sathy<br/>
                        For queries: muthamizhmandram@bitsathy.ac.in
                    </div>
                </div>
            `
        });

        res.status(201).json({
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role,
            assignedEventIds: user.assignedEventIds || [],
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
            res.json({
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                assignedEventIds: user.assignedEventIds || [],
                token: generateToken(user.id),
                isVerified: true // if they can login, they are verified
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
