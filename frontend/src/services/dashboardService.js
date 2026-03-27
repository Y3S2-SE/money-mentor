import api from './api.js';

const dashboardService = {

    // GET /api/dashboard/summary?month=YYYY-MM
    getSummary: async (month = null) => {
        const params = month ? `?month=${month}` : '';
        const response = await api.get(`/dashboard/summary${params}`);
        return response.data;
    },

    // GET /api/dashboard/category-breakdown?month=YYYY-MM&type=expense|income
    getCategoryBreakdown: async (month = null, type = 'expense') => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (type) params.append('type', type);
        const response = await api.get(`/dashboard/category-breakdown?${params.toString()}`);
        return response.data;
    },

    // GET /api/dashboard/trends
    getMonthlyTrends: async () => {
        const response = await api.get('/dashboard/trends');
        return response.data;
    },

    // GET /api/dashboard/insight?month=YYYY-MM
    getFinancialInsight: async (month = null) => {
        const params = month ? `?month=${month}` : '';
        const response = await api.get(`/dashboard/insight${params}`);
        return response.data;
    },

    // GET /api/dashboard/recent-transactions
    getRecentTransactions: async () => {
        const response = await api.get('/dashboard/recent-transactions');
        return response.data;
    },

    // GET /api/dashboard/convert?amount=&from=&to=
    convertCurrency: async (amount, from, to) => {
        const params = new URLSearchParams({ amount, from, to });
        const response = await api.get(`/dashboard/convert?${params.toString()}`);
        return response.data;
    },

    // POST /api/dashboard/savings-goal
    createSavingsGoal: async (data) => {
        const response = await api.post('/dashboard/savings-goal', data);
        return response.data;
    },

    // GET /api/dashboard/savings-goal?month=YYYY-MM
    getSavingsGoal: async (month = null) => {
        const params = month ? `?month=${month}` : '';
        const response = await api.get(`/dashboard/savings-goal${params}`);
        return response.data;
    },

    // PUT /api/dashboard/savings-goal
    updateSavingsGoal: async (data) => {
        const response = await api.put('/dashboard/savings-goal', data);
        return response.data;
    },

    // GET /api/dashboard/savings-goal-progress?month=YYYY-MM
    getSavingsGoalProgress: async (month = null) => {
        const params = month ? `?month=${month}` : '';
        const response = await api.get(`/dashboard/savings-goal-progress${params}`);
        return response.data;
    },
};

export default dashboardService;