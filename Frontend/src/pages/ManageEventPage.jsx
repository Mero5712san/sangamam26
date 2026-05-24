import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { eventAPI, registrationAPI } from '../services/api';
import { canManageEvent } from '../utils/eventAccess';

export function ManageEventPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuthStore();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        const loadEvent = async () => {
            try {
                const { data } = await eventAPI.getBySlug(slug);
                setEvent(data);
                const allowed = user?.role === 'admin' || canManageEvent(user, data);
                setIsAllowed(allowed);

                if (allowed && data?.id) {
                    const { data: registrations } = await registrationAPI.getEventRegistrations(data.id);
                    setParticipants(Array.isArray(registrations)
                        ? registrations.map((registration) => ({
                            id: registration.id,
                            uuid: registration.user?.uuid || registration.id,
                            name: registration.user?.name || 'Participant',
                            email: registration.user?.email || 'Unknown',
                            status: registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Registered'
                        }))
                        : []);
                }
            } catch (error) {
                setParticipants([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadEvent();
    }, [slug, user]);

    const filteredParticipants = participants.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-sangamam-gold" size={36} />
            </div>
        );
    }

    if (!isAllowed) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors font-semibold"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Events</span>
                </button>
                <div className="sangamam-card p-8 text-center">
                    <h1 className="text-2xl font-bold text-white">You do not have access to manage this event.</h1>
                    <p className="mt-2 text-gray-500">Only the mapped incharge or an admin can view this page.</p>
                </div>
            </div>
        );
    }

    const handleDownload = () => {
        const headers = ['ID,Name,Email,Status\n'];
        const csvContent = headers.concat(participants.map(p => `${p.id},"${p.name}","${p.email}","${p.status}"\n`)).join('');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `event_${slug}_participants.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors font-semibold"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Events</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="mt-2 text-3xl md:text-4xl font-bold text-white">Manage Event Members</h1>
                    <p className="mt-2 text-sm text-gray-500">{event?.name}</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#2a130d] shadow hover:bg-gray-100 transition-colors"
                >
                    <Download size={20} />
                    Download CSV
                </button>
            </div>

            <div className="sangamam-card p-6">
                <div className="mb-6 flex items-center bg-gray-50 border border-sangamam-border rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-sangamam-gold transition-all">
                    <Search className="text-gray-400 mr-3" size={20} />
                    <input
                        type="text"
                        placeholder="Search participants by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-gray-700 py-1"
                    />
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="text-gray-500 uppercase text-xs tracking-wider">
                                <th className="pb-2 px-4 font-semibold">Participant</th>
                                <th className="pb-2 px-4 font-semibold text-right">Registration Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParticipants.map(p => (
                                <tr key={p.id} className="bg-white hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-4 rounded-l-xl border-y-2 border-l-2 border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div
                                                onClick={() => navigate(`/event/${slug}/manage/${p.uuid}`)}
                                                className="flex-shrink-0 h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-white font-bold shadow-sm cursor-pointer hover:border-sangamam-gold transition-colors"
                                            >
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{p.name}</p>
                                                <p className="text-sm text-gray-500">{p.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 rounded-r-xl border-y-2 border-r-2 border-gray-100 text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${p.status === 'Registered' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                                p.status === 'Participating' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                    'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredParticipants.map(p => (
                        <div key={p.id} className="border-2 border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-4 bg-white transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div
                                        onClick={() => navigate(`/event/${slug}/manage/${p.uuid}`)}
                                        className="flex-shrink-0 h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-white font-bold shadow-sm cursor-pointer"
                                    >
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{p.name}</p>
                                        <p className="text-xs text-gray-600">{p.email}</p>
                                    </div>
                                </div>
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-sm ${p.status === 'Registered' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                        p.status === 'Participating' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                            'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}>
                                    {p.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredParticipants.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                        <Search className="mx-auto text-gray-300 mb-3" size={32} />
                        <p>No participants found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
