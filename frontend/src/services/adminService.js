import api from './api.js';

const adminService = {
    // GET /api/users
    getAllUsers: async ({ page = 1, limit = 10, search = '', role = '', isActive } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        if (role) params.append('role', role);
        if (isActive !== undefined) params.append('isActive', isActive);
        const response = await api.get(`/users?${params.toString()}`);
        return response.data;
    },

    // GET /api/users/:id
    getUserById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    // DELETE /api/users/:id
    deleteUser: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};

export default adminService;