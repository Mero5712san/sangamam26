import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
    notifications: [
        { id: 1, type: 'team_invite', sender: 'Arun Kumar', team: 'Cyber Sentinels', event: 'Capture The Flag', time: '5m ago' },
        { id: 2, type: 'team_invite', sender: 'Priya Dharshini', team: 'Innovators', event: 'Hackathon 2024', time: '12m ago' }
    ],
    
    addNotification: (notification) => set((state) => ({
        notifications: [{ 
            id: Date.now(), 
            time: 'Just now',
            ...notification 
        }, ...state.notifications]
    })),
    
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
    
    clearAll: () => set({ notifications: [] })
}));
