import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Users, Plus } from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import GroupCard from "../components/group/GroupCard";
import { CreateGroupModal, JoinGroupModal } from "../components/group/GroupModals";
import { getUserGroups, createGroup, joinGroup } from "../services/groupService";

export default function GroupPage() {
  const { user } = useSelector((state) => state.auth);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserGroups();
      setGroups(Array.isArray(data) ? data : data.groups ?? []);
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

  return (
    <Sidebar>
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Group Pot</h1>
              <p className="text-slate-400 text-sm mt-0.5">Your saving circles &amp; squad goals</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowJoin(true)} className="text-sm font-medium text-blue-700 border border-blue-200 bg-white hover:bg-blue-50 px-4 py-2 rounded-xl transition">
                Join Group
              </button>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-950 hover:bg-blue-800 px-4 py-2 rounded-xl transition">
                <Plus className="w-4 h-4" /> New Group
              </button>
            </div>
          </div>

          {loading && <div className="text-center py-20 text-slate-400 text-sm animate-pulse">Loading your groups…</div>}
          {error && <div className="text-center py-20 text-red-400 text-sm">{error}</div>}

          {!loading && !error && groups.length === 0 && (
            <div className="text-center py-24 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-300" />
              </div>
              <p className="text-slate-500 font-medium">You're not in any group yet.</p>
              <p className="text-slate-400 text-sm">Create one or join with an invite code.</p>
            </div>
          )}

          {!loading && !error && groups.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <GroupCard
                  key={group._id}
                  group={group}
                  currentUserId={user?.id || user?._id}
                  onRefresh={fetchGroups}
                />
              ))}
            </div>
          )}
        </div>

        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
        {showJoin && <JoinGroupModal onClose={() => setShowJoin(false)} onSubmit={handleJoin} />}
      </div>
    </Sidebar>
  );
}