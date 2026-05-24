import { UserCircle2, Menu, Bell, Check, X, Users, UserCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useState } from 'react';
export function Topbar({ onBurgerClick, onProfileClick }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const { notifications, removeNotification, clearAll } = useNotificationStore();

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'UserCheck': return <UserCheck size={16} />;
            case 'AlertTriangle': return <AlertTriangle size={16} />;
            case 'ShieldCheck': return <ShieldCheck size={16} />;
            default: return <Users size={16} />;
        }
    };
    return (
        <header className="sticky top-0 z-30 border-b border-sangamam-border bg-[rgba(31,14,9,0.88)] backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">
                {/* Burger menu for mobile */}
                <button
                    className="lg:hidden mr-2 flex items-center justify-center rounded-full border border-sangamam-border bg-white/5 p-2 text-sangamam-gold"
                    onClick={onBurgerClick}
                    aria-label="Open menu"
                >
                    <Menu size={28} />
                </button>
                <div className="flex-1 flex justify-end items-center gap-4">
                    {/* Notifications Button */}
                    <div className="relative">
                        <button
                            className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-all ${showNotifications ? 'bg-sangamam-gold text-black border-sangamam-gold' : 'bg-white/5 text-sangamam-gold border-sangamam-border hover:bg-white/10'}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                            aria-label="View notifications"
                        >
                            <Bell size={20} />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-[#1f0e09]">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40 h-screen w-screen cursor-default" 
                                    onClick={() => setShowNotifications(false)} 
                                />
                                <div className="fixed inset-x-4 top-[76px] md:absolute md:right-0 md:left-auto md:top-full md:mt-3 md:w-80 rounded-xl border border-sangamam-border bg-[#1f0e09]/95 backdrop-blur-xl shadow-2xl z-50">
                                <div className="p-4 border-b border-sangamam-border flex items-center justify-between">
                                    <h3 className="font-bold text-sangamam-gold">Notifications</h3>
                                    <span className="text-xs text-gray-400">{notifications.length} New</span>
                                </div>
                                <div className="max-h-[320px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <div className="divide-y divide-sangamam-border">
                                            {notifications.map((notif) => (
                                                <div key={notif.id} className="p-4 hover:bg-white/5 transition-colors">
                                                    <div className="flex gap-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            notif.type === 'attendance' ? 'bg-emerald-500/20 text-emerald-400' : 
                                                            notif.type === 'status_change' ? 'bg-blue-500/20 text-blue-400' : 
                                                            'bg-sangamam-gold/20 text-sangamam-gold'
                                                        }`}>
                                                            {getIcon(notif.icon)}
                                                        </div>
                                                        <div className="flex-1">
                                                            {notif.type === 'team_invite' ? (
                                                                <>
                                                                    <p className="text-sm text-gray-200">
                                                                        <span className="font-bold text-sangamam-gold">{notif.sender}</span> invited you to join <span className="font-bold text-white">{notif.team}</span> for <span className="italic">{notif.event}</span>
                                                                    </p>
                                                                    <div className="mt-3 flex gap-2">
                                                                        <button
                                                                            onClick={() => removeNotification(notif.id)}
                                                                            className="flex-1 py-1.5 px-3 rounded-lg bg-sangamam-gold text-black text-xs font-bold hover:bg-white transition-colors flex items-center justify-center gap-1"
                                                                        >
                                                                            <Check size={14} /> Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => removeNotification(notif.id)}
                                                                            className="py-1.5 px-3 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm font-bold text-white">{notif.title}</p>
                                                                    <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                                                                    <p className="text-[10px] text-gray-600 mt-2">{notif.time}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Bell size={32} className="mx-auto text-gray-600 mb-2 opacity-20" />
                                            <p className="text-sm text-gray-500">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="p-3 border-t border-sangamam-border text-center">
                                        <button onClick={clearAll} className="text-xs text-sangamam-gold hover:underline">Clear all notifications</button>
                                    </div>
                                )}
                            </div>
                            </>
                        )}
                    </div>

                    <button
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-white to-white text-[#2a130d] shadow-[0_12px_28px_rgba(216,162,69,0.22)] focus:outline-none hover:scale-105 transition-transform"
                        onClick={onProfileClick}
                        aria-label="Show Virtual ID Card"
                    >
                        <UserCircle2 size={22} />
                    </button>
                </div>
            </div>
        </header>
    );
}