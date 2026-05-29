import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, School, Hash, GraduationCap, CheckCircle, XCircle, ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { registrationAPI } from '../services/api';

const mockRegisteredEvents = [
    { id: 1, name: 'Varna Kaaviyam', date: 'May 15', time: '2:00 PM', venue: 'Main Auditorium', status: 'pending' },
    { id: 2, name: 'Dance Fusion', date: 'May 16', time: '5:00 PM', venue: 'Open Stage', status: 'present' },
    { id: 4, name: 'Musical Harmony', date: 'May 18', time: '3:00 PM', venue: 'Music Hall', status: 'absent' },
];

export function ParticipantApprovalPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToastStore();
    const [registrations, setRegistrations] = useState([]);
    const [participant, setParticipant] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await registrationAPI.getUserRegistrations(id);
                const normalized = (Array.isArray(data) ? data : []).map((registration) => ({
                    ...registration,
                    id: registration.id ?? registration._id,
                }));
                setRegistrations(normalized);
                if (normalized.length > 0) setParticipant(normalized[0].user);
            } catch (error) {
                showToast('Failed to load participant data', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleMarkAttendance = async (regId, status) => {
        try {
            await registrationAPI.markAttendance(regId, status);
            setRegistrations(registrations.map((r) => (r.id === regId ? { ...r, status } : r)));
            showToast(`Attendance marked as ${status}`, 'success');
        } catch (error) {
            showToast('Failed to mark attendance', 'error');
        }
    };

    if (isLoading) return <div className="p-20 text-center">Loading participant data...</div>;
    if (!participant) return <div className="p-20 text-center">Participant not found</div>;

    return (
        <div className="min-h-screen bg-sangamam-dark text-white p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/approvals')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Participant Approval</h1>
                        <p className="text-sangamam-gold text-[10px] font-bold uppercase tracking-widest">Verify and Mark Attendance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Side: Registered Events */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="text-sangamam-gold" size={20} /> Registered Events
                            </h2>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {registrations.length} Total
                            </span>
                        </div>

                        <div className="space-y-4">
                            {registrations.map((reg) => (
                                <div key={reg.id} className="sangamam-card p-6 border border-sangamam-border hover:border-sangamam-gold/50 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-sangamam-gold transition-colors">{reg.event?.name || 'Unnamed Event'}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {reg.event?.date || 'Date not set'}, {reg.event?.time || 'Time not set'}</span>
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {reg.event?.venue || 'Venue not set'}</span>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${reg.status === 'participating' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            reg.status === 'absent' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                reg.status === 'completed' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                    'bg-white/5 border-white/10 text-gray-400'
                                            }`}>
                                            {reg.status}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleMarkAttendance(reg.id, 'participating')}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${reg.status === 'participating'
                                                ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                                                }`}
                                        >
                                            <CheckCircle size={14} /> Present
                                        </button>
                                        <button
                                            onClick={() => handleMarkAttendance(reg.id, 'absent')}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${reg.status === 'absent'
                                                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white'
                                                }`}
                                        >
                                            <XCircle size={14} /> Absent
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Participant Details */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User className="text-sangamam-gold" size={20} /> Participant Details
                        </h2>

                        <div className="sangamam-card p-8 border border-sangamam-border space-y-8 bg-gradient-to-br from-white/5 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-3xl bg-sangamam-maroon flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                                    {String(participant.name || '?').trim().charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">{participant.name || 'Participant'}</h3>
                                    <p className="text-sangamam-gold text-xs font-bold uppercase tracking-[0.2em]">{participant.rollNo || 'No Roll Number'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <DetailItem icon={<Mail size={16} />} label="Email Address" value={participant.email} />
                                <DetailItem icon={<Phone size={16} />} label="Contact Number" value={participant.phone} />
                                <DetailItem icon={<School size={16} />} label="Institution" value={participant.college} />
                                <DetailItem icon={<GraduationCap size={16} />} label="Department" value={participant.department} />
                                <DetailItem icon={<Hash size={16} />} label="Academic Year" value={participant.year} />
                                <DetailItem icon={<User size={16} />} label="Gender" value={participant.gender} />
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Verification Status</p>
                                        <p className="text-sm font-bold text-emerald-400">Identity Verified & Registered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon, label, value }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                {icon} {label}
            </label>
            <p className="text-sm font-bold text-white">{value}</p>
        </div>
    );
}
