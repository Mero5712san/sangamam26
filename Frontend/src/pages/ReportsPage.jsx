import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { FileText, MapPin, Trophy, Send, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { canManageEvent } from '../utils/eventAccess';
import { eventAPI } from '../services/api';

const mockInchargeEvents = [
    { id: 1, name: 'Varna Kaaviyam', venue: 'Main Auditorium', reports: { geo: null, prizes: null } },
    { id: 2, name: 'Dance Fusion', venue: 'Open Stage', reports: { geo: { lat: '11.4939', lng: '77.2764' }, prizes: { internal: { first: 'Rahul (BIT)', second: 'Sneha (BIT)' }, external: { first: 'John (KCT)', second: 'Sarah (PSG)' } } } },
    { id: 3, name: 'Art Canvas', venue: 'Drawing Hall', reports: { geo: { lat: '11.4950', lng: '77.2780' }, prizes: null } },
];

export function ReportsPage() {
    const { user } = useAuthStore();
    const { showToast } = useToastStore();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEventId, setActiveEventId] = useState(null);

    const activeEvent = events.find(e => (e._id || e.id) === activeEventId);

    const [geoFile, setGeoFile] = useState(null);
    const [geoPreview, setGeoPreview] = useState('');
    const [prizeForm, setPrizeForm] = useState({
        internal: { first: '', second: '' },
        external: { first: '', second: '' }
    });

    React.useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await eventAPI.getAll();
                setEvents(data);
                if (data.length > 0) {
                    const firstEv = data[0];
                    setActiveEventId(firstEv._id || firstEv.id);
                    const geo = firstEv.reports?.geo;
                    setGeoPreview(typeof geo === 'string' ? geo : '');
                    setPrizeForm({
                        internal: {
                            first: firstEv.reports?.prizes?.internal?.first || '',
                            second: firstEv.reports?.prizes?.internal?.second || ''
                        },
                        external: {
                            first: firstEv.reports?.prizes?.external?.first || '',
                            second: firstEv.reports?.prizes?.external?.second || ''
                        }
                    });
                }
            } catch (error) {
                showToast('Failed to load events', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleEventSwitch = (id) => {
        const ev = events.find(e => (e._id || e.id) === id);
        setActiveEventId(id);
        const geo = ev.reports?.geo;
        setGeoPreview(typeof geo === 'string' ? geo : '');
        setPrizeForm({
            internal: {
                first: ev.reports.prizes?.internal?.first || '',
                second: ev.reports.prizes?.internal?.second || ''
            },
            external: {
                first: ev.reports.prizes?.external?.first || '',
                second: ev.reports.prizes?.external?.second || ''
            }
        });
    };

    const submitGeo = async () => {
        if (!geoFile) {
            showToast('Please select an image for geotag', 'error');
            return;
        }
        try {
            const ev = events.find(e => (e._id || e.id) === activeEventId);
            const form = new FormData();
            form.append('geoImage', geoFile);
            await eventAPI.updateReport(ev.slug, form);
            // fetch updated event to get real uploaded path
            const { data: updatedEvent } = await eventAPI.getBySlug(ev.slug);
            const newGeo = updatedEvent.reports?.geo || '';
            setGeoPreview(typeof newGeo === 'string' ? newGeo : '');
            setEvents(events.map(e => (e._id || e.id) === activeEventId ? { ...e, reports: { ...e.reports, geo: newGeo } } : e));
            showToast('Venue Geo-image submitted successfully', 'success');
        } catch (error) {
            showToast('Failed to update report', 'error');
        }
    };

    const submitPrizes = async () => {
        if (!prizeForm.internal.first || !prizeForm.external.first) {
            showToast('Please provide at least 1st prize winners for both categories', 'error');
            return;
        }
        try {
            const ev = events.find(e => (e._id || e.id) === activeEventId);
            await eventAPI.updateReport(ev.slug, { prizes: prizeForm });
            setEvents(events.map(e => (e._id || e.id) === activeEventId ? { ...e, reports: { ...e.reports, prizes: { ...prizeForm } } } : e));
            showToast('Official winners list updated', 'success');
        } catch (error) {
            showToast('Failed to update report', 'error');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Event Reports</h1>
                    <p className="text-gray-500 mt-1 font-medium italic">{user?.role === 'admin' ? 'Reviewing all submitted event finalizations' : 'Finalize venue details and announce the champions'}</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sangamam-gold">
                        <FileText size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Admin Summary Mode</span>
                    </div>
                )}
            </div>

            {user?.role === 'admin' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map(ev => (
                        <div key={ev.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg leading-tight">{ev.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{ev.venue}</p>
                                </div>
                                {ev.reports.geo && (
                                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Geo Location Submitted">
                                        <MapPin size={16} />
                                    </div>
                                )}
                            </div>
                            <div className="p-6 flex-1 space-y-4">
                                {ev.reports.prizes ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-bold text-sangamam-gold uppercase tracking-widest">Internal (1st/2nd)</p>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-700">🥇 {ev.reports.prizes.internal.first}</p>
                                                <p className="text-xs font-medium text-gray-500">🥈 {ev.reports.prizes.internal.second}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-bold text-sangamam-maroon uppercase tracking-widest">External (1st/2nd)</p>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-gray-700">🥇 {ev.reports.prizes.external.first}</p>
                                                <p className="text-xs font-medium text-gray-500">🥈 {ev.reports.prizes.external.second}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-gray-300">
                                        <Trophy size={24} className="opacity-50 mb-2" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Results Pending</p>
                                    </div>
                                )}

                                {ev.reports.geo && (
                                    <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                        {typeof ev.reports.geo === 'string' ? (
                                            <>
                                                <Navigation size={12} />
                                                <img src={ev.reports.geo.startsWith('/') ? `http://localhost:5000${ev.reports.geo}` : ev.reports.geo} alt="geo" className="h-6 rounded-md" />
                                            </>
                                        ) : (
                                            <>
                                                <Navigation size={12} />
                                                <span>{ev.reports.geo.lat}, {ev.reports.geo.lng}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* ... (rest of the incharge form code) ... */}
                    {/* Sidebar: Event List */}
                    <div className="xl:col-span-1 space-y-4">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] px-2">Assigned Events</h2>
                        <div className="space-y-2">
                            {events.map(ev => (
                                <button
                                    key={ev.id}
                                    onClick={() => handleEventSwitch(ev.id)}
                                    className={`w-full text-left p-5 rounded-[1.5rem] border transition-all ${activeEventId === ev.id ? 'bg-sangamam-maroon border-sangamam-maroon text-white shadow-xl translate-x-1' : 'bg-white border-gray-100 text-gray-900 hover:border-sangamam-maroon/20 hover:bg-gray-50'}`}
                                >
                                    <div className="font-bold leading-tight">{ev.name}</div>
                                    <div className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${activeEventId === ev.id ? 'text-sangamam-gold' : 'text-gray-400'}`}>{ev.venue}</div>

                                    <div className="mt-4 flex gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full ${ev.reports.geo ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>
                                        <div className={`h-1.5 w-1.5 rounded-full ${ev.reports.prizes ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content: Report Form */}
                    <div className="xl:col-span-3 space-y-6">
                        {activeEvent ? (
                            <div className="space-y-6">
                                {/* Geo Location Card */}
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-sangamam-maroon/10 text-sangamam-maroon flex items-center justify-center">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900">Venue Geo-location</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Submit precise coordinates for navigation</p>
                                            </div>
                                        </div>
                                        {activeEvent.reports.geo && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-lg border border-emerald-100">
                                                <CheckCircle2 size={12} /> Submitted
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-8">

                                        <div className="space-y-4 mb-6">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Geotag Image</label>
                                            {geoPreview ? (
                                                <div className="mb-3">
                                                    <img src={geoPreview.startsWith('/') ? `http://localhost:5000${geoPreview}` : geoPreview} alt="Geo preview" className="max-h-40 rounded-lg" />
                                                </div>
                                            ) : null}
                                            <input type="file" accept="image/*" onChange={(e) => { setGeoFile(e.target.files[0]); }} />
                                        </div>
                                        <button
                                            onClick={submitGeo}
                                            disabled={!canManageEvent(user, activeEvent)}
                                            className={`w-full md:w-auto px-8 py-4 ${canManageEvent(user, activeEvent) ? 'bg-sangamam-maroon text-white hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg`}
                                        >
                                            <Send size={18} /> Update Geo Image
                                        </button>
                                    </div>
                                </div>

                                {/* Prize Winners Card */}
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-sangamam-gold/10 text-sangamam-gold flex items-center justify-center">
                                                <Trophy size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900">Prize Winners List</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Declare the official results of the event</p>
                                            </div>
                                        </div>
                                        {activeEvent.reports.prizes && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-lg border border-emerald-100">
                                                <CheckCircle2 size={12} /> Results Declared
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-8 space-y-8">
                                        {/* Internal Prizes */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-sangamam-gold uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="h-1 w-4 bg-sangamam-gold rounded-full"></div> Internal Winners (Host College)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Trophy size={10} className="text-sangamam-gold" /> 1st Prize
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Internal Winner 1"
                                                        className="sangamam-input w-full bg-gray-50/50"
                                                        value={prizeForm.internal.first}
                                                        onChange={(e) => setPrizeForm({ ...prizeForm, internal: { ...prizeForm.internal, first: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Trophy size={10} className="text-gray-300" /> 2nd Prize
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Internal Winner 2"
                                                        className="sangamam-input w-full bg-gray-50/50"
                                                        value={prizeForm.internal.second}
                                                        onChange={(e) => setPrizeForm({ ...prizeForm, internal: { ...prizeForm.internal, second: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* External Prizes */}
                                        <div className="space-y-4 pt-6 border-t border-gray-50">
                                            <h4 className="text-xs font-bold text-sangamam-maroon uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="h-1 w-4 bg-sangamam-maroon rounded-full"></div> External Winners (Other Colleges)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Trophy size={10} className="text-sangamam-gold" /> 1st Prize
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="External Winner 1"
                                                        className="sangamam-input w-full bg-gray-50/50"
                                                        value={prizeForm.external.first}
                                                        onChange={(e) => setPrizeForm({ ...prizeForm, external: { ...prizeForm.external, first: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Trophy size={10} className="text-gray-300" /> 2nd Prize
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="External Winner 2"
                                                        className="sangamam-input w-full bg-gray-50/50"
                                                        value={prizeForm.external.second}
                                                        onChange={(e) => setPrizeForm({ ...prizeForm, external: { ...prizeForm.external, second: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={submitPrizes}
                                            disabled={!canManageEvent(user, activeEvent)}
                                            className={`w-full md:w-auto px-10 py-4 ${canManageEvent(user, activeEvent) ? 'bg-[#2a130d] text-white hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg`}
                                        >
                                            <Trophy size={18} className="text-sangamam-gold" /> Officialize Combined Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                                <AlertCircle size={48} className="text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">Select an event from the sidebar to begin reporting</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
