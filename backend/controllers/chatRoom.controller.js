import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import { createTicket } from "../websocket/wsTicketStore.js";

// POST /api/chat-room/ticket
export const getWsTicket = async (req, res) => {
  try {
    const ticket = createTicket(req.user._id.toString());
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/chat-room/:groupId/messages?page=1&limit=50
export const getMessageHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
    const isAdmin = group.admin.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not a member of this group" });
    }

    const [messages, total] = await Promise.all([
      Message.find({ groupId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name avatar"),
      Message.countDocuments({ groupId, deletedAt: null }),
    ]);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + messages.length < total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/chat-room/:groupId/messages/:messageId
export const deleteMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;

    const message = await Message.findOne({ _id: messageId, groupId });
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const isOwner = message.sender.toString() === req.user._id.toString();

    const group = await Group.findById(groupId);
    const isAdmin = group.admin.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this message" });
    }

    message.deletedAt = new Date();
    await message.save();

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};