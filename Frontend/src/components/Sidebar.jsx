import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, ListChecks, BarChart3, UserCheck, Users, FileClock, LogOut, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const roleLinks = {
    participant: [
        { label: 'Events', href: '/events', icon: CalendarDays },
        { label: 'My Events', href: '/registrations', icon: ListChecks },
    ],
    incharge: [
        { label: 'Events', href: '/events', icon: CalendarDays },
        { label: 'My Events', href: '/registrations', icon: ListChecks },
        { label: 'Stats', href: '/analytics', icon: BarChart3 },
        { label: 'Approvals', href: '/approvals', icon: UserCheck },
        { label: 'Reports', href: '/reports', icon: FileText },
    ],
    admin: [
        { label: 'Events', href: '/events', icon: CalendarDays },
        { label: 'Stats', href: '/analytics', icon: BarChart3 },
        { label: 'Approvals', href: '/approvals', icon: UserCheck },
        { label: 'Volunteers', href: '/volunteers', icon: Users },
        { label: 'Reports', href: '/reports', icon: FileText },
        { label: 'Audit Logs', href: '/logs', icon: FileClock },
    ],
};

export function Sidebar({ onClose }) {
    const { role, logout } = useAuthStore();
    const links = roleLinks[role] || roleLinks.participant;

    return (
        <aside className="relative flex h-full w-72 flex-col border-r border-sangamam-border bg-[linear-gradient(180deg,rgba(54,24,17,0.98),rgba(22,9,6,0.98))] px-5 py-6">
            {onClose && (
                <button
                    className="absolute top-4 right-4 rounded-full border border-sangamam-border bg-white/5 px-3 py-1 text-xl text-sangamam-gold lg:hidden"
                    onClick={onClose}
                    aria-label="Close menu"
                >
                    ×
                </button>
            )}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-sangamam-gold">Sangamam</h1>
            </div>
            <nav className="flex-1">
                <ul className="space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        return (
                            <li key={link.href}>
                                <NavLink
                                    to={link.href}
                                    className={({ isActive }) => [
                                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                                        isActive
                                            ? 'border border-sangamam-border bg-[rgba(255,255,255,0.06)] text-sangamam-gold shadow-[0_10px_30px_rgba(0,0,0,0.18)]'
                                            : 'text-sangamam-text-muted hover:bg-white/5 hover:text-sangamam-gold',
                                    ].join(' ')}
                                    onClick={onClose}
                                >
                                    <Icon size={18} />
                                    <span>{link.label}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="mt-auto pt-2 border-t border-sangamam-border">
                <button
                    onClick={() => {
                        logout();
                        if (onClose) onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-sm font-bold text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
