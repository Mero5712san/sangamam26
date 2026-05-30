import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Mail, Lock, User, Phone, MapPin, GraduationCap, School, Hash, Languages, CheckCircle, ShieldCheck } from 'lucide-react';
import { SearchSelect } from '../components/SearchSelect';

const COLLEGES = [
    { label: "Bannari Amman Institute of Technology", value: "bit_sathy" },
    { label: "Anna University, Chennai", value: "anna_univ" },
    { label: "IIT Madras, Chennai", value: "iitm" },
    { label: "NIT Trichy", value: "nitt" },
    { label: "PSG College of Technology, Coimbatore", value: "psg_tech" },
    { label: "SSN College of Engineering, Chennai", value: "ssn" },
    { label: "VIT University, Vellore", value: "vit" },
    { label: "SRM Institute of Science and Technology, Chennai", value: "srm" },
    { label: "SASTRA University, Thanjavur", value: "sastra" },
    { label: "Amrita Vishwa Vidyapeetham, Coimbatore", value: "amrita" },
    { label: "Madras Christian College (MCC), Chennai", value: "mcc" },
    { label: "Loyola College, Chennai", value: "loyola" },
    { label: "Ethiraj College for Women, Chennai", value: "ethiraj" },
    { label: "Stella Maris College, Chennai", value: "stella_maris" },
    { label: "Presidency College, Chennai", value: "presidency" },
    { label: "PSG College of Arts and Science, Coimbatore", value: "psg_arts" },
    { label: "St. Joseph's College, Trichy", value: "st_josephs" },
    { label: "Bishop Heber College, Trichy", value: "bishop_heber" },
    { label: "The American College, Madurai", value: "american_college" },
    { label: "The Madura College, Madurai", value: "madura_college" },
    { label: "Thiagarajar College, Madurai", value: "thiagarajar" },
    { label: "Jamal Mohamed College, Trichy", value: "jamal_mohamed" },
    { label: "National College, Trichy", value: "national_college" },
    { label: "Holy Cross College, Trichy", value: "holy_cross" },
    { label: "Lady Doak College, Madurai", value: "lady_doak" },
    { label: "Fatima College, Madurai", value: "fatima" },
    { label: "Gandhigram Rural Institute, Dindigul", value: "gandhigram" },
    { label: "Alagappa University, Karaikudi", value: "alagappa" },
    { label: "Madurai Kamaraj University, Madurai", value: "mku" },
    { label: "Bharathiar University, Coimbatore", value: "bharathiar" },
    { label: "Bharathidasan University, Trichy", value: "bharathidasan" },
    { label: "Manonmaniam Sundaranar University, Tirunelveli", value: "msu" },
    { label: "Periyar University, Salem", value: "periyar" },
    { label: "Annamalai University, Chidambaram", value: "annamalai" },
    { label: "University of Madras, Chennai", value: "madras_univ" }
];

