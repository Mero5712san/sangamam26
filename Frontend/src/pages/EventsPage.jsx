import React, { useState, useEffect } from 'react';
import { EventDetailModal } from '../components/EventDetailModal';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Plus, Clock } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { eventAPI, registrationAPI } from '../services/api';


export function EventsPage({ embedded = false }) {
    const { user } = useAuthStore();
    const { showToast } = useToastStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [myEvents, setMyEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const formatTimeRange = (event) => {
        if (!event?.time && !event?.endTime) return 'Time to be announced';
        if (event?.time && event?.endTime) return `${event.time}-${event.endTime}`;
        return event?.time || event?.endTime;
    };

    const getParticipationMode = (event) => event?.registrationType || event?.participationType || 'solo';

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await eventAPI.getAll();
                setAllEvents(data);
                if (user) {
                    const { data: myData } = await registrationAPI.getMy();
                    const normalized = (Array.isArray(myData) ? myData : [])
                        .filter((reg) => reg?.event)
                        .map((reg) => ({
                            id: reg.event.id,
                            status: reg.status,
                            team: reg.teamDetails || null,
                            date: reg.event.date,
                            time: reg.event.time
                        }));
                    setMyEvents(normalized);
                }
            } catch (error) {
                showToast('Failed to load events', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [user]);

    // Open modal if /event/:slug is in the route
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        if (pathParts[1] === 'event' && pathParts[2] && pathParts.length === 3) {
            const slug = pathParts[2];
            const event = allEvents.find(e => e.slug === slug);
            if (event) {
                setSelectedEvent(event);
            } else {
                // If event not found in loaded list, fetch by slug from API
                (async () => {
                    try {
                        const { data } = await eventAPI.getBySlug(slug);
                        setSelectedEvent(data || null);
                    } catch (err) {
                        setSelectedEvent(null);
                    }
                })();
            }
        } else {
            setSelectedEvent(null);
        }
    }, [location.pathname, allEvents]);

    const handleCardClick = (event) => {
        navigate(`/event/${event.slug}`);
    };

    // Add status: 'registered' | 'participating' | 'completed' to myEvents
    const handleRegister = async (event, registrationData = {}) => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (['admin', 'incharge', 'volunteer'].includes(user.role)) {
            showToast('Staff accounts cannot register for events', 'error');
            return;
        }
        if (myEvents.some((reg) => reg.id === event.id)) {
            showToast('Already registered!', 'info');
            return;
        }

        const participationMode = getParticipationMode(event);
        const isTeamRegistration = registrationData?.isTeam || participationMode === 'team';

        try {
            const payload = isTeamRegistration
                ? {
                    eventId: event.id,
                    type: 'team',
                    teamDetails: {
                        name: registrationData.teamName || `${user.name || 'Team Lead'} Team`,
                        leader: user.email,
                        members: Array.isArray(registrationData.selectedMembers)
                            ? registrationData.selectedMembers.map((member) => ({
                                email: member.value,
                                name: member.label,
                                status: 'pending'
                            }))
                            : []
                    }
                }
                : {
                    eventId: event.id,
                    type: 'individual'
                };

            const { data } = await registrationAPI.register(payload);
            setMyEvents((prev) => ([
                ...prev,
                {
                    id: data?.event?.id || event.id,
                    status: data?.status || 'registered',
                    team: data?.teamDetails || null,
                    date: event.date,
                    time: event.time
                }
            ]));
            showToast(`Successfully registered for ${event.name}!`, 'success');
            navigate(-1);
        } catch (error) {
            showToast(error.response?.data?.message || 'Registration failed', 'error');
        }
    };

    const content = (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="mt-2 text-4xl font-bold text-white">நிகழ்வுகள் அரங்கு</h2>
                    {/* <p className="text-gray-500 text-sm mt-1">Discover and join the best events</p> */}
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => navigate('/event/new/edit')}
                        className="sangamam-button px-6 py-3 flex items-center gap-2 font-bold shadow-lg"
                    >
                        <Plus size={18} /> Create New Event
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {allEvents
                    .filter(event => user?.role === 'admin' || !event.isFrozen)
                    .map((event) => (
                        <div
                            key={event.id}
                            onClick={() => handleCardClick(event)}
                            className="sangamam-card cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className="flex h-auto items-center justify-center bg-sangamam-light-bg transition-colors hover:bg-sangamam-gold">
                                {event.image ? (
                                    <img
                                        src={event.image}
                                        alt={event.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-6xl transition-transform">{event.icon || '📅'}</span>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-white">{event.name}</h3>
                                    {event.isFrozen && (
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/30">
                                            Frozen
                                        </span>
                                    )}
                                </div>
                                <p className="mb-4 text-sm text-gray-600">{event.tagline}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={14} className="text-sangamam-gold" />
                                    <span>{formatTimeRange(event)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>


            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => navigate(-1)}
                    onRegister={handleRegister}
                    myEvents={myEvents}
                />
            )}
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-0 z-40 border-b border-sangamam-border bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Sangamam</h1>
                        <p className="text-sm text-gray-600">Explore Events</p>
                    </div>
                    {user && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="rounded-xl border border-sangamam-maroon px-4 py-2 font-semibold text-white transition hover:bg-sangamam-maroon hover:text-white"
                        >
                            Dashboard
                        </button>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-8 py-12">{content}</div>
        </div>
    );
}
