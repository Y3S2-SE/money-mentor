import { WebSocketServer } from "ws";
import { authenticateWsConnection } from "./wsAuth.js";
import {
  joinRoom,
  leaveRoom,
  broadcastToRoom,
  sendToUser,
  getOnlineUsers,
} from "./roomManager.js";
import Message from "../models/message.model.js";
import { logger } from "../utils/logger.js";

// ─── Message type constants ───────────────────────────────────────────────────
const MSG = {
  // Inbound (client → server)
  SEND_MESSAGE: "send_message",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",

  // Outbound (server → client)
  NEW_MESSAGE: "new_message",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  ONLINE_USERS: "online_users",
  TYPING: "typing",
  ERROR: "error",
  CONNECTED: "connected",
};

export const initWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  logger.info("WebSocket server initialized at path /ws");

  wss.on("connection", async (ws, request) => {
    let user = null;
    let group = null;

    // ── Authenticate ────────────────────────────────────────────────────────
    try {
      ({ user, group } = await authenticateWsConnection(request));
    } catch (err) {
      ws.send(JSON.stringify({ type: MSG.ERROR, message: err.message }));
      ws.close(4001, err.message);
      return;
    }

    const userId = user._id.toString();
    const groupId = group._id.toString();

    // ── Join room ────────────────────────────────────────────────────────────
    joinRoom(groupId, userId, ws);
    logger.info(`User ${user.name} (${userId}) joined room ${group.name} (${groupId})`);

    // Confirm connection to the joining user
    ws.send(
      JSON.stringify({
        type: MSG.CONNECTED,
        message: `Connected to ${group.name}`,
        groupId,
        onlineUsers: getOnlineUsers(groupId),
      })
    );

    // Notify others in the room
    broadcastToRoom(
      groupId,
      {
        type: MSG.USER_JOINED,
        userId,
        userName: user.name,
        onlineUsers: getOnlineUsers(groupId),
      },
      userId // exclude the joining user themselves
    );

    // ── Handle incoming messages ─────────────────────────────────────────────
    ws.on("message", async (raw) => {
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        return ws.send(JSON.stringify({ type: MSG.ERROR, message: "Invalid JSON" }));
      }

      switch (data.type) {
        // ── Chat message ───────────────────────────────────────────────────
        case MSG.SEND_MESSAGE: {
          const content = data.content?.trim();
          if (!content) {
            return ws.send(
              JSON.stringify({ type: MSG.ERROR, message: "Message content is required" })
            );
          }
          if (content.length > 2000) {
            return ws.send(
              JSON.stringify({ type: MSG.ERROR, message: "Message too long (max 2000 chars)" })
            );
          }

          try {
            // Persist to DB
            const savedMessage = await Message.create({
              groupId,
              sender: userId,
              content,
              type: "text",
              readBy: [userId],
            });

            const populated = await savedMessage.populate("sender", "name avatar");

            const payload = {
              type: MSG.NEW_MESSAGE,
              message: {
                _id: populated._id,
                content: populated.content,
                sender: populated.sender,
                groupId,
                createdAt: populated.createdAt,
              },
            };

            // Send to everyone in the room (including sender for confirmation)
            broadcastToRoom(groupId, payload);
            sendToUser(groupId, userId, payload); // ensure sender gets it too
          } catch (err) {
            logger.error("Error saving message:", err);
            ws.send(JSON.stringify({ type: MSG.ERROR, message: "Failed to save message" }));
          }
          break;
        }

        // ── Typing indicators ──────────────────────────────────────────────
        case MSG.TYPING_START:
        case MSG.TYPING_STOP: {
          broadcastToRoom(
            groupId,
            {
              type: MSG.TYPING,
              userId,
              userName: user.name,
              isTyping: data.type === MSG.TYPING_START,
            },
            userId
          );
          break;
        }

        default:
          ws.send(JSON.stringify({ type: MSG.ERROR, message: `Unknown message type: ${data.type}` }));
      }
    });

    // ── Handle disconnect ────────────────────────────────────────────────────
    ws.on("close", () => {
      leaveRoom(groupId, userId, ws);
      logger.info(`User ${user.name} (${userId}) left room ${group.name} (${groupId})`);

      broadcastToRoom(groupId, {
        type: MSG.USER_LEFT,
        userId,
        userName: user.name,
        onlineUsers: getOnlineUsers(groupId),
      });
    });

    ws.on("error", (err) => {
      logger.error(`WebSocket error for user ${userId} in group ${groupId}:`, err);
    });
  });

  return wss;
};