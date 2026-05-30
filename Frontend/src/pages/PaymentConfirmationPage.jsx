import React, { useState } from 'react';
import { ExternalLink, Upload, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const PAYMENT_URL = 'https://payments.bitsathy.ac.in/muthamil-sangamam-2026';

export function PaymentConfirmationPage() {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const { showToast } = useToastStore();
    const [proof, setProof] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!proof) {
            showToast('Please upload your payment proof image', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('proof', proof);

        setIsSubmitting(true);
        try {
            const { data } = await userAPI.submitPaymentProof(formData);
            const updatedUser = {
                ...user,
                paymentStatus: data.paymentStatus,
                paymentProofImage: data.paymentProofImage
            };
            setUser(updatedUser);
            showToast('Payment proof submitted successfully', 'success');
            navigate('/events');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to submit payment proof', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="rounded-[28px] border border-sangamam-border bg-[linear-gradient(180deg,rgba(52,24,18,0.98),rgba(22,9,6,0.98))] p-6 shadow-2xl md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sangamam-gold">Payment confirmation</p>
                        <h1 className="mt-2 text-3xl font-bold text-white">Pay now and submit proof</h1>
                        <p className="mt-2 max-w-2xl text-sm text-gray-300">Open the official payment portal, complete the transaction, then upload the screenshot here for admin verification.</p>
                    </div>
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
                        Official portal linked below
                    </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <a
                        href={PAYMENT_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="group rounded-[2rem] border border-sangamam-border bg-white/5 p-5 transition-all hover:-translate-y-0.5 hover:border-sangamam-gold/40 hover:bg-white/10"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-sangamam-gold">Official payment card</p>
                                <p className="mt-2 text-sm text-gray-300">Click this card to open the payment portal in a new tab.</p>
                            </div>
                            <ExternalLink className="text-sangamam-gold transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" size={20} />
                        </div>
                        <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#1f0e09] p-4">
                            <div className="rounded-[1.25rem] border border-amber-300/20 bg-gradient-to-br from-amber-300/10 via-white/5 to-transparent p-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-amber-200/80">Payment link</p>
                                <p className="mt-3 break-all text-sm font-medium text-white">{PAYMENT_URL}</p>
                            </div>
                            <p className="mt-3 text-xs text-gray-400">This opens the official Sangamam payment gateway.</p>
                        </div>
                    </a>

                    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-sangamam-border bg-white/5 p-5">
                        <div className="flex items-center gap-3 text-sangamam-gold">
                            <Upload size={20} />
                            <h2 className="text-lg font-bold text-white">Upload proof image</h2>
                        </div>
                        <div className="mt-5 rounded-[1.75rem] border-2 border-dashed border-white/10 bg-black/20 p-5">
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                                <div className="rounded-full bg-sangamam-gold/15 p-4 text-sangamam-gold">
                                    <ImageIcon size={28} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Choose payment screenshot</p>
                                    <p className="text-xs text-gray-400">PNG, JPG, JPEG</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setProof(e.target.files?.[0] || null)}
                                />
                            </label>
                            {proof && (
                                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                                    Selected: {proof.name}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sangamam-gold px-5 py-3 font-bold text-[#2a130d] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <CheckCircle2 size={18} />
                            {isSubmitting ? 'Submitting...' : 'Submit proof'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
