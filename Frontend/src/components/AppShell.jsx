import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { VirtualIDCard } from './VirtualIDCard';
import { useAuthStore } from '../store/authStore';

export function AppShell({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [idCardOpen, setIdCardOpen] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const showPaymentWarning = user?.role === 'participant' && user?.participantType === 'external' && user?.paymentStatus === 'pending';
    return (
        <div className="min-h-screen bg-transparent text-sangamam-text">
            <Topbar onBurgerClick={() => setSidebarOpen(true)} onProfileClick={() => setIdCardOpen(true)} />
            {showPaymentWarning && (
                <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-500/20 via-red-500/15 to-amber-500/20 px-4 py-3 lg:ml-72">
                    <div className="mx-auto grid max-w-7xl gap-4 rounded-2xl border border-amber-500/25 bg-[#2a130d]/70 px-4 py-3 backdrop-blur-md md:grid-cols-[1fr_auto] md:items-center">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold text-amber-300">Registration successful</p>
                            <p className="text-xs text-amber-100/80">Your registration is complete, but payment is still pending. Open the payment page to continue verification.</p>
                        </div>
                        <button
                            onClick={() => navigate('/payment-confirmation')}
                            className="w-full justify-self-start rounded-xl bg-sangamam-gold px-4 py-2 text-sm font-bold text-[#2a130d] shadow-lg transition-transform hover:scale-[1.02] md:w-auto md:justify-self-end"
                        >
                            Pay now
                        </button>
                    </div>
                </div>
            )}
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex bg-[#120705]/80 backdrop-blur-sm">
                    <div className="h-full w-72 bg-[linear-gradient(180deg,rgba(52,24,18,0.98),rgba(28,11,7,0.98))] shadow-2xl">
                        <Sidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                    <div className="flex-1" onClick={() => setSidebarOpen(false)} />
                </div>
            )}
            <div className="flex min-h-[calc(100vh-64px)]">
                <aside className="hidden lg:block fixed top-0 left-0 h-full z-40"><Sidebar /></aside>
                <div className="flex-1 flex flex-col ml-0 lg:ml-72">
                    <main className="flex-1 px-6 py-6 lg:px-8 overflow-y-auto h-[calc(100vh-64px)]">{children}</main>
                </div>
            </div>
            {idCardOpen && (
                <VirtualIDCard participant={user} onClose={() => setIdCardOpen(false)} />
            )}
        </div>
    );
}