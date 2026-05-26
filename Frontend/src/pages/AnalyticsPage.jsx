import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { eventAPI, registrationAPI } from '../services/api';
import {
    Users,
    Activity,
    CheckCircle,
    TrendingUp,
    Building2,
    ChevronRight,
    Loader2,
    CalendarDays,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';

const COLORS = ['#800000', '#B8860B', '#8B5CF6', '#10B981'];

const normalizeAssignedEventIds = (assignedEventIds) => {
    if (Array.isArray(assignedEventIds)) {
        return assignedEventIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);
    }

    if (typeof assignedEventIds === 'number') {
        return [Number(assignedEventIds)];
    }

    if (typeof assignedEventIds === 'string') {
        try {
            const parsed = JSON.parse(assignedEventIds);
            return Array.isArray(parsed)
                ? parsed.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
                : [];
        } catch (error) {
            return [];
        }
    }

    return [];
};

const formatDayLabel = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};

const buildCountSeries = (rows) => {
    const byDay = new Map();

    for (const row of rows) {
        const key = formatDayLabel(row.createdAt || row.updatedAt || Date.now());
        byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    return Array.from(byDay.entries()).map(([name, count]) => ({ name, count }));
};

const buildDistribution = (rows, field, fallback = 'Unknown') => {
    const counts = new Map();

    for (const row of rows) {
        const rawValue = row?.user?.[field];
        const key = String(rawValue || fallback).trim() || fallback;
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
};

const buildCollegeRows = (rows) => {
    const colleges = new Map();

    for (const row of rows) {
        const college = String(row?.user?.college || 'Unknown').trim() || 'Unknown';
        const existing = colleges.get(college) || {
            id: college.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown',
            name: college,
            total: 0,
            boys: 0,
            girls: 0,
            other: 0
        };
        existing.total += 1;

        const gender = String(row?.user?.gender || 'Other').toLowerCase();
        if (gender === 'male') existing.boys += 1;
        else if (gender === 'female') existing.girls += 1;
        else existing.other += 1;

        colleges.set(college, existing);
    }

    return Array.from(colleges.values()).sort((a, b) => b.total - a.total);
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-gray-100 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                <p className="mb-1 text-sm font-bold text-gray-500">{label}</p>
                <p className="text-xl font-bold text-sangamam-maroon">
                    {payload[0].value} <span className="text-sm font-semibold text-gray-400">{payload[0].name === 'count' ? 'Registrations' : ''}</span>
                </p>
            </div>
        );
    }

    return null;
};

