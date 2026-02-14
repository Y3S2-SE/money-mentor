import Group from "../models/group.model.js";
import crypto from "crypto";

/**
 * Create Group
 * TEMP: userId comes from body (until authentication is ready)
 */
export const createGroup = async (req, res) => {
  try {
    const { name, description, maxMembers, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({
        message: "Group name and userId are required",
      });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex");

    const group = await Group.create({
      name,
      description,
      inviteCode,
      admin: userId,
      members: [userId],
      maxMembers,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * join group using invite code
 */
export const joinGroup = async (req, res) => {
  try{

    const {inviteCode, userId} = req.body;

    if( !inviteCode || !userId) {
      return res.status(400).json({
        message: "Invite code and user Id are required",
      });
    }

    const group = await Group.findOne({inviteCode});

    if( !group) {
      return res.status(404).json({message: "Group not found"});
    }

    if( group.members.includes(userId)){
      return res.status(400).json({message: "Already a member"});
    }

    if( group.members.length >= group.maxMembers) {
      return res.status(400).json({message: "Group is full"});
    }

    group.members.push(userId);
    await group.save();

    res.json({message: "Joined successfully", group});

  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

/**
 * get all groups of user
 */
export const getUserGroups = async (req, res) => {
  try {

    const {userId} = req.body;

    const groups = await Group.find({
      members: userId,
    })
    
    res.json(groups);

  } catch (error) {
    res.status(500).json({message: error.message});
  }
}

/**
 * leave group
 */
export const leaveGroup = async ( req, res) => {
  try {

    const {groupId, userId} = req.body;
    const group = await Group.findById(groupId);

    if ( !group ) {
      return res.status(404).json({message: "Group not found"});
    }

    await Group.findByIdAndUpdate(
      groupId,
      {pull: {members: userId}}
    );

    res.json({message: "Left group successfully"});

  }catch (error) {
    return res.status(500).json({message: error.message});
  }
}