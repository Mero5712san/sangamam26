import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertTriangle, XCircle, Mail, Phone, GraduationCap, MapPin, Hash, CreditCard, Camera } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { useNotificationStore } from '../store/notificationStore';

export function ParticipantDetailPage() {
    const { slug, uuid } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToastStore();
    const { addNotification } = useNotificationStore();

    // Mock participant data (in real app, fetch by UUID)
    const [participant, setParticipant] = useState({
        uuid: uuid,
        name: 'Rahul Sharma',
        nameTamil: 'ராகுல் ஷர்மா',
        email: 'rahul@example.com',
        phone: '+91 98765 43210',
        rollNo: '20BCS001',
        college: 'Anna University, Chennai',
        gender: 'Male',
        place: 'Chennai',
        yearOfStudy: 'III',
        status: 'active',
        payment: {
            method: 'UPI',
            id: 'rahul@okaxis',
            proofUrl: 'https://via.placeholder.com/400x600?text=Payment+Proof'
        }
    });

    const handleStatusChange = (newStatus) => {
        setParticipant({ ...participant, status: newStatus });
        showToast(`User status updated to ${newStatus}`, 'success');
        
        addNotification({
            type: 'status_change',
            title: 'Account Status Modified',
            message: `User ${participant.name} is now ${newStatus}`,
            icon: newStatus === 'active' ? 'ShieldCheck' : newStatus === 'freezed' ? 'AlertTriangle' : 'XCircle'
        });
    };

    const statusStyles = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        freezed: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        disqualified: 'bg-red-500/10 text-red-400 border-red-500/30'
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-semibold"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Members</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-sangamam-maroon-deep border border-sangamam-border flex items-center justify-center text-3xl text-sangamam-gold font-bold shadow-xl">
                        {participant.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{participant.name}</h1>
                        <p className="text-sangamam-gold font-tamil">{participant.nameTamil}</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-bold capitalize ${statusStyles[participant.status]}`}>
                    {participant.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Personal Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="sangamam-card p-6">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-sangamam-border pb-2">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem icon={<Mail size={18} />} label="Email Address" value={participant.email} />
                            <DetailItem icon={<Phone size={18} />} label="Phone Number" value={participant.phone} />
                            <DetailItem icon={<Hash size={18} />} label="Roll Number" value={participant.rollNo} />
                            <DetailItem icon={<GraduationCap size={18} />} label="Year of Study" value={`${participant.yearOfStudy} Year`} />
                            <DetailItem icon={<MapPin size={18} />} label="Place" value={participant.place} />
                            <div className="md:col-span-2">
                                <DetailItem icon={<ShieldCheck size={18} />} label="College" value={participant.college} />
                            </div>
                        </div>
                    </div>

                    <div className="sangamam-card p-6">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-sangamam-border pb-2">Management Controls</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <ActionButton 
                                onClick={() => handleStatusChange('active')} 
                                active={participant.status === 'active'}
                                color="emerald"
                                icon={<ShieldCheck size={20} />}
                                label="Active"
                            />
                            <ActionButton 
                                onClick={() => handleStatusChange('freezed')} 
                                active={participant.status === 'freezed'}
                                color="yellow"
                                icon={<AlertTriangle size={20} />}
                                label="Freeze"
                            />
                            <ActionButton 
                                onClick={() => handleStatusChange('disqualified')} 
                                active={participant.status === 'disqualified'}
                                color="red"
                                icon={<XCircle size={20} />}
                                label="Disqualify"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Payment Details */}
                <div className="space-y-6">
                    <div className="sangamam-card p-6">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-sangamam-border pb-2">Payment Verification</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-400">
                                <CreditCard size={18} className="text-sangamam-gold" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider">Method</p>
                                    <p className="text-white font-semibold">{participant.payment.method}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <Hash size={18} className="text-sangamam-gold" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider">Transaction ID / Account</p>
                                    <p className="text-white font-semibold">{participant.payment.id}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <p className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                                    <Camera size={16} /> Payment Proof
                                </p>
                                <div className="rounded-xl overflow-hidden border border-sangamam-border group relative">
                                    <img 
                                        src={participant.payment.proofUrl} 
                                        alt="Payment Proof" 
                                        className="w-full h-auto transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button className="bg-white text-sangamam-maroon px-4 py-2 rounded-lg font-bold text-sm">
                                            View Full Screen
                                        </button>
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
        <div className="flex items-start gap-3">
            <div className="mt-1 text-sangamam-gold">{icon}</div>
            <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{label}</p>
                <p className="text-white font-medium">{value}</p>
            </div>
        </div>
    );
}

function ActionButton({ onClick, active, color, icon, label }) {
    const colors = {
        emerald: active ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-transparent border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10',
        yellow: active ? 'bg-yellow-500 border-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-transparent border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10',
        red: active ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-transparent border-red-500/30 text-red-500 hover:bg-red-500/10'
    };

    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-300 font-bold ${colors[color]}`}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    );
}
