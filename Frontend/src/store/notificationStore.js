import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotificationStore = create(
    persist(
        (set) => ({
            notifications: [],

            addNotification: (notification) => set((state) => ({
                notifications: [{
                    id: Date.now(),
                    time: 'Just now',
                    read: false,
                    ...notification
                }, ...state.notifications]
            })),

            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            })),

            clearAll: () => set({ notifications: [] })
        }),
        {
            name: 'notification-storage'
        }
    )
);
