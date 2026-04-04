import api from "./api";

const gamificationSerivce = {
    getProfile: async (sync = false) => {
        const params = sync ? '?sync=true' : '';
        const response = await api.get(`/play/profile${params}`);
        return response.data;
    },

    getBadges: async (limit = null) => {
        const params = limit ? `?limit=${limit}` : '';
        const response = await api.get(`/play/badges${params}`);
        return response.data;
    },

    getLeaderboard: async (limit = 5) => {
        const response = await api.get(`/play/leaderboard?limit=${limit}`);
        return response.data;
    },

    getXPHistory: async (limit = 10) => {
        const response = await api.get(`/play/xp-history?limit=${limit}`);
        return response.data;
    },
};

export default gamificationSerivce;