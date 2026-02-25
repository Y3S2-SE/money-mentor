import Group from "../models/group.model.js";
import crypto from "crypto";

/**
 * Create Group
 * Authenticated user becomes admin automatically
 */
export const createGroup = async (req, res) => {
  try {
    const { name, description, maxMembers } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex");

    const group = await Group.create({
      name,
      description,
      inviteCode,
      admin: userId,
      members: [userId],
      maxMembers: maxMembers || 5,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Join Group using invite code
 */
export const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" });
    }

    const group = await Group.findOne({ inviteCode });

    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.members.includes(userId))
      return res.status(400).json({ message: "Already a member" });

    if (group.members.length >= group.maxMembers)
      return res.status(400).json({ message: "Group is full" });

    group.members.push(userId);
    await group.save();

    res.json({ message: "Joined successfully", group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Leave Group
 */
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Admin cannot leave without deleting or transferring admin
    if (group.admin.toString() === userId) {
      return res.status(400).json({ message: "Admin cannot leave the group" });
    }

    group.members = group.members.filter((member) => member.toString() !== userId);
    await group.save();

    res.json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all groups of authenticated user
 */
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await Group.find({ members: userId })
      .populate("admin", "name email")
      .populate("members", "name email");

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get single group details
 */
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findById(groupId)
      .populate("admin", "name email")
      .populate("members", "name email");

    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete group (Admin Only)
 */
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await Group.findByIdAndDelete(groupId);
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove member (Admin Only)
 */
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const adminId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    group.members = group.members.filter((member) => member.toString() !== memberId);
    await group.save();

    res.json({ message: "Member removed successfully", group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update group info (Admin Only)
 */
export const updateGroup = async (req, res) => {
  try {
    const { groupId, name, description, maxMembers } = req.body;
    const adminId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: "Only admin can update group" });
    }

    if (name) group.name = name;
    if (description) group.description = description;
    if (maxMembers) group.maxMembers = maxMembers;

    await group.save();

    res.json({ message: "Group updated successfully", group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Regenerate invite code (Admin Only)
 */
export const regenerateInviteCode = async (req, res) => {
  try {
    const { groupId } = req.body;
    const adminId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: "Only admin can regenerate invite code" });
    }

    group.inviteCode = crypto.randomBytes(4).toString("hex");
    await group.save();

    res.json({ message: "Invite code regenerated", inviteCode: group.inviteCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};