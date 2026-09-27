import api from './api.js';

const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    googleLogin: async (code) => {
        const response = await api.post('/auth/google', { code }, {
            headers: { 'X-Requested-With': 'XmlHttpRequest' }
        });
        return response.data;
    },

    logout: async (session) => {
        await api.post('/auth/logout', null, { _authSession: session });
    },

    getProfile: async (session) => {
        const response = await api.get('/auth/profile', { _authSession: session });
        return response.data;
    },

    updateProfile: async (userData, session) => {
        const response = await api.put('/auth/profile', userData, { _authSession: session });
        return response.data;
    },

    changePassword: async (passwordData, session) => {
        const response = await api.put('/auth/change-password', passwordData, { _authSession: session });
        return response.data;
    }
};

export default authService;
