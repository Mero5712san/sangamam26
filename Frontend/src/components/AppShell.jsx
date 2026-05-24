import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { VirtualIDCard } from './VirtualIDCard';
import { useAuthStore } from '../store/authStore';

export function AppShell({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [idCardOpen, setIdCardOpen] = useState(false);
    const { user } = useAuthStore();
    return (
        <div className="min-h-screen bg-transparent text-sangamam-text">
            <Topbar onBurgerClick={() => setSidebarOpen(true)} onProfileClick={() => setIdCardOpen(true)} />
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