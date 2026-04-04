import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Users, Plus, Search, UserPlus, MessageSquare } from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import GroupCard from "../components/group/GroupCard";
import ChatPanel from "../components/chat/ChatPanel";
import { CreateGroupModal, JoinGroupModal } from "../components/group/GroupModals";
import { getUserGroups, createGroup, joinGroup } from "../services/groupService";

export default function GroupPage() {
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserGroups();
      const list = Array.isArray(data) ? data : data.groups ?? [];
      setGroups(list);
      // auto-select first group on desktop if none selected
      if (!selectedGroup && list.length > 0) setSelectedGroup(list[0]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreate = async (form) => {
    try {
      await createGroup(form);
      setShowCreate(false);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create group");
    }
  };

  const handleJoin = async (inviteCode) => {
    try {
      await joinGroup(inviteCode);
      setShowJoin(false);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join group");
    }
  };

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  // On mobile: show chat panel full screen when a group is selected
  const showMobileChat = selectedGroup !== null;

  return (
    <Sidebar>
      <div className="flex h-screen overflow-hidden bg-white">

        {/* ── LEFT PANEL: Group list ── */}
        <div className={`
          flex flex-col w-full md:w-[320px] lg:w-[360px] shrink-0
          border-r border-slate-100 bg-white
          ${showMobileChat ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Header */}
          <div className="px-4 pt-5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-slate-900">Group Pot</h1>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowJoin(true)}
                  title="Join group"
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  title="New group"
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups…"
                className="w-full bg-slate-50 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-100 focus:border-blue-300 transition"
              />
            </div>
          </div>

          {/* Group list */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="w-5 h-5 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading…</p>
              </div>
            )}
            {error && <p className="text-center text-xs text-red-400 py-10">{error}</p>}
            {!loading && !error && groups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No groups yet</p>
                <p className="text-xs text-slate-400">Create one or join with an invite code</p>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setShowJoin(true)} className="text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">Join</button>
                  <button onClick={() => setShowCreate(true)} className="text-xs font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] px-3 py-1.5 rounded-lg transition">New Group</button>
                </div>
              </div>
            )}
            {!loading && !error && filtered.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                currentUserId={user?.id || user?._id}
                onRefresh={fetchGroups}
                isSelected={selectedGroup?._id === group._id}
                onSelect={() => setSelectedGroup(group)}
              />
            ))}
            {!loading && !error && groups.length > 0 && filtered.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-8">No results for "{search}"</p>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Chat ── */}
        <div className={`
          flex-1 flex flex-col
          ${showMobileChat ? 'flex' : 'hidden md:flex'}
        `}>
          {selectedGroup ? (
            <ChatPanel
              group={selectedGroup}
              currentUserId={user?.id || user?._id}
              onRefresh={fetchGroups}
              onBack={() => setSelectedGroup(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400">Select a group to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      {showJoin && <JoinGroupModal onClose={() => setShowJoin(false)} onSubmit={handleJoin} />}
    </Sidebar>
  );
}