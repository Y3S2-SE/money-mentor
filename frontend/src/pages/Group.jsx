import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Users, Plus, Search, UserPlus, MessagesSquare } from "lucide-react";
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
      // No auto-select — user must click a group
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

  const showMobileChat = selectedGroup !== null;

  return (
    <Sidebar>
      <div className="flex h-screen overflow-hidden bg-white">

        {/* ── LEFT PANEL ── */}
        <div className={`
          flex flex-col w-full md:w-[320px] lg:w-[360px] shrink-0
          border-r border-slate-100 bg-white
          ${showMobileChat ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Header */}
          <div className="px-4 pt-4 pb-3 bg-[#0f172a]">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Group Pot</h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowJoin(true)}
                  title="Join group"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  title="New group"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups…"
                className="w-full bg-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 border-0 transition"
              />
            </div>
          </div>

          {/* Group list */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-5 h-5 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading…</p>
              </div>
            )}
            {error && <p className="text-center text-xs text-red-400 py-10">{error}</p>}
            {!loading && !error && groups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No groups yet</p>
                <p className="text-xs text-slate-400">Create one or join with an invite code</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setShowJoin(true)} className="text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg transition">Join</button>
                  <button onClick={() => setShowCreate(true)} className="text-xs font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] px-4 py-2 rounded-lg transition">New Group</button>
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

        {/* ── RIGHT PANEL ── */}
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
            <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-[#f0f2f5]">
              <div className="flex flex-col items-center gap-4 max-w-xs text-center">
                <div className="w-28 h-28 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <MessagesSquare className="w-12 h-12 text-slate-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-600 mb-1">Group Pot Chats</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Select a group from the left to start chatting with your saving circle.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-10 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400">end-to-end encrypted</span>
                  <div className="w-10 h-px bg-slate-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      {showJoin && <JoinGroupModal onClose={() => setShowJoin(false)} onSubmit={handleJoin} />}
    </Sidebar>
  );
}