import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            role: null,
            token: null,

            setUser: (user) =>
                set({ user, role: user?.role, token: user?.token }),

            login: async (credentials) => {
                const { data } = await authAPI.login(credentials);
                set({ user: data, role: data.role, token: data.token });
                return data;
            },

            refreshUser: async () => {
                const auth = JSON.parse(localStorage.getItem('auth-storage'));
                const token = auth?.state?.user?.token;

                if (!token) return null;

                try {
                    const { data } = await authAPI.me();
                    set((state) => ({
                        user: { ...state.user, ...data, token },
                        role: data.role,
                        token
                    }));
                    return data;
                } catch (error) {
                    // Clear invalid token on auth failure
                    set({ user: null, role: null, token: null });
                    throw error;
                }
            },

            register: async (userData) => {
                const { data } = await authAPI.register(userData);
                set({ user: data, role: data.role, token: data.token });
                return data;
            },

            verifyOtp: async (otpData) => {
                const { data } = await authAPI.verifyOtp(otpData);
                if (data.isVerified) {
                    set((state) => {
                        // Only update the global user state if they are already logged in
                        if (state.user) {
                            return { user: { ...state.user, isVerified: true } };
                        }
                        return {};
                    });
                }
                return data;
            },

            sendOtp: async (emailData) => {
                const { data } = await authAPI.sendOtp(emailData);
                return data;
            },

            logout: () =>
                set({ user: null, role: null, token: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
