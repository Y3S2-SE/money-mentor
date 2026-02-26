/**
 * Manages WebSocket rooms (groups) and their connected clients.
 * Structure: Map<groupId, Map<userId, Set<WebSocket>>>
 * A user can have multiple tabs/connections open simultaneously.
 */

const rooms = new Map();

// ─── Add a client to a room ───────────────────────────────────────────────────
export const joinRoom = (groupId, userId, ws) => {
  if (!rooms.has(groupId)) {
    rooms.set(groupId, new Map());
  }

  const room = rooms.get(groupId);

  if (!room.has(userId)) {
    room.set(userId, new Set());
  }

  room.get(userId).add(ws);
};

// ─── Remove a specific ws connection ─────────────────────────────────────────
export const leaveRoom = (groupId, userId, ws) => {
  if (!rooms.has(groupId)) return;

  const room = rooms.get(groupId);
  if (!room.has(userId)) return;

  const userConnections = room.get(userId);
  userConnections.delete(ws);

  // Clean up empty sets and maps
  if (userConnections.size === 0) room.delete(userId);
  if (room.size === 0) rooms.delete(groupId);
};

// ─── Broadcast to everyone in a room ─────────────────────────────────────────
export const broadcastToRoom = (groupId, payload, excludeUserId = null) => {
  if (!rooms.has(groupId)) return;

  const room = rooms.get(groupId);
  const message = JSON.stringify(payload);

  for (const [userId, connections] of room) {
    if (excludeUserId && userId === excludeUserId) continue;

    for (const ws of connections) {
      if (ws.readyState === 1) { // 1 = OPEN
        ws.send(message);
      }
    }
  }
};

// ─── Send to a specific user in a room ───────────────────────────────────────
export const sendToUser = (groupId, userId, payload) => {
  if (!rooms.has(groupId)) return;

  const room = rooms.get(groupId);
  if (!room.has(userId)) return;

  const message = JSON.stringify(payload);

  for (const ws of room.get(userId)) {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  }
};

// ─── Get online user IDs in a room ───────────────────────────────────────────
export const getOnlineUsers = (groupId) => {
  if (!rooms.has(groupId)) return [];
  return Array.from(rooms.get(groupId).keys());
};

// ─── Get total connection count across all rooms ──────────────────────────────
export const getRoomStats = () => {
  const stats = {};
  for (const [groupId, room] of rooms) {
    stats[groupId] = {
      uniqueUsers: room.size,
      totalConnections: Array.from(room.values()).reduce((acc, s) => acc + s.size, 0),
    };
  }
  return stats;
};