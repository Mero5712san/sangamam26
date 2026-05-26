import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, User, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../services/api';

export function CollegeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const [collegeData, setCollegeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCollege = async () => {
            setIsLoading(true);
            setError('');
            try {
                const { data } = await userAPI.getCollegeDetails(id);
                setCollegeData(data);
            } catch (err) {
                setCollegeData(null);
                setError(err.response?.data?.message || 'Failed to load college details');
            } finally {
                setIsLoading(false);
            }
        };

        loadCollege();
    }, [id]);

    const stats = useMemo(() => collegeData?.stats || { total: 0, boys: 0, girls: 0, internal: 0 }, [collegeData]);
    const eventWise = collegeData?.eventWise || [];
    const collegeName = collegeData?.college?.name || 'College Details';

    if (role !== 'admin') {
        return <div className="p-8 text-center text-gray-500">Access Denied</div>;
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-sangamam-gold" size={36} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-start">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-bold uppercase tracking-wider text-xs">Back to Stats</span>
                    </button>
                </div>
                <div className="rounded-[2rem] border border-white/5 bg-white/5 p-10 text-gray-400">
                    <AlertCircle className="mx-auto mb-3 text-gray-500" size={36} />
                    <p className="font-semibold text-white">{error}</p>
                </div>
            </div>
        );
    }

    if (!collegeData) {
        return <div className="p-8 text-center text-gray-500">College not found</div>;
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
                            {collegeName}
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Institution Detail Analytics</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<Users className="text-blue-500" />} label="Total Participants" value={stats.total} />
                <StatCard icon={<User className="text-sangamam-maroon" />} label="Boys" value={stats.boys} />
                <StatCard icon={<User className="text-sangamam-gold" />} label="Girls" value={stats.girls} />
                <StatCard icon={<Building2 className="text-emerald-500" />} label="Internal Users" value={stats.internal} />
            </div>

            <div className="rounded-[2rem] bg-white p-4 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900">Event-wise Breakdown</h2>
                    <p className="text-sm text-gray-500">How students from this college are distributed across events.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr className="text-left border-b border-gray-100">
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Event Name</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Boys</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Girls</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Total Participation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {eventWise.map((event) => (
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
