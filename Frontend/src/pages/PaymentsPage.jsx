import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle2, XCircle, Search, ExternalLink } from 'lucide-react';
import { userAPI, resolveApiUrl } from '../services/api';
import { useToastStore } from '../store/toastStore';

const PAYMENT_URL = 'https://payments.bitsathy.ac.in/muthamil-sangamam-2026';

export function PaymentsPage() {
    const { showToast } = useToastStore();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [lockedUserIds, setLockedUserIds] = useState(() => new Set());

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await userAPI.getPaymentParticipants();
                setUsers(Array.isArray(data) ? data : []);
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to load payment participants', 'error');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleDecision = async (userId, decision) => {
        setProcessingId(userId);
        try {
            const { data } = await userAPI.reviewPayment(userId, decision);
            setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, paymentStatus: data.user.paymentStatus, status: data.user.status } : user)));
            setLockedUserIds((prev) => {
                const next = new Set(prev);
                next.add(userId);
                return next;
            });
            setSelectedUser((prev) => (prev?.id === userId ? { ...prev, paymentStatus: data.user.paymentStatus, status: data.user.status } : prev));
            showToast(decision === 'approved' ? 'Payment approved' : 'Payment rejected', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update payment decision', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = users.filter((user) => {
        const text = `${user.name || ''} ${user.email || ''} ${user.college || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sangamam-gold">Admin payments</p>
                    <h1 className="mt-2 text-4xl font-bold text-white">Payment review</h1>
                </div>
                <a
                    href={PAYMENT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-sangamam-border bg-white/5 px-4 py-3 text-sm font-bold text-sangamam-gold transition-colors hover:bg-white/10"
                >
                    <ExternalLink size={16} />
                    Open payment portal
                </a>
            </div>

            <div className="sangamam-card p-5 md:p-6">
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-sangamam-border bg-white/5 px-4 py-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or college"
                        className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                    />
                </div>

                {loading ? (
                    <div className="py-16 text-center text-gray-400">Loading payment submissions...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">No payment submissions found.</div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        {filtered.map((user) => {
                            const imageUrl = resolveApiUrl(user.paymentProofImage);
                            const isLocked = lockedUserIds.has(user.id) || ['approved', 'rejected'].includes(user.paymentStatus) || user.status === 'disqualified';
                            const badgeLabel = user.paymentStatus || 'pending';
                            const badgeClass = user.participantType === 'internal'
                                ? 'bg-amber-500/15 text-amber-300'
                                : user.paymentStatus === 'submitted'
                                    ? 'bg-amber-500/15 text-amber-300'
                                    : user.paymentStatus === 'approved'
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : 'bg-red-500/15 text-red-300';
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => setSelectedUser(user)}
                                    className="rounded-3xl border border-sangamam-border bg-white/5 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-sangamam-gold/30 hover:bg-white/8"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-lg font-bold text-white">{user.name}</p>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                            <p className="mt-2 text-xs text-sangamam-gold">{user.college}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
                                            {badgeLabel}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Eye size={16} />
                                            Open payment review
                                        </div>
                                        <span className="text-xs text-gray-500">{imageUrl ? 'Proof available' : 'No proof uploaded'}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedUser && (() => {
                const selectedImage = resolveApiUrl(selectedUser.paymentProofImage);
                const isLocked = lockedUserIds.has(selectedUser.id) || ['approved', 'rejected'].includes(selectedUser.paymentStatus) || selectedUser.status === 'disqualified';
                return (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                        onClick={() => setSelectedUser(null)}
                    >
                        <div
                            className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-sangamam-border bg-[#2a130d] shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                                <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sangamam-gold">Payment review</p>
                                            <h3 className="mt-2 text-3xl font-bold text-white">{selectedUser.name}</h3>
                                            <p className="mt-2 text-sm text-gray-300">{selectedUser.email}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedUser.paymentStatus === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : selectedUser.paymentStatus === 'rejected' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
                                            {selectedUser.paymentStatus || 'pending'}
                                        </span>
                                    </div>

                                    <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                                        <p><span className="text-sangamam-gold">College:</span> {selectedUser.college}</p>
                                        <p><span className="text-sangamam-gold">Phone:</span> {selectedUser.phone || 'Not provided'}</p>
                                        <p><span className="text-sangamam-gold">Type:</span> {selectedUser.participantType}</p>
                                        <p><span className="text-sangamam-gold">Status:</span> {selectedUser.status || 'active'}</p>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleDecision(selectedUser.id, 'approved')}
                                            disabled={processingId === selectedUser.id || isLocked}
                                            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <CheckCircle2 size={16} />
                                            Accept
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDecision(selectedUser.id, 'rejected')}
                                            disabled={processingId === selectedUser.id || isLocked}
                                            className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between gap-4 pb-4">
                                        <p className="text-sm font-bold text-sangamam-gold">Submitted payment proof</p>
                                        <button onClick={() => setSelectedUser(null)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/5">Close</button>
                                    </div>
                                    {selectedImage ? (
                                        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                                            <img src={selectedImage} alt="Payment proof" className="max-h-[74vh] w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 text-gray-400">
                                            No proof uploaded
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
