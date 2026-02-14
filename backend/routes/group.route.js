import express from "express";
import {
  createGroup,
  joinGroup,
  getUserGroups,
  leaveGroup
} from "../controllers/group.controller.js";

const router = express.Router();

// create group
router.post("/create", createGroup);
// join group
router.post("/join", joinGroup);
// get user groups
router.get("/getUserGroups", getUserGroups);
//leave group
router.patch("/leaveGroup", leaveGroup);
export default router;
