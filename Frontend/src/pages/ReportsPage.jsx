import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { FileText, MapPin, Trophy, Send, CheckCircle2, Navigation, AlertCircle, CheckCircle, ChevronRight, ClipboardList, Sparkles } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import { canManageEvent } from '../utils/eventAccess';
import { eventAPI } from '../services/api';

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

    useEffect(() => {
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

    const activeEventReports = useMemo(() => activeEvent?.reports || {}, [activeEvent]);

    const selectedBadge = useMemo(() => {
        if (!activeEvent) return 'No event selected';
        const items = [];
        if (activeEventReports.geo) items.push('Geo submitted');
        if (activeEventReports.prizes) items.push('Results declared');
        return items.length ? items.join(' • ') : 'Draft state';
    }, [activeEvent, activeEventReports]);

    const visibleEvents = events;

    const handleEventSwitch = (id) => {
        const ev = events.find(e => (e._id || e.id) === id);
        setActiveEventId(id);
        const geo = ev?.reports?.geo;
        setGeoPreview(typeof geo === 'string' ? geo : '');
        setPrizeForm({
            internal: {
                first: ev?.reports?.prizes?.internal?.first || '',
                second: ev?.reports?.prizes?.internal?.second || ''
            },
            external: {
                first: ev?.reports?.prizes?.external?.first || '',
                second: ev?.reports?.prizes?.external?.second || ''
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
        <div className="relative space-y-8 pb-12">
            <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,rgba(200,145,60,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(156,39,55,0.14),transparent_28%)]" />

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-sangamam-gold/80">Reports Workspace</p>
                    <h1 className="mt-2 text-4xl font-black text-white tracking-tight">Event Reports</h1>
                    {/* <p className="mt-2 max-w-2xl text-sm text-gray-400">Update venue geo-images and declare combined prize results from one focused workspace.</p> */}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-sangamam-gold">
                        <ClipboardList size={16} /> {visibleEvents.length} Events
                    </div>
                    {user?.role === 'admin' && (
                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80">
                            <FileText size={16} /> Admin View
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
                <aside className="rounded-[1.8rem] border border-white/8 bg-[#2a130d]/80 p-2 shadow-2xl shadow-black/10 backdrop-blur-sm">
                    
                    <div className="mt-2 space-y-1.5">
                        {visibleEvents.map((ev) => {
                            const id = ev._id || ev.id;
                            const isActive = activeEventId === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleEventSwitch(id)}
                                    className={`group w-full rounded-[1rem] border px-3 py-3 text-left transition-all ${isActive
                                        ? 'border-sangamam-gold/60 bg-sangamam-maroon/90 text-white shadow-lg shadow-black/20 translate-x-0.5'
                                        : 'border-white/8 bg-white/3 text-white/90 hover:border-white/16 hover:bg-white/6'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="truncate text-sm font-semibold leading-snug">{ev.name}</p>
                                        <ChevronRight size={14} className={`${isActive ? 'text-sangamam-gold' : 'text-gray-500'} transition-transform group-hover:translate-x-0.5`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="space-y-6">
                    {activeEvent ? (
                        <>
                            <div className="rounded-[2rem] border border-white/8 bg-[#2a130d]/80 p-5 shadow-2xl shadow-black/10 backdrop-blur-sm">
                                <h2 className="text-3xl font-black text-white leading-tight">{activeEvent.name}</h2>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                                <section className="rounded-[2rem] border border-white/8 bg-[#2a130d]/80 overflow-hidden shadow-2xl shadow-black/10 backdrop-blur-sm">
                                    <div className="border-b border-white/8 px-6 py-5">
                                        <h3 className="text-xl font-black text-white">Prize Winner List</h3>
                                    </div>

                                    <div className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-4 rounded-[1.1rem] border border-white/8 bg-white/3 px-4 py-3">
                                                <label className="text-sm font-bold text-sangamam-gold">Internal Winner 1</label>
                                                <input type="text" placeholder="Enter name" className="sangamam-input w-full bg-white/5" value={prizeForm.internal.first} onChange={(e) => setPrizeForm({ ...prizeForm, internal: { ...prizeForm.internal, first: e.target.value } })} />
                                            </div>
                                            <div className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-4 rounded-[1.1rem] border border-white/8 bg-white/3 px-4 py-3">
                                                <label className="text-sm font-bold text-sangamam-gold">Internal Winner 2</label>
                                                <input type="text" placeholder="Enter name" className="sangamam-input w-full bg-white/5" value={prizeForm.internal.second} onChange={(e) => setPrizeForm({ ...prizeForm, internal: { ...prizeForm.internal, second: e.target.value } })} />
                                            </div>
                                            <div className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-4 rounded-[1.1rem] border border-white/8 bg-white/3 px-4 py-3">
                                                <label className="text-sm font-bold text-sangamam-maroon">External Winner 1</label>
                                                <input type="text" placeholder="Enter name" className="sangamam-input w-full bg-white/5" value={prizeForm.external.first} onChange={(e) => setPrizeForm({ ...prizeForm, external: { ...prizeForm.external, first: e.target.value } })} />
                                            </div>
                                            <div className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-4 rounded-[1.1rem] border border-white/8 bg-white/3 px-4 py-3">
                                                <label className="text-sm font-bold text-sangamam-maroon">External Winner 2</label>
                                                <input type="text" placeholder="Enter name" className="sangamam-input w-full bg-white/5" value={prizeForm.external.second} onChange={(e) => setPrizeForm({ ...prizeForm, external: { ...prizeForm.external, second: e.target.value } })} />
                                            </div>
                                        </div>

                                        <button onClick={submitPrizes} disabled={!canManageEvent(user, activeEvent)} className={`w-full rounded-2xl px-6 py-4 font-black transition-all flex items-center justify-center gap-3 ${canManageEvent(user, activeEvent) ? 'bg-sangamam-gold text-white hover:opacity-90' : 'bg-white/8 text-gray-500 cursor-not-allowed'}`}>
                                            <Trophy size={18} /> Officialize Results
                                        </button>
                                    </div>
                                </section>

                                <section className="rounded-[2.2rem] border border-white/8 bg-[#2a130d]/80 overflow-hidden shadow-2xl shadow-black/10 backdrop-blur-sm">
                                    <div className="border-b border-white/8 px-6 py-5">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sangamam-maroon/10 text-sangamam-maroon">
                                                    <MapPin size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white">Geo Tag</h3>
                                                    {/* <p className="text-xs font-medium text-gray-400">Upload the geotag image used for navigation and verification.</p> */}
                                                </div>
                                            </div>
                                            {activeEvent.reports?.geo && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                                                    <CheckCircle2 size={12} /> Submitted
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="rounded-[1.4rem] border border-white/8 bg-white/3 p-4">
                                            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Geotag Image</label>
                                            {geoPreview ? (
                                                <div className="mb-4 overflow-hidden rounded-2xl border border-white/8 bg-black/10 p-2">
                                                    <img src={geoPreview.startsWith('/') ? `http://localhost:5000${geoPreview}` : geoPreview} alt="Geo preview" className="max-h-56 w-full rounded-xl object-contain" />
                                                </div>
                                            ) : (
                                                <div className="mb-4 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/3 text-center text-sm text-gray-500">
                                                    No geo-image uploaded yet
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={(e) => { setGeoFile(e.target.files[0]); }} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-sangamam-gold file:px-4 file:py-2 file:font-bold file:text-white" />
                                        </div>

                                        <button onClick={submitGeo} disabled={!canManageEvent(user, activeEvent)} className={`mt-5 w-full rounded-2xl px-6 py-4 font-black transition-all flex items-center justify-center gap-3 ${canManageEvent(user, activeEvent) ? 'bg-sangamam-maroon text-white hover:opacity-90' : 'bg-white/8 text-gray-500 cursor-not-allowed'}`}>
                                            <Send size={18} /> Update Geo Image
                                        </button>
                                    </div>
                                </section>
                            </div>

                            <div className="rounded-[1.8rem] border border-white/8 bg-white/5 px-5 py-4 text-sm text-gray-300">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sangamam-gold/10 text-sangamam-gold">
                                        <AlertCircle size={16} />
                                    </div>
                                    <p>
                                        Use the sidebar to switch events quickly. Geo-location and winners can be saved independently, so you can submit one section without waiting for the other.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-[30rem] items-center justify-center rounded-[2.2rem] border border-dashed border-white/12 bg-white/4 p-10 text-center text-gray-400">
                            <div className="max-w-md space-y-3">
                                <AlertCircle size={48} className="mx-auto text-gray-500" />
                                <h3 className="text-xl font-bold text-white">Select an event from the sidebar</h3>
                                <p>Choose any event to submit geo-location and prize reports.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
