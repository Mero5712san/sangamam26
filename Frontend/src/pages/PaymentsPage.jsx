import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle2, XCircle, Search, ExternalLink } from 'lucide-react';
import { userAPI, resolveApiUrl } from '../services/api';
import { useToastStore } from '../store/toastStore';

const PAYMENT_URL = 'https://payments.bitsathy.ac.in/muthamil-sangamam-2026';

export function PaymentsPage() {
    const { showToast } = useToastStore();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [lockedUserIds, setLockedUserIds] = useState(() => new Set());
    const [confirmAction, setConfirmAction] = useState(null);

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
                            const badgeLabel = user.participantType === 'internal' ? 'internals' : (user.paymentStatus || 'pending');
                            const badgeClass = user.participantType === 'internal'
                                ? 'bg-amber-500/15 text-amber-300'
                                : user.paymentStatus === 'submitted'
                                    ? 'bg-amber-500/15 text-amber-300'
                                    : user.paymentStatus === 'approved'
                                        ? 'bg-emerald-500/15 text-emerald-300'
                                        : 'bg-red-500/15 text-red-300';
                            return (
                                <div key={user.id} className="rounded-3xl border border-sangamam-border bg-white/5 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-lg font-bold text-white">{user.name}</p>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                            <p className="mt-2 text-xs text-sangamam-gold">{user.college}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
                                            {badgeLabel === 'internals' ? 'Inthernals' : badgeLabel}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => imageUrl && setSelectedImage(imageUrl)}
                                        disabled={!imageUrl}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Eye size={16} />
                                        {imageUrl ? 'View proof image' : 'No proof uploaded'}
                                    </button>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setConfirmAction({ userId: user.id, decision: 'approved', name: user.name })}
                                            disabled={processingId === user.id || isLocked}
                                            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
                                        >
                                            <CheckCircle2 size={16} />
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction({ userId: user.id, decision: 'rejected', name: user.name })}
                                            disabled={processingId === user.id || isLocked}
                                            className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-60"
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
                    <div className="max-h-[90vh] max-w-5xl overflow-auto rounded-3xl border border-sangamam-border bg-[#1f0e09] p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage} alt="Payment proof" className="max-h-[84vh] w-full rounded-2xl object-contain" />
                    </div>
                </div>
            )}

            {confirmAction && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                    onClick={() => setConfirmAction(null)}
                >
                    <div
                        className="w-full max-w-md rounded-3xl border border-sangamam-border bg-[#2a130d] p-6 text-center shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${confirmAction.decision === 'approved' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                            {confirmAction.decision === 'approved' ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {confirmAction.decision === 'approved' ? 'Confirm Acceptance' : 'Confirm Rejection'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-300">
                            Are you sure you want to {confirmAction.decision === 'approved' ? 'accept' : 'reject'} payment proof for <span className="font-bold text-sangamam-gold">{confirmAction.name}</span>?
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const action = confirmAction;
                                    setConfirmAction(null);
                                    handleDecision(action.userId, action.decision);
                                }}
                                className={`rounded-2xl px-4 py-3 text-sm font-bold text-white transition-colors ${confirmAction.decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
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
