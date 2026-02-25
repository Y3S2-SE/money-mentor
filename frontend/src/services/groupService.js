import API from "./api";

// All group-related API calls live here.
// Import this service in components instead of calling API directly.

export const getUserGroups = () =>
  API.get("/groups/user-groups").then((r) => r.data);

export const createGroup = (payload) =>
  API.post("/groups/create", payload).then((r) => r.data);

export const joinGroup = (inviteCode) =>
  API.post("/groups/join", { inviteCode }).then((r) => r.data);

export const leaveGroup = (groupId) =>
  API.post("/groups/leave", { groupId }).then((r) => r.data);

export const deleteGroup = (groupId) =>
  API.delete("/groups/delete", { data: { groupId } }).then((r) => r.data);

export const regenerateInvite = (groupId) =>
  API.post("/groups/regenerate-invite", { groupId }).then((r) => r.data);