export function AnalyticsPage() {
    const { role, user } = useAuthStore();
    const { showToast } = useToastStore();
    const navigate = useNavigate();

    const [assignedEvents, setAssignedEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEvent, setIsLoadingEvent] = useState(false);

    const loadEventAnalytics = async (event) => {
        if (!event?.id) {
            setRegistrations([]);
            return;
        }

        setIsLoadingEvent(true);
        try {
            const { data } = await registrationAPI.getEventRegistrations(event.id);
            setRegistrations(Array.isArray(data) ? data : []);
        } catch (error) {
            setRegistrations([]);
            showToast(error.response?.data?.message || 'Failed to load analytics data', 'error');
        } finally {
            setIsLoadingEvent(false);
        }
    };

    useEffect(() => {
        const loadAssignedEvents = async () => {
            if (role !== 'admin' && role !== 'incharge') {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const { data } = await eventAPI.getAssigned();
                const events = Array.isArray(data) ? data : [];
                setAssignedEvents(events);

                const preferredIds = normalizeAssignedEventIds(user?.assignedEventIds);
                const initialEvent =
                    events.find((event) => preferredIds.includes(Number(event.id))) ||
                    events[0] ||
                    null;

                setSelectedEvent(initialEvent);
                await loadEventAnalytics(initialEvent);
            } catch (error) {
                setAssignedEvents([]);
                setSelectedEvent(null);
                setRegistrations([]);
                showToast(error.response?.data?.message || 'Failed to load assigned events', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadAssignedEvents();
    }, [role, user?.assignedEventIds]);

    const handleSelectEvent = async (event) => {
        setSelectedEvent(event);
        await loadEventAnalytics(event);
    };

    const stats = useMemo(() => {
        const totalRegistrations = registrations.length;
        const activeParticipants = registrations.filter((registration) => {
            const status = String(registration?.status || 'registered').toLowerCase();
            return status !== 'absent';
        }).length;
        const attendanceRate = totalRegistrations > 0
            ? `${Math.round((activeParticipants / totalRegistrations) * 100)}%`
            : '0%';

        const dailyRegistrations = buildCountSeries(registrations);
        const genderData = buildDistribution(registrations, 'gender', 'Other');
        const yearData = buildDistribution(registrations, 'year', 'Unknown');
        const collegeData = buildCollegeRows(registrations);

        return {
            totalRegistrations,
            activeParticipants,
            attendanceRate,
            dailyRegistrations,
            genderData,
            yearData,
            collegeData,
        };
    }, [registrations]);

    if (role !== 'incharge' && role !== 'admin') {
        return (
            <div className="flex h-full items-center justify-center p-8 text-center text-gray-500">
                You do not have access to view analytics.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-sangamam-gold" size={40} />
            </div>
        );
    }

    if (!selectedEvent) {
        return (
            <div className="space-y-6 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Stats Overview</h1>
                <div className="rounded-[2rem] border border-white/5 bg-white/5 p-10 text-gray-400">
                    No assigned event was found for this account.
                </div>
            </div>
        );
    }

    return (<div className="w-full flex-1 space-y-6 pb-8 px-4 md:px-6 overflow-x-hidden">
        {/* <div className="mx-auto w-full max-w-[1050px] space-y-6 pb-8 px-4 md:px-6 overflow-x-hidden"> */}
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                    Stats Overview
                </h1>
                <p className="mt-2 text-gray-500 font-medium text-lg">
                    Real-time analytics for <span className="font-bold text-white">{selectedEvent.name}</span>.
                </p>
            </div>
            {isLoadingEvent && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="animate-spin" size={16} />
                    Refreshing event data...
                </div>
            )}
        </div>

        {assignedEvents.length > 1 && role === 'admin' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Admin Event Selector</p>
                        {/* <h2 className="mt-1 text-sm font-semibold text-white">Choose the event to view statistics</h2> */}
                    </div>
                    <div className="w-full md:w-[360px]">
                        <select
                            value={selectedEvent?.id || ''}
                            onChange={(e) => {
                                const nextEvent = assignedEvents.find((event) => String(event.id) === e.target.value);
                                if (nextEvent) handleSelectEvent(nextEvent);
                            }}
                            className="w-full rounded-xl border border-white/10 bg-[#2a130d] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-sangamam-gold"
                        >
                            {assignedEvents.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        )}

        {assignedEvents.length > 1 && role !== 'admin' && (
            <div className="-mx-4 md:mx-0 overflow-x-auto pb-2 px-4 md:px-0">
                <div className="flex w-max min-w-full gap-2 md:gap-3">
                    {assignedEvents.map((event) => {
                        const active = selectedEvent?.id === event.id;
                        return (
                            <button
                                key={event.id}
                                onClick={() => handleSelectEvent(event)}
                                className={`flex-shrink-0 rounded-full border px-3 py-2 text-left transition-all min-w-[140px] md:min-w-[170px] ${active
                                    ? 'border-sangamam-gold bg-sangamam-gold/10 text-sangamam-gold'
                                    : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                                    }`}
                            >
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Event</p>
                                <p className="mt-1 text-sm font-semibold leading-tight truncate">{event.name}</p>
                                <p className="text-[10px] opacity-70 truncate">{event.slug}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative min-w-0 overflow-hidden rounded-[2rem] bg-white p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100/50 text-blue-600">
                        <Users size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Registrations</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl md:text-4xl font-extrabold text-gray-900">{stats.totalRegistrations}</p>
                            <span className="flex items-center text-sm font-bold text-emerald-500">
                                <TrendingUp size={16} className="mr-1" /> Live
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative min-w-0 overflow-hidden rounded-[2rem] bg-white p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/50 text-emerald-600">
                        <Activity size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Participants</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl md:text-4xl font-extrabold text-gray-900">{stats.activeParticipants}</p>
                            <span className="flex items-center text-sm font-bold text-emerald-500">
                                <TrendingUp size={16} className="mr-1" /> Updated
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative min-w-0 overflow-hidden rounded-[2rem] bg-white p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100/50 text-purple-600">
                        <CheckCircle size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl md:text-4xl font-extrabold text-gray-900">{stats.attendanceRate}</p>
                            <span className="text-sm font-medium text-purple-500">Of Registrations</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="min-w-0 rounded-[2rem] bg-white p-4 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 lg:col-span-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Registration Growth</h2>
                        <p className="text-sm text-gray-500">Accumulated event registrations by signup date.</p>
                    </div>
                </div>
                <div className="min-h-[180px] md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.dailyRegistrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FFF" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#FFF" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#FFF"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRegistrations)"
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#B8860B' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="min-w-0 rounded-[2rem] bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 lg:col-span-4">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Demographics</h2>
                <p className="text-sm text-gray-500 mb-6">Participation ratio by gender.</p>

                <div className="min-h-[140px] md:h-56 relative flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.genderData.length > 0 ? stats.genderData : [{ name: 'Unknown', value: 0 }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {(stats.genderData.length > 0 ? stats.genderData : [{ name: 'Unknown', value: 0 }]).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-extrabold text-gray-900">{stats.totalRegistrations}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
                    </div>
                </div>

                <div className="flex justify-center gap-8 mt-6 flex-wrap">
                    {(stats.genderData.length > 0 ? stats.genderData : [{ name: 'Unknown', value: 0 }]).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">{entry.name}</p>
                                <p className="text-xs text-gray-500 font-medium">{entry.value} users</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="min-w-0 rounded-[2rem] bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 lg:col-span-12">
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Year-wise Distribution</h2>
                        <p className="text-sm text-gray-500">Breakdown of registrations by year.</p>
                    </div>
                </div>

                <div className="min-h-[160px] md:h-72 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.yearData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#B8860B" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {role === 'admin' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-gray-900">College-wise Statistics</h2>
                                <p className="text-sm text-gray-500">Breakdown of participation by institution.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {stats.collegeData.map((college, index) => (
                                <div key={`${college.name}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="bg-sangamam-maroon/10 p-2 rounded-lg text-sangamam-maroon flex-shrink-0">
                                                <Building2 size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-800 truncate">{college.name}</p>
                                                <p className="text-xs text-gray-500">College statistics</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/college/${college.id}`)}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-sangamam-maroon uppercase tracking-wider shrink-0"
                                        >
                                            View <ChevronRight size={14} />
                                        </button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</p>
                                            <p className="mt-1 text-lg font-extrabold text-gray-900">{college.total}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Boys</p>
                                            <p className="mt-1 text-lg font-extrabold text-sangamam-maroon">{college.boys}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Girls</p>
                                            <p className="mt-1 text-lg font-extrabold text-sangamam-gold">{college.girls}</p>
                                        </div>
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Other</p>
                                            <p className="mt-1 text-lg font-extrabold text-purple-600">{college.other}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full min-w-[920px]">
                                <thead>
                                    <tr className="text-left border-b border-gray-100">
                                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">College Name</th>
                                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Total Users</th>
                                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Boys</th>
                                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Girls</th>
                                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Other</th>
                                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.collegeData.map((college, index) => (
                                        <tr key={`${college.name}-${index}`} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-sangamam-maroon/10 p-2 rounded-lg text-sangamam-maroon">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <span className="font-bold text-gray-800">{college.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                                                    {college.total}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-sm font-bold text-sangamam-maroon">{college.boys}</span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-sm font-bold text-sangamam-gold">{college.girls}</span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-sm font-bold text-purple-600">{college.other}</span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/college/${college.id}`)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-sangamam-maroon hover:underline uppercase tracking-wider"
                                                >
                                                    View Details <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}
