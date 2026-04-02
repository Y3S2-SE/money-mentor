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
import GamificationProfile from "../models/gamification.model.js";
import BadgeDefinition from "../models/badge.model.js";
import { logger } from "../utils/logger.js";
import { getLinkPreview } from "../utils/getLinkPreview.js";

// ─── Message type constants ───────────────────────────────────────────────────
const MSG = {
  // Inbound (client → server)
  SEND_MESSAGE: "send_message",
  TYPING_START: "typing_start",
  TYPING_STOP:  "typing_stop",
  SHARE_BADGE:  "share_badge",    // ← NEW

  // Outbound (server → client)
  NEW_MESSAGE:  "new_message",
  USER_JOINED:  "user_joined",
  USER_LEFT:    "user_left",
  ONLINE_USERS: "online_users",
  TYPING:       "typing",
  ERROR:        "error",
  CONNECTED:    "connected",
};

// ─── URL extractor ────────────────────────────────────────────────────────────
function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

export const initWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  logger.info("WebSocket server initialized at path /ws");

  wss.on("connection", async (ws, request) => {
    let user  = null;
    let group = null;

    // ── Authenticate ─────────────────────────────────────────────────────────
    try {
      ({ user, group } = await authenticateWsConnection(request));
    } catch (err) {
      ws.send(JSON.stringify({ type: MSG.ERROR, message: err.message }));
      ws.close(4001, err.message);
      return;
    }

    const userId  = user._id.toString();
    const groupId = group._id.toString();

    // ── Join room ─────────────────────────────────────────────────────────────
    joinRoom(groupId, userId, ws);
    logger.info(`User ${user.username} (${userId}) joined room ${group.name} (${groupId})`);

    ws.send(
      JSON.stringify({
        type: MSG.CONNECTED,
        message: `Connected to ${group.name}`,
        groupId,
        onlineUsers: getOnlineUsers(groupId),
      })
    );

    broadcastToRoom(
      groupId,
      {
        type: MSG.USER_JOINED,
        userId,
        userName: user.username,
        onlineUsers: getOnlineUsers(groupId),
      },
      userId
    );

    // ── Handle incoming messages ──────────────────────────────────────────────
    ws.on("message", async (raw) => {
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        return ws.send(JSON.stringify({ type: MSG.ERROR, message: "Invalid JSON" }));
      }

      switch (data.type) {

        // ── Chat message ────────────────────────────────────────────────────
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
            const url         = extractUrl(content);
            const linkPreview = url ? await getLinkPreview(url) : null;

            const savedMessage = await Message.create({
              groupId,
              sender: userId,
              content,
              type: "text",
              readBy: [userId],
              linkPreview,
            });

            const populated = await savedMessage.populate("sender", "username");

            const payload = {
              type: MSG.NEW_MESSAGE,
              message: {
                _id:         populated._id,
                content:     populated.content,
                sender:      populated.sender,
                groupId,
                type:        "text",
                createdAt:   populated.createdAt,
                linkPreview: populated.linkPreview ?? null,
              },
            };

            broadcastToRoom(groupId, payload);
            sendToUser(groupId, userId, payload);
          } catch (err) {
            logger.error("Error saving message:", err);
            ws.send(JSON.stringify({ type: MSG.ERROR, message: "Failed to save message" }));
          }
          break;
        }

        // ── Share badge ─────────────────────────────────────────────────────
        case MSG.SHARE_BADGE: {
          const { badgeId } = data;

          if (!badgeId) {
            return ws.send(
              JSON.stringify({ type: MSG.ERROR, message: "badgeId is required" })
            );
          }

          try {
            // 1. Verify the user actually owns this badge
            const profile = await GamificationProfile.findOne({ user: userId });
            if (!profile) {
              return ws.send(
                JSON.stringify({ type: MSG.ERROR, message: "Gamification profile not found" })
              );
            }

            const owns = profile.earnedBadges.some(
              (b) => b.badge.toString() === badgeId
            );
            if (!owns) {
              return ws.send(
                JSON.stringify({ type: MSG.ERROR, message: "You have not earned this badge" })
              );
            }

            // 2. Fetch badge definition for display data
            const badge = await BadgeDefinition.findById(badgeId);
            if (!badge) {
              return ws.send(
                JSON.stringify({ type: MSG.ERROR, message: "Badge not found" })
              );
            }

            // 3. Save as a "badge" type message
            const savedMessage = await Message.create({
              groupId,
              sender:  userId,
              content: `🏅 shared a badge: ${badge.name}`,
              type:    "badge",
              readBy:  [userId],
              badgeShare: {
                badgeId:     badge._id,
                key:         badge.key,
                name:        badge.name,
                description: badge.description,
                category:    badge.category,
                xpReward:    badge.xpReward,
              },
            });

            const populated = await savedMessage.populate("sender", "username");

            const payload = {
              type: MSG.NEW_MESSAGE,
              message: {
                _id:        populated._id,
                content:    populated.content,
                sender:     populated.sender,
                groupId,
                type:       "badge",
                badgeShare: populated.badgeShare,
                createdAt:  populated.createdAt,
              },
            };

            // Broadcast to everyone including sender
            broadcastToRoom(groupId, payload);
            sendToUser(groupId, userId, payload);

          } catch (err) {
            logger.error("Error sharing badge:", err);
            ws.send(JSON.stringify({ type: MSG.ERROR, message: "Failed to share badge" }));
          }
          break;
        }

        // ── Typing indicators ───────────────────────────────────────────────
        case MSG.TYPING_START:
        case MSG.TYPING_STOP: {
          broadcastToRoom(
            groupId,
            {
              type:     MSG.TYPING,
              userId,
              userName: user.username,
              isTyping: data.type === MSG.TYPING_START,
            },
            userId
          );
          break;
        }

        default:
          ws.send(
            JSON.stringify({ type: MSG.ERROR, message: `Unknown message type: ${data.type}` })
          );
      }
    });

    // ── Handle disconnect ─────────────────────────────────────────────────────
    ws.on("close", () => {
      leaveRoom(groupId, userId, ws);
      logger.info(`User ${user.username} (${userId}) left room ${group.name} (${groupId})`);

      broadcastToRoom(groupId, {
        type:        MSG.USER_LEFT,
        userId,
        userName:    user.username,
        onlineUsers: getOnlineUsers(groupId),
      });
    });

    ws.on("error", (err) => {
      logger.error(`WebSocket error for user ${userId} in group ${groupId}:`, err);
    });
  });

  return wss;
};