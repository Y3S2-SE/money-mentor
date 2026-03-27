import api from './api.js';

const transactionService = {

    // POST /api/transactions
    createTransaction: async (data) => {
        const response = await api.post('/transactions', data);
        return response.data;
    },

    // GET /api/transactions
    getTransactions: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.date) params.append('date', filters.date);
        if (filters.month) params.append('month', filters.month);
        if (filters.year) params.append('year', filters.year);
        if (filters.category) params.append('category', filters.category);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`/transactions?${params.toString()}`);
        return response.data;
    },

    // GET /api/transactions/:id
    getTransactionById: async (id) => {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    // PUT /api/transactions/:id
    updateTransaction: async (id, data) => {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data;
    },

    // DELETE /api/transactions/:id
    deleteTransaction: async (id) => {
        const response = await api.delete(`/transactions/${id}`);
        return response.data;
    },
};

export default transactionService;