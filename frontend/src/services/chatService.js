import api from './api';

export const startConversation = async (message) => {
    const response = await api.post('/chat', { message });
    return response.data;
};

export const sendMessage = async (chatId, message) => {
    const response = await api.post(`/chat/${chatId}/message`, { message });
    return response.data;
};

export const getAllConversations = async () => {
    const response = await api.get('/chat');
    return response.data;
};

export const getConversation = async (chatId) => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
};

export const deleteConversation = async (chatId) => {
    const response = await api.delete(`/chat/${chatId}`);
    return response.data;
};
