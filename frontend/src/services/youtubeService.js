import api from './api';

export const getVideoSuggestions = async (chatId) => {
    const response = await api.get(`/youtube/search?chatId=${chatId}`);
    return response.data;
};
