import express from "express";
import {
  getWsTicket,
  getMessageHistory,
  deleteMessage,
} from "../controllers/chatRoom.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/ticket", protect, getWsTicket);
router.get("/:groupId/messages", protect, getMessageHistory);
router.delete("/:groupId/messages/:messageId", protect, deleteMessage);

export default router;