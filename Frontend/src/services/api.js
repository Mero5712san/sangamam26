import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add token to requests
API.interceptors.request.use((config) => {
    const auth = JSON.parse(localStorage.getItem('auth-storage'));
    const token = auth?.state?.user?.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    login: (credentials) => API.post('/auth/login', credentials),
    register: (userData) => API.post('/auth/register', userData),
    me: () => API.get('/auth/me'),
    verifyOtp: (data) => API.post('/auth/verify-otp', data),
    sendOtp: (emailData) => API.post('/auth/send-otp', emailData),
};

export const eventAPI = {
    getAll: () => API.get('/events'),
    getAssigned: () => API.get('/events/assigned'),
    getBySlug: (slug) => API.get(`/events/${slug}`),
    create: (data) => API.post('/events', data),
    update: (slug, data) => API.put(`/events/${slug}`, data),
    updateReport: (slug, reportData) => API.patch(`/events/${slug}/report`, reportData),
};

export const registrationAPI = {
    register: (data) => API.post('/registrations', data),
    getMy: () => API.get('/registrations/my'),
    getAssigned: () => API.get('/registrations/assigned'),
    getEligibleMembers: (eventId) => API.get(`/registrations/eligible-members/${eventId}`),
    markAttendance: (id, status) => API.patch(`/registrations/${id}/attendance`, { status }),
    getEventRegistrations: (eventId) => API.get(`/registrations/event/${eventId}`),
    getUserRegistrations: (uuid) => API.get(`/registrations/user/${uuid}`),
};

export const volunteerAPI = {
    getAll: () => API.get('/volunteers'),
    add: (data) => API.post('/volunteers', data),
    assign: (id, eventIds) => API.patch(`/volunteers/${id}/assign`, { eventIds }),
};

export const userAPI = {
    updateStatus: (id, status) => API.patch(`/users/${id}/status`, { status }),
    getById: (id) => API.get(`/users/${id}`),
};

export default API;
