import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import { consumeTicket } from "./wsTicketStore.js";

export const authenticateWsConnection = async (request) => {
  const url = new URL(request.url, `http://localhost`);
  const ticket = url.searchParams.get("ticket");
  const groupId = url.searchParams.get("groupId");

  if (!ticket) throw new Error("No ticket provided");
  if (!groupId) throw new Error("No groupId provided");

  // Consume ticket — one time use, auto deleted after
  const userId = consumeTicket(ticket);
  if (!userId) throw new Error("Invalid or expired ticket");

  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");
  if (!user.isActive) throw new Error("User account is deactivated");

  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const isMember = group.members.some((m) => m.toString() === userId);
  const isAdmin = group.admin.toString() === userId;

  if (!isMember && !isAdmin) {
    throw new Error("User is not a member of this group");
  }

  return { user, group };
};