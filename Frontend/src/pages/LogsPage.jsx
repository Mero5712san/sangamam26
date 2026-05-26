import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Search, ShieldCheck, AlertCircle, User, CalendarDays, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { logsAPI } from '../services/api';

const STATUS_STYLES = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300',
    info: 'border-sangamam-gold/20 bg-sangamam-gold/10 text-sangamam-gold',
};

const formatTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

export function LogsPage() {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadLogs = async () => {
            setIsLoading(true);
            setError('');
            try {
                const { data } = await logsAPI.getRecent();
                setLogs(Array.isArray(data) ? data : []);
            } catch (err) {
                setLogs([]);
                setError(err.response?.data?.message || 'Failed to load audit logs');
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === 'admin') {
            loadLogs();
        } else {
            setIsLoading(false);
        }
    }, [user?.role]);

    const filteredLogs = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return logs;
        return logs.filter((log) =>
            String(log.user || '').toLowerCase().includes(term) ||
            String(log.action || '').toLowerCase().includes(term) ||
            String(log.target || '').toLowerCase().includes(term)
        );
    }, [logs, searchTerm]);

    if (user?.role !== 'admin') {
        return (
            <div className="rounded-[2rem] border border-white/5 bg-white/5 p-8 text-center text-gray-400">
                Access Denied
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-sangamam-gold" size={36} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    {/* <p className="text-xs font-bold uppercase tracking-[0.24em] text-sangamam-gold/80">Admin Area</p> */}
                    <h1 className="mt-2 text-4xl font-black text-white tracking-tight">Audit Logs</h1>
                    {/* <p className="mt-2 max-w-2xl text-sm text-gray-400">Live activity timeline built from registrations, event updates, and user status changes.</p> */}
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70">
                    <ShieldCheck size={16} className="text-sangamam-gold" /> Admin Only
                </div>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-[#2a130d]/80 p-4 md:p-5 shadow-2xl shadow-black/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    <Search className="text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by user, action, or target..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                    />
                </div>
            </div>

            {error ? (
                <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-center text-red-200">
                    <AlertCircle className="mx-auto mb-3" size={32} />
                    <p className="font-semibold">{error}</p>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#2a130d]/80 shadow-2xl shadow-black/10 backdrop-blur-sm">
                {filteredLogs.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        No audit activity found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] border-collapse">
                            <thead className="bg-white/5">
                                <tr className="border-b border-white/10 text-left">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                                        User
                                    </th>

                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                                        Action
                                    </th>

                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                                        Target
                                    </th>

                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                                        Timestamp
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <tr
                                        key={log.id}
                                        className={`border-b border-white/5 transition-all duration-200 hover:bg-white/5 ${index === filteredLogs.length - 1
                                            ? 'border-b-0'
                                            : ''
                                            }`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-sangamam-gold">
                                                    <User size={18} />
                                                </div>

                                                <p className="font-semibold text-white">
                                                    {log.user}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 text-sm text-gray-300">
                                            {log.action}
                                        </td>

                                        <td className="px-6 py-5 text-sm font-medium text-gray-400">
                                            {log.target}
                                        </td>

                                        <td className="px-6 py-5">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[log.status] ||
                                                    STATUS_STYLES.info
                                                    }`}
                                            >
                                                {log.status || 'info'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 text-sm text-gray-400 whitespace-nowrap">
                                            {formatTimestamp(log.timestamp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-[1.8rem] border border-white/8 bg-white/5 px-5 py-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                    <Clock3 size={16} className="mt-0.5 text-sangamam-gold" />
                    <p>This feed is generated from live application records, so it updates as registrations, event edits, and user status changes happen.</p>
                </div>
            </div>
        </div>
    );
}