export function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const { showToast } = useToastStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('participant');
    const [isSignUp, setIsSignUp] = useState(false);

    // Signup Fields
    const [nameEnglish, setNameEnglish] = useState('');
    const [nameTamil, setNameTamil] = useState('');
    const [rollNo, setRollNo] = useState('');
    const [phone, setPhone] = useState('');
    const [college, setCollege] = useState('');
    const [department, setDepartment] = useState('');
    const [gender, setGender] = useState('');
    const [place, setPlace] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');

    // OTP State
    const [otp, setOtp] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    const handleSendOtp = async () => {
        if (!email.includes('@')) {
            showToast('Please enter a valid email', 'warning');
            return;
        }
        setIsSendingOtp(true);
        try {
            await useAuthStore.getState().sendOtp({ email });
            showToast('Verification code sent to ' + email, 'success');
            setShowOtpInput(true);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to send verification code', 'error');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const data = await useAuthStore.getState().verifyOtp({ email, otp });
            setIsEmailVerified(true);
            setShowOtpInput(false);
            showToast('Email verified successfully!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Invalid OTP', 'error');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isSignUp) {
            if (!isEmailVerified) {
                showToast('Please verify your email with OTP first', 'warning');
                return;
            }
            if (!nameEnglish.trim() || !nameTamil.trim() || !email.trim() || !phone.trim() || !rollNo.trim() || !place.trim() || !password.trim() || !department.trim()) {
                showToast('Please fill all personal details', 'warning');
                return;
            }
            if (!college || !college.value) {
                showToast('Please select your college', 'warning');
                return;
            }
            if (!gender) {
                showToast('Please select your gender', 'warning');
                return;
            }
            if (!yearOfStudy) {
                showToast('Please select your year of study', 'warning');
                return;
            }

            handleFinishSignup(college?.value === 'bit_sathy');
        } else {
            // Sign In Logic
            if (!email.trim() || !password.trim()) {
                showToast('Please enter both email and password', 'warning');
                return;
            }
            handleLoginSubmit(e);
        }
    };

    const handleFinishSignup = async (isInternal = false) => {
        const collegeLabel = college?.label || 'Unknown College';

        const userData = {
            name: nameEnglish,
            email,
            password,
            role: 'participant',
            college: collegeLabel,
            rollNo,
            phone,
            department,
            gender,
            year: yearOfStudy
        };

        try {
            await useAuthStore.getState().register(userData);
            showToast(
                isInternal
                    ? 'Registration successful! Internal access granted.'
                    : 'Registration successful! Pay now to complete verification.',
                'success'
            );
            navigate('/events');
        } catch (error) {
            showToast(error.response?.data?.message || 'Registration failed', 'error');
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await useAuthStore.getState().login({ email, password });
            showToast(`Welcome back, ${user.name}!`, 'success');
            navigate('/events');
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            if (/disqualified|freezed/i.test(message)) {
                useAuthStore.getState().setBlockedAccess({ status: 'disqualified', message });
                navigate('/blocked');
                return;
            }
            showToast(message, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-transparent py-10 lg:py-4">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 border-b border-sangamam-border bg-[rgba(31,14,9,0.86)] backdrop-blur-xl z-50">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-3">
                    <h1 className="cursor-pointer text-xl font-bold text-sangamam-gold" onClick={() => navigate('/')}>
                        Sangamam
                    </h1>
                </div>
            </div>

            <div className={`w-full ${isSignUp ? 'max-w-5xl' : 'max-w-md'} mt-12 lg:mt-8 transition-all duration-500 ease-in-out`}>
                <div className="sangamam-card p-4 md:p-8">
                    <div className="mb-4">
                        <h2 className="text-center text-2xl font-bold text-sangamam-gold">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-gray-500 text-center text-sm">
                            {isSignUp ? 'Join the Sangamam community' : 'Sign in to your account'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Name in English */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Name in English</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                        <input
                                            type="text"
                                            value={nameEnglish}
                                            onChange={(e) => setNameEnglish(e.target.value)}
                                            className="sangamam-input w-full pl-9 pr-4 py-1.5 text-sm"
                                            placeholder="Your name"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Name in Tamil */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">பெயர் (தமிழில்)</label>
                                    <div className="relative">
                                        <Languages size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                        <input
                                            type="text"
                                            value={nameTamil}
                                            onChange={(e) => setNameTamil(e.target.value)}
                                            className="sangamam-input w-full pl-9 pr-4 py-1.5 font-tamil text-sm"
                                            placeholder="உங்கள் பெயர்"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email with Verification */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Email</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Mail size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setIsEmailVerified(false);
                                                }}
                                                className={`sangamam-input w-full pl-9 pr-4 py-1.5 text-sm ${isEmailVerified ? 'border-green-500/50' : ''}`}
                                                placeholder="your@email.com"
                                                required
                                                disabled={isEmailVerified}
                                            />
                                            {isEmailVerified && (
                                                <CheckCircle size={14} className="absolute right-3 top-2.5 text-green-500" />
                                            )}
                                        </div>
                                        {!isEmailVerified && !showOtpInput && (
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={isSendingOtp}
                                                className="px-3 py-1.5 bg-sangamam-gold text-[#2a130d] text-xs font-bold rounded-lg hover:bg-sangamam-gold/80 transition-colors flex items-center gap-1"
                                            >
                                                {isSendingOtp ? 'Sending...' : 'Verify'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* OTP Input */}
                                {showOtpInput && !isEmailVerified && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Enter 6-Digit OTP</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <ShieldCheck size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    className="sangamam-input w-full pl-9 pr-4 py-1.5 text-sm tracking-[0.5em] font-mono"
                                                    placeholder="000000"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleVerifyOtp}
                                                className="px-4 py-1.5 bg-sangamam-gold text-[#2a130d] text-xs font-bold rounded-lg hover:bg-sangamam-gold/80 transition-colors"
                                            >
                                                Verify Code
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Check your inbox for the verification code.</p>
                                    </div>
                                )}

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Phone Number</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                        <input
                                            type="tel"
                                            pattern="[0-9]{10}"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="sangamam-input w-full pl-9 pr-4 py-1.5 text-sm"
                                            placeholder="10 digit number"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Roll Number */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Roll Number</label>
                                    <div className="relative">
                                        <Hash size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                        <input
                                            type="text"
                                            value={rollNo}
                                            onChange={(e) => setRollNo(e.target.value)}
                                            className="sangamam-input w-full pl-9 pr-4 py-1.5 text-sm"
                                            placeholder="Roll No"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Place */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Place</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                        <input
                                            type="text"
                                            value={place}
                                            onChange={(e) => setPlace(e.target.value)}
                                            className="sangamam-input w-full pl-9 pr-4 py-1.5 text-sm"
                                            placeholder="Your place"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* College & Department */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">College Name</label>
                                    <div className="relative">
                                        <School size={16} className="absolute left-3 top-2.5 text-sangamam-gold z-10" />
                                        <div className="pl-9">
                                            <SearchSelect
                                                options={COLLEGES}
                                                multiple={false}
                                                onChange={setCollege}
                                                placeholder="Search and select college"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Department</label>
                                    <div className="relative">
                                        <GraduationCap size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="sangamam-input w-full pl-9 pr-4 py-1.5 text-sm"
                                            placeholder="e.g. CSE, IT"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Gender</label>
                                    <div className="flex gap-4 p-2 bg-[rgba(255,255,255,0.02)] rounded-lg  border-sangamam-border h-[38px] items-center">
                                        {['Male', 'Female', 'Other'].map((g) => (
                                            <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sangamam-gold text-xs">
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value={g}
                                                    checked={gender === g}
                                                    onChange={(e) => setGender(e.target.value)}
                                                    className="accent-sangamam-gold h-3 w-3"
                                                />
                                                {g}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Year of Study */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Year of Study</label>
                                    <div className="flex flex-wrap gap-2.5 p-2 bg-[rgba(255,255,255,0.02)] rounded-lg  border-sangamam-border h-[38px] items-center">
                                        {['I', 'II', 'III', 'IV'].map((y) => (
                                            <label key={y} className="flex items-center gap-1 cursor-pointer text-sangamam-gold text-xs">
                                                <input
                                                    type="radio"
                                                    name="yearOfStudy"
                                                    value={y}
                                                    checked={yearOfStudy === y}
                                                    onChange={(e) => setYearOfStudy(e.target.value)}
                                                    className="accent-sangamam-gold h-3 w-3"
                                                />
                                                {y}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-sangamam-gold">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-2.5 text-sangamam-gold" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="sangamam-input w-full pl-9 pr-4 py-1.5 text-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="block font-semibold mb-2 text-sangamam-gold">Email</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-3 text-sangamam-gold" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="sangamam-input w-full pl-10 pr-4 py-2"
                                            placeholder={
                                                role === 'participant' ? 'your@email.com' :
                                                    role === 'admin' ? 'name@admin.sangamam.in' :
                                                        role === 'incharge' ? 'name@incharge.sangamam.in' :
                                                            'name@volunteer.sangamam.in'
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold mb-2 text-sangamam-gold">Password</label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-3 text-sangamam-gold" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="sangamam-input w-full pl-10 pr-4 py-2"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* <div>
                                    <label className="block font-semibold mb-2 text-sangamam-gold">I am a</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="sangamam-input w-full px-4 py-2"
                                    >
                                        <option value="participant">Participant</option>
                                        <option value="incharge">Event In-Charge</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div> */}
                            </div>
                        )}

                        <div className="flex justify-center pt-2">
                            <button
                                type="submit"
                                disabled={isSignUp && !isEmailVerified}
                                className={`w-full ${isSignUp ? 'lg:w-1/3' : ''} sangamam-button py-2 text-lg font-bold rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    {!isSignUp && (
                        <p className="text-gray-500 text-center mt-4 text-sm">
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setEmail('');
                                    setPassword('');
                                }}
                                className="text-sangamam-gold font-bold hover:text-sangamam-gold-soft transition-colors"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
