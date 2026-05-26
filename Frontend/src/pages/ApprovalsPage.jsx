import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, CheckCircle, XCircle, X } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { registrationAPI, userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function ApprovalsPage() {
    const { role } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusModalUserId, setStatusModalUserId] = useState(null);

    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAttendancePriority = (status) => {
        switch (String(status || '').toLowerCase()) {
            case 'participating':
                return 3;
            case 'absent':
                return 2;
            case 'registered':
                return 1;
            default:
                return 0;
        }
    };

    const groupParticipantsByUser = (rows) => {
        const grouped = new Map();

        for (const reg of rows) {
            if (!reg.id) continue;

            const existing = grouped.get(reg.id) || {
                id: reg.id,
                uuid: reg.uuid,
                name: reg.name,
                email: reg.email,
                phone: reg.phone,
                college: reg.college,
                year: reg.year,
                attendance: reg.attendance,
                accountStatus: reg.accountStatus,
                regIds: [],
                eventNames: []
            };

            existing.regIds.push(reg.regId);

            if (reg.eventName && !existing.eventNames.includes(reg.eventName)) {
                existing.eventNames.push(reg.eventName);
            }

            if (getAttendancePriority(reg.attendance) > getAttendancePriority(existing.attendance)) {
                existing.attendance = reg.attendance;
            }

            grouped.set(reg.id, existing);
        }

        return Array.from(grouped.values()).map((participant) => ({
            ...participant,
            eventLabel: participant.eventNames.length === 0
                ? 'No events'
                : participant.eventNames.length === 1
                    ? participant.eventNames[0]
                    : `${participant.eventNames.length} events`
        }));
    };

    useEffect(() => {
        const loadRegistrations = async () => {
            setIsLoading(true);
            try {
                const response = role === 'admin'
                    ? await registrationAPI.getAll()
                    : await registrationAPI.getAssigned();

                const { data } = response;

                // map registrations into participant rows (one per registration)
                const rows = (Array.isArray(data) ? data : []).map((reg) => ({
                    regId: reg.id,
                    id: reg.user?.id,
                    uuid: reg.user?.uuid,
                    name: reg.user?.name,
                    email: reg.user?.email,
                    phone: reg.user?.phone,
                    college: reg.user?.college,
                    year: reg.user?.year,
                    attendance: reg.status || 'registered',
                    accountStatus: reg.user?.status || 'active',
                    eventId: reg.event?.id,
                    eventName: reg.event?.name,
                }));
                setParticipants(groupParticipantsByUser(rows));
            } catch (error) {
                addNotification({ type: 'error', title: 'Load failed', message: error?.response?.data?.message || 'Failed to load participants' });
                setParticipants([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadRegistrations();
    }, [role]);

    const handleAccountStatusChange = async (userId, newStatus) => {
        try {
            await userAPI.updateStatus(userId, newStatus);
            setParticipants((prev) => prev.map(p => p.id === userId ? { ...p, accountStatus: newStatus } : p));
            addNotification({ type: 'status_change', title: 'Account Status Updated', message: `User set to ${newStatus}` });
        } catch (error) {
            addNotification({ type: 'error', title: 'Update failed', message: error?.response?.data?.message || 'Failed to update status' });
        } finally {
            setStatusModalUserId(null);
        }
    };

    const handleAttendanceChange = async (regId, newStatus) => {
        try {
            const regIds = Array.isArray(regId) ? regId : [regId];
            await Promise.all(regIds.map((id) => registrationAPI.markAttendance(id, newStatus)));
            setParticipants((prev) => prev.map((participant) => (
                participant.regIds?.some((id) => regIds.includes(id))
                    ? { ...participant, attendance: newStatus }
                    : participant
            )));
            addNotification({ type: 'attendance', title: 'Attendance Updated', message: `Marked ${newStatus}` });
        } catch (error) {
            addNotification({ type: 'error', title: 'Update failed', message: error?.response?.data?.message || 'Failed to update attendance' });
        }
    };

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const filteredParticipants = participants.filter((p) => {
        const participantName = String(p.name || '').toLowerCase();
        const participantEmail = String(p.email || '').toLowerCase();

        return (
            participantName.includes(normalizedSearchTerm) ||
            participantEmail.includes(normalizedSearchTerm)
        );
    });

    const getInitial = (value) => String(value || '?').trim().charAt(0).toUpperCase() || '?';

    // Long press logic
    const timerRef = useRef(null);

    const startPress = useCallback((id, e) => {
        // Prevent default on touch to stop text selection/context menu native behavior
        timerRef.current = setTimeout(() => {
            setStatusModalUserId(id);
        }, 600); // 600ms long press
    }, []);

    const cancelPress = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'active': return { bg: 'bg-white', border: 'border-emerald-500/30', text: 'text-emerald-400' };
            case 'freezed': return { bg: 'bg-white', border: 'border-yellow-500/30', text: 'text-yellow-400' };
            case 'disqualified': return { bg: 'bg-white', border: 'border-red-500/30', text: 'text-red-400' };
            default: return { bg: 'bg-white/5 hover:bg-white/10', border: 'border-sangamam-border', text: 'text-white' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sangamam-gold">{role === 'admin' ? 'Admin Tools' : 'In-Charge Tools'}</p>
                    <h1 className="mt-2 text-4xl font-bold text-white">Attendance & Approvals</h1>
                    <p className="mt-2 text-gray-400">Mark attendance. <span className="font-semibold text-sangamam-gold">Long press</span> or <span className="font-semibold text-sangamam-gold">right-click</span> a participant to change their status.</p>
                </div>
                <button
                    onClick={() => navigate('/scanner')}
                    className="flex items-center justify-center gap-2 rounded-xl bg-sangamam-gold px-6 py-3 font-bold text-white shadow hover:bg-sangamam-maroon transition-colors"
                >
                    <QrCode size={20} />
                    Scan QR
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
                    <table className="w-full text-left border-spacing-y-2 border-separate min-w-[600px]">
                        <thead>
                            <tr className="text-gray-500 uppercase text-xs tracking-wider">
                                <th className="pb-2 px-4 font-semibold">Participant</th>
                                <th className="pb-2 px-4 font-semibold text-right">Attendance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParticipants.map(p => {
                                const styles = getStatusStyles(p.accountStatus);
                                return (
                                    <tr
                                        key={p.id}
                                        className="transition-colors cursor-pointer select-none group"
                                        onMouseDown={(e) => startPress(p.id, e)}
                                        onMouseUp={cancelPress}
                                        onMouseLeave={cancelPress}
                                        onTouchStart={(e) => startPress(p.id, e)}
                                        onTouchEnd={cancelPress}
                                        onClick={(e) => {
                                            // Only navigate if it's not a long press or context menu
                                            if (!statusModalUserId) {
                                                navigate(`/approvals/user/${p.uuid}`);
                                            }
                                        }}
                                        onContextMenu={(e) => { e.preventDefault(); setStatusModalUserId(p.id); }}
                                    >
                                        <td className={`py-4 px-4 rounded-l-2xl border-y border-l transition-all ${styles.bg} ${styles.border}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sangamam-maroon-deep border border-sangamam-border flex items-center justify-center text-sangamam-gold font-bold shadow-lg">
                                                    {getInitial(p.name)}
                                                </div>
                                                <div>
                                                    <p className={`font-bold transition-colors ${styles.text}`}>{p.name}</p>
                                                    <p className="text-sm text-gray-500">{p.email}</p>
                                                    {/* <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-1">{p.eventLabel}</p> */}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`py-4 px-4 rounded-r-2xl border-y border-r text-right transition-all ${styles.bg} ${styles.border}`}>
                                            <div className="flex items-center justify-end">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAttendanceChange(p.regIds, 'participating'); }}
                                                        title="Mark Present"
                                                        className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold"
                                                    >
                                                        Present
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAttendanceChange(p.regIds, 'absent'); }}
                                                        title="Mark Absent"
                                                        className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold"
                                                    >
                                                        Absent
                                                    </button>
                                                    <span
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${p.attendance === 'participating'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                            : p.attendance === 'absent'
                                                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                                : 'bg-white/5 text-gray-400 border-sangamam-border'
                                                            }`}
                                                    >
                                                        {p.attendance === 'participating' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                        <span className="capitalize">{p.attendance}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredParticipants.map(p => {
                        const styles = getStatusStyles(p.accountStatus);
                        return (
                            <div
                                key={p.id}
                                className={`border rounded-2xl p-4 shadow-sm flex flex-col gap-4 select-none cursor-pointer transition-all ${styles.bg} ${styles.border}`}
                                onMouseDown={(e) => startPress(p.id, e)}
                                onMouseUp={cancelPress}
                                onMouseLeave={cancelPress}
                                onTouchStart={(e) => startPress(p.id, e)}
                                onTouchEnd={cancelPress}
                                onContextMenu={(e) => { e.preventDefault(); setStatusModalUserId(p.id); }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sangamam-maroon-deep border border-sangamam-border flex items-center justify-center text-sangamam-gold font-bold shadow-lg">
                                            {getInitial(p.name)}
                                        </div>
                                        <div>
                                            <p className={`font-bold transition-colors ${styles.text}`}>{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.email}</p>
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-1">{p.eventLabel}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${p.attendance === 'participating'
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                            : p.attendance === 'absent'
                                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                : 'bg-white/5 text-gray-400 border-sangamam-border'
                                            }`}
                                    >
                                        {p.attendance === 'participating' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        <span className="capitalize">{p.attendance}</span>
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredParticipants.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                        <Search className="mx-auto text-gray-300 mb-3" size={32} />
                        <p>No participants found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Status Change Modal */}
            {statusModalUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl sangamam-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-sangamam-border">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-sangamam-gold">Change Status</h3>
                            <button onClick={() => setStatusModalUserId(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleAccountStatusChange(statusModalUserId, 'active')}
                                className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all"
                            >
                                Active
                            </button>
                            <button
                                onClick={() => handleAccountStatusChange(statusModalUserId, 'freezed')}
                                className="w-full py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold hover:bg-yellow-500/20 transition-all"
                            >
                                Freeze
                            </button>
                            <button
                                onClick={() => handleAccountStatusChange(statusModalUserId, 'disqualified')}
                                className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-all"
                            >
                                Disqualify
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
