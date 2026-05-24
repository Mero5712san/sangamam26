import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Hash, GraduationCap, Calendar, CheckCircle2, ArrowRight, Lock, Users2 } from 'lucide-react';
import { useToastStore } from '../store/toastStore';

export function VolunteerRegistrationPage() {
    const navigate = useNavigate();
    const { showToast } = useToastStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        rollNo: '',
        department: '',
        year: '1',
        gender: 'Male',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.rollNo || !formData.department || !formData.password) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        setStep(2); // Success step
        showToast('Volunteer registration submitted successfully!', 'success');
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-sangamam-dark flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#2a130d] border border-sangamam-border rounded-[2.5rem] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-sangamam-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-sangamam-gold">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">Application Received!</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Thank you for your interest in volunteering for Sangamam. Our team will review your application and contact you soon.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-sangamam-gold text-[#2a130d] font-bold rounded-2xl hover:bg-sangamam-gold/90 transition-all shadow-lg"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sangamam-dark flex items-center justify-center p-6 py-12">
            <div className="max-w-2xl w-full bg-[#2a130d] border border-sangamam-border rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-sangamam-border bg-gradient-to-br from-sangamam-maroon/20 to-transparent">
                    <p className="text-sangamam-gold font-bold uppercase tracking-[0.2em] text-[10px]">Volunteer Registration for Sangamam 2026</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Full Name *
                            </label>
                            <input 
                                type="text" name="name" required
                                value={formData.name} onChange={handleChange}
                                placeholder="Enter your full name"
                                className="sangamam-input w-full px-5 py-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Mail size={14} /> Email Address *
                            </label>
                            <input 
                                type="email" name="email" required
                                value={formData.email} onChange={handleChange}
                                placeholder="name@college.edu"
                                className="sangamam-input w-full px-5 py-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Phone size={14} /> Phone Number *
                            </label>
                            <input 
                                type="tel" name="phone" required
                                value={formData.phone} onChange={handleChange}
                                placeholder="+91 XXXXX XXXXX"
                                className="sangamam-input w-full px-5 py-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Hash size={14} /> Roll Number *
                            </label>
                            <input 
                                type="text" name="rollNo" required
                                value={formData.rollNo} onChange={handleChange}
                                placeholder="Enter your roll number"
                                className="sangamam-input w-full px-5 py-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap size={14} /> Department *
                            </label>
                            <input 
                                type="text" name="department" required
                                value={formData.department} onChange={handleChange}
                                placeholder="e.g. CSE, IT, ECE"
                                className="sangamam-input w-full px-5 py-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Academic Year
                            </label>
                            <select 
                                name="year" value={formData.year} onChange={handleChange}
                                className="sangamam-input w-full px-5 py-4 text-sm appearance-none"
                            >
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Users2 size={14} /> Gender *
                            </label>
                            <div className="flex gap-6 p-4 bg-black/20 rounded-2xl border border-sangamam-border h-[52px] items-center">
                                {['Male', 'Female'].map((g) => (
                                    <label key={g} className="flex items-center gap-2 cursor-pointer text-gray-300 text-sm">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value={g}
                                            checked={formData.gender === g}
                                            onChange={handleChange}
                                            className="accent-sangamam-gold h-4 w-4"
                                        />
                                        {g}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={14} /> Set Password *
                            </label>
                            <input 
                                type="password" name="password" required
                                value={formData.password} onChange={handleChange}
                                placeholder="••••••••"
                                className="sangamam-input w-full px-5 py-4 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            className="w-full py-5 bg-sangamam-gold text-[#2a130d] font-black rounded-2xl hover:bg-sangamam-gold/90 transition-all shadow-[0_10px_30px_rgba(216,162,69,0.2)] flex items-center justify-center gap-3 group"
                        >
                            Submit Application <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
