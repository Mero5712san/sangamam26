import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, User, Users2, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const mockCollegeDetails = {
    bit: {
        name: 'Bannari Amman Institute of Technology',
        stats: { total: 85, boys: 50, girls: 35, internal: 85 },
        eventWise: [
            { id: 1, name: 'Varna Kaaviyam', boys: 12, girls: 8, total: 20 },
            { id: 2, name: 'Dance Fusion', boys: 15, girls: 10, total: 25 },
            { id: 3, name: 'Art Canvas', boys: 8, girls: 7, total: 15 },
            { id: 4, name: 'Musical Harmony', boys: 15, girls: 10, total: 25 },
        ]
    }
};

export function CollegeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const college = mockCollegeDetails[id] || mockCollegeDetails.bit;

    if (role !== 'admin') {
        return <div className="p-8 text-center text-gray-500">Access Denied</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold uppercase tracking-wider text-xs">Back to Stats</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-sangamam-maroon rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                            {college.name}
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Institution Detail Analytics</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<Users className="text-blue-500" />} label="Total Participants" value={college.stats.total} />
                <StatCard icon={<User className="text-sangamam-maroon" />} label="Boys" value={college.stats.boys} />
                <StatCard icon={<User className="text-sangamam-gold" />} label="Girls" value={college.stats.girls} />
                <StatCard icon={<Building2 className="text-emerald-500" />} label="Internal Users" value={college.stats.internal} />
            </div>

            {/* Event-wise Breakdown */}
            <div className="rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900">Event-wise Breakdown</h2>
                    <p className="text-sm text-gray-500">How students from this college are distributed across events.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-100">
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Event Name</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Boys</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Girls</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Total Participation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {college.eventWise.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-sangamam-gold/10 p-2 rounded-lg text-sangamam-gold">
                                                <Calendar size={18} />
                                            </div>
                                            <span className="font-bold text-gray-800">{event.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="font-bold text-sangamam-maroon">{event.boys}</span>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="font-bold text-sangamam-gold">{event.girls}</span>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-800">
                                            {event.total}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}
