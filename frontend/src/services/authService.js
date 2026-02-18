import api from './api.js';

const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }

        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    logout: async () => {
        try {
            await api.post('/auth/logout')
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    updateProfile: async (userData) => {
        const response = await api.put('/auth/profile', userData);
        if (response.data.success) {
            localStorage.setItem('user', JSON.stringify(response.data.data));
        }
        return response.data;
    },

    changePassword: async (passwordData) => {
        const response = await api.put('/auth/change-password', passwordData);
        if (response.data.success && response.data.data.token) {
            localStorage.setItem('token', response.data.data.user);
        }
        return response.data;
    }
};

export default authService;