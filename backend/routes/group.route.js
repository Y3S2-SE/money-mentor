import express from "express";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  getUserGroups,
  getGroupById,
  deleteGroup,
  removeMember,
  updateGroup,
  regenerateInviteCode,
} from "../controllers/group.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);
// Core Membership
router.post("/create", createGroup);
router.post("/join", joinGroup);
router.post("/leave", leaveGroup);
router.get("/user-groups", getUserGroups);
router.get("/get-group", getGroupById);

// Admin Controls
router.delete("/delete", deleteGroup);
router.post("/remove-member", removeMember);
router.put("/update", updateGroup);
router.post("/regenerate-invite", regenerateInviteCode);

export default router;