import React from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertOctagon, HelpCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export function BlockedAccountPage() {
    const { user, logout, blockedAccess } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isFreezed = (user?.status || blockedAccess?.status) === 'freezed';
    const blockedMessage = blockedAccess?.message || (isFreezed
        ? 'Your account has been temporarily freezed by an administrator. Please contact your coordinator for further clarification.'
        : 'Your account has been permanently disqualified from Sangamam. Access to all events and features has been revoked.');

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#120705]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full text-center space-y-8"
            >
                {/* Illustration Area */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-sm">
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                                rotate: [0, -5, 5, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            <div className="bg-red-500/10 rounded-full p-8 inline-block">
                                {isFreezed ? (
                                    <Lock size={80} className="text-yellow-500" />
                                ) : (
                                    <AlertOctagon size={80} className="text-red-500" />
                                )}
                            </div>

                            {/* Little monster/alien placeholder from image */}
                            <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-xl">
                                <span className="text-3xl">😞</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">
                        {isFreezed ? 'Access Suspended!' : 'Account Disqualified!'}
                    </h1>
                    <div className="h-1 w-20 bg-sangamam-gold mx-auto rounded-full"></div>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto">
                        {blockedMessage}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/support')}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
                    >
                        <HelpCircle size={20} />
                        Contact Support
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>

                <p className="text-xs text-gray-600 italic">
                    Refer to the Sangamam Code of Conduct for more information regarding account status changes.
                </p>
            </motion.div>
        </div>
    );
}
