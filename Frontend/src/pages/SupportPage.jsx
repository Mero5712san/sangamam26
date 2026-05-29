import React from 'react';
import { ArrowLeft, Phone, Mail, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SupportPage() {
    const navigate = useNavigate();

    const admins = [
        { name: 'Prabhavathi', role: 'Event Coordinator', email: 'rajesh.admin@sangamam.edu', phone: '+91 98765 43210' },
        { name: 'Lathika ', role: 'Event Coordinator', email: 'meera.iyer@sangamam.edu', phone: '+91 91234 56780' },
        { name: 'Surya Raj', role: 'Event Coordinator', email: 'arvind.tech@sangamam.edu', phone: '+91 82345 67890' },
        { name: 'Jai Krishna', role: 'Event Coordinator', email: 'shalini.support@sangamam.edu', phone: '+91 73456 78901' },
    ];

    return (
        <div className="min-h-screen bg-[#120705] p-6 flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Go Back</span>
                    </button>
                    <div className="text-right">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sangamam-gold">Help Center</p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-sangamam-gold/10 border border-sangamam-gold/20 rounded-2xl p-6 flex items-start gap-4">
                    <ShieldCheck className="text-sangamam-gold flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-white mb-1">Account Resolution</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            If your account has been freezed or disqualified, please reach out to any of our administrators listed below. 
                            Provide your **Full Name**, **Roll Number**, and **Registration ID** for faster resolution.
                        </p>
                    </div>
                </div>

                {/* Admin Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {admins.map((admin, idx) => (
                        <div key={idx} className="sangamam-card p-6 flex items-start gap-4 hover:border-sangamam-gold transition-colors group">
                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sangamam-gold group-hover:bg-sangamam-gold/20 transition-all">
                                <User size={28} />
                            </div>
                            <div className="space-y-3 flex-1">
                                <div>
                                    <h4 className="text-xl font-bold text-white">{admin.name}</h4>
                                    <p className="text-xs font-semibold text-sangamam-gold uppercase tracking-wider">{admin.role}</p>
                                </div>
                                <div className="space-y-2">
                                    <a href={`mailto:${admin.email}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                                        <Mail size={16} className="text-sangamam-gold" />
                                        {admin.email}
                                    </a>
                                    <a href={`tel:${admin.phone}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                                        <Phone size={16} className="text-sangamam-gold" />
                                        {admin.phone}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center pt-8">
                    <p className="text-sm text-gray-500">
                        Feel free to reach out to us any time.
                    </p>
                </div>
            </div>
        </div>
    );
}
