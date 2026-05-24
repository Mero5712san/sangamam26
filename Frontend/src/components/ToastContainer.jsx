import React from 'react';
import { useToastStore } from '../store/toastStore';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <XCircle className="text-red-500" size={20} />,
        warning: <AlertCircle className="text-yellow-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
    };

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
    };

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)]">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${bgColors[toast.type]}`}
                    >
                        <div className="flex-shrink-0">{icons[toast.type]}</div>
                        <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
                        <button 
                            onClick={() => removeToast(toast.id)}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
