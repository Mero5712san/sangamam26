import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Calendar, Clock, AlertTriangle, Check, X as CloseIcon, Users, Loader2 } from 'lucide-react';
import { eventAPI, registrationAPI } from '../services/api';
import { useToastStore } from '../store/toastStore';
import { canManageEvent } from '../utils/eventAccess';

const getStatus = (attendance, isEventEnded) => {
    if (attendance === 'present' && !isEventEnded) return 'participating';
    if (attendance === 'present' && isEventEnded) return 'completed';
    if (attendance !== 'present' && isEventEnded) return 'absent';
    return 'registered';
};
export function RegistrationsPage() {
    const navigate = useNavigate();
    const { role, user } = useAuthStore();
    const { showToast } = useToastStore();
    const [registrations, setRegistrations] = useState([]);
    const [assignedEvents, setAssignedEvents] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState(null);

    const handleOpenEvent = async (slug) => {
        try {
            // fetch fresh event by slug so backend slug route is exercised and we have latest data
            await eventAPI.getBySlug(slug);
        } catch (err) {
            // ignore fetch errors; navigating may still work if EventsPage has data
        }
        navigate(`/event/${slug}`);
    };

    useEffect(() => {
        fetchPageData();
    }, [role, user]);

    const fetchPageData = async () => {
        try {
            if (role === 'incharge') {
                const { data } = await eventAPI.getAssigned();
                const events = (Array.isArray(data) ? data : []).map((event) => ({
                    id: event.id,
                    name: event.name,
                    slug: event.slug,
                    image: event.image || null,
                    icon: event.icon || '🎭',
                    date: event.date,
                    time: event.time,
                    tagline: event.tagline || 'Assigned event',
                    coordinators: event.coordinators || [],
                    isFrozen: event.isFrozen,
                    status: 'assigned'
                }));
                setAssignedEvents(events);
            } else {
                const { data } = await registrationAPI.getMy();
                setRegistrations(data);
            }
        } catch (error) {
            showToast('Failed to load events', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteAction = (type, invite) => {
        setConfirmAction({ type, invite });
    };

    const processAction = async () => {
        try {
            // Implementation for accept/reject
            // await registrationAPI.handleInvitation(confirmAction.invite.id, confirmAction.type);
            setInvitations(invitations.filter(i => i.id !== confirmAction.invite.id));
            showToast(`Invitation ${confirmAction.type}ed successfully`, 'success');
        } catch (error) {
            showToast('Failed to process invitation', 'error');
        }
        setConfirmAction(null);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="animate-spin text-sangamam-gold" size={40} />
                <p className="text-gray-500 font-medium">Fetching your registrations...</p>
            </div>
        );
    }

    const myEvents = role === 'incharge'
        ? assignedEvents
        : registrations
            .filter((reg) => reg && reg.event)
            .filter((reg) => !user?.id || reg.userId === user.id)
            .map((reg) => ({
                id: reg.event.id,
                name: reg.event.name,
                slug: reg.event.slug,
                image: reg.event.image || null,
                icon: reg.event.icon || '🎭',
                date: reg.event.date,
                time: reg.event.time,
                tagline: reg.event.tagline || 'Participating in Muthamizh Sangamam',
                status: getStatus(reg.status, false),
                attendance: reg.status,
                team: reg.teamDetails || null
            }));

    return (
        <div className="space-y-8">
            {/* Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="mt-2 text-4xl font-extrabold text-white tracking-tight">
                    {role === 'incharge' ? 'Assigned Events' : 'My Events'}
                </h1>
            </div>

            {/* Invitations Banner */}
            {invitations.length > 0 && invitations.map(invite => (
                <div key={invite.id} className="bg-[#fff9eb] border border-[#ffeeba] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#ffc107]/20 p-2 rounded-full">
                            <AlertTriangle className="text-[#856404]" size={20} />
                        </div>
                        <p className="text-[#856404] text-sm font-medium leading-relaxed">
                            <span className="font-bold">{invite.inviter}</span> has invited you to join team <span className="font-bold">"{invite.teamName}"</span> for <span className="font-bold">{invite.eventName}</span>.
                            Accept now to participate!
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => handleInviteAction('reject', invite)}
                            className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => handleInviteAction('accept', invite)}
                            className="px-6 py-2 text-xs font-bold bg-[#ffc107] text-[#856404] rounded-xl hover:bg-[#e0a800] transition-colors shadow-sm"
                        >
                            Accept Invite
                        </button>
                    </div>
                </div>
            ))}

            {/* Events Grid */}
            {myEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myEvents.map((event) => {
                        const isStaff = role === 'admin' || role === 'incharge';
                        const canManage = canManageEvent(user, event);

                        const statusStyles = {
                            'registered': 'bg-gray-100 text-gray-600 border-gray-200',
                            'participating': 'bg-sangamam-gold/10 text-sangamam-gold border-sangamam-gold/30',
                            'completed': 'bg-white/10 text-white border-white/30',
                            'absent': 'bg-red-500/10 text-red-400 border-red-500/20',
                            'assigned': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        };

                        return (
                            <div
                                key={event.id}
                                className="group relative overflow-hidden rounded-[2rem] bg-[#2a130d] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col"
                                onClick={() => handleOpenEvent(event.slug)}
                            >
                                {/* Decorative background blob */}
                                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sangamam-gold/5 blur-3xl pointer-events-none transition-transform group-hover:scale-110"></div>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/5 text-4xl shadow-sm border border-white/10 group-hover:scale-110 transition-transform">
                                        {event.image ? (
                                            <img src={event.image} alt={event.name} className="h-full w-full object-cover" />
                                        ) : (
                                            event.icon
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${statusStyles[event.status] || statusStyles['registered']}`}>
                                        {event.status}
                                    </span>
                                </div>

                                <div className="flex-grow relative z-10">
                                    <h3 className="text-xl font-extrabold text-white mb-1">
                                        {event.name}
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                                        {event.tagline}
                                    </p>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center text-sm text-gray-300 font-medium">
                                            <Calendar size={16} className="text-sangamam-gold mr-2 shrink-0" />
                                            <span>{event.date}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-300 font-medium">
                                            <Clock size={16} className="text-sangamam-gold mr-2 shrink-0" />
                                            <span>{event.time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 mt-auto relative z-10 flex flex-wrap gap-2">

                                    {event.team && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.slug}/team`); }}
                                            className="flex-1 rounded-xl bg-sangamam-gold px-4 py-2 text-sm font-bold text-black shadow-sm transition-all hover:bg-sangamam-gold/90"
                                        >
                                            Team
                                        </button>
                                    )}
                                    {isStaff && canManage && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.slug}/manage`); }}
                                            className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-400"
                                        >
                                            Manage
                                        </button>
                                    )}
                                    {isStaff && canManage && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.slug}/edit`); }}
                                            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-white/10"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
                    <Calendar size={64} className="mx-auto text-gray-700 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-white mb-2">No Registrations Yet</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8">
                        You haven't registered for any events. Browse the events list to get started!
                    </p>
                    <button
                        onClick={() => navigate('/events')}
                        className="px-8 py-3 bg-sangamam-gold text-black font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl"
                    >
                        Explore Events
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#2a130d] border border-sangamam-border w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmAction.type === 'accept' ? 'bg-green-500/10' : 'bg-red-500/10'
                            }`}>
                            {confirmAction.type === 'accept' ? (
                                <Check className="text-green-500" size={32} />
                            ) : (
                                <AlertTriangle className="text-red-500" size={32} />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {confirmAction.type === 'accept' ? 'Accept Invitation?' : 'Decline Invitation?'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to {confirmAction.type} the invite for
                            <span className="text-sangamam-gold font-bold"> "{confirmAction.invite.eventName}"</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processAction}
                                className={`flex-1 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${confirmAction.type === 'accept' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}