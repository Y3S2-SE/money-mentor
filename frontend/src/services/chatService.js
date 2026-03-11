import api from './api';

// Get a one-time WebSocket ticket from backend
export const getWsTicket = async () => {
  const response = await api.post('/chat-room/ticket');
  return response.data.ticket;
};

// Fetch paginated message history for a group
export const getMessageHistory = async (groupId, page = 1, limit = 50) => {
  const response = await api.get(`/chat-room/${groupId}/messages`, {
    params: { page, limit },
  });
  return response.data;
};

// Soft delete a message
export const deleteMessage = async (groupId, messageId) => {
  const response = await api.delete(`/chat-room/${groupId}/messages/${messageId}`);
  return response.data;
};