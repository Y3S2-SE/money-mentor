import Group from "../models/group.model.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";

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
    logger.error('Failed to create group', error);
    res.status(500).json({ message: 'Failed to create group' });
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
    logger.error('Failed to join group', error);
    res.status(500).json({ message: 'Failed to join group' });
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
    logger.error('Failed to leave group', error);
    res.status(500).json({ message: 'Failed to leave group' });
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
    logger.error('Failed to fetch user groups', error);
    res.status(500).json({ message: 'Failed to fetch user groups' });
  }
};

/**
 * Get single group details
 */
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Membership is enforced in the query so non-members get a 404
    // and cannot tell whether the group exists.
    const group = await Group.findOne({
      _id: groupId,
      $or: [{ admin: userId }, { members: userId }],
    })
      .populate("admin", "username email")
      .populate("members", "username email");

    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only the admin may see the invite code through this endpoint
    const result = group.toObject();
    if (group.admin._id.toString() !== userId) delete result.inviteCode;

    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch group', error);
    res.status(500).json({ message: 'Failed to fetch group' });
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
    logger.error('Failed to delete group', error);
    res.status(500).json({ message: 'Failed to delete group' });
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
    logger.error('Failed to remove member', error);
    res.status(500).json({ message: 'Failed to remove member' });
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
    logger.error('Failed to update group', error);
    res.status(500).json({ message: 'Failed to update group' });
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
    logger.error('Failed to regenerate invite code', error);
    res.status(500).json({ message: 'Failed to regenerate invite code' });
  }
};