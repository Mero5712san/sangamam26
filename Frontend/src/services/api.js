import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000';

const API = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

export const resolveApiUrl = (value) => {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return value.startsWith('/') ? `${API_BASE_URL}${value}` : `${API_BASE_URL}/${value}`;
};

// Add token to requests
API.interceptors.request.use((config) => {
    let token = null;
    try {
        const auth = JSON.parse(localStorage.getItem('auth-storage'));
        token = auth?.state?.token || auth?.state?.user?.token || null;
    } catch (e) {
        token = null;
    }
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
    updateDocument: (slug, type, formData) => API.patch(`/events/${slug}/documents/${type}`, formData),
    deleteDocument: (slug, type) => API.delete(`/events/${slug}/documents/${type}`),
};

export const documentsAPI = {
    getShared: () => API.get('/documents'),
    uploadShared: (type, formData) => API.patch(`/documents/${type}`, formData),
    deleteShared: (type) => API.delete(`/documents/${type}`),
};

export const registrationAPI = {
    register: (data) => API.post('/registrations', data),
    getMy: () => API.get('/registrations/my'),
    getAll: () => API.get('/registrations/all'),
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
    getCollegeDetails: (slug) => API.get(`/users/college/${slug}`),
};

export const logsAPI = {
    getRecent: () => API.get('/logs/recent'),
};

export default API;
