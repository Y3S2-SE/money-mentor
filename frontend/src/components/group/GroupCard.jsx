import { Users, Crown, Copy, Check, LogOut, Trash2, RefreshCw } from "lucide-react";
import { useCopy } from "../../hooks/useCopy";
import { leaveGroup, deleteGroup, regenerateInvite } from "../../services/groupService";

export default function GroupCard({ group, currentUserId, onRefresh }) {
  const { copied, copy } = useCopy();

  // admin is populated by backend so it comes as { _id, name, email }
  const isAdmin =
    group.admin?._id === currentUserId || group.admin === currentUserId;

  const fillPct = Math.round((group.members.length / group.maxMembers) * 100);

  const handleLeave = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      await leaveGroup(group._id);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave group");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this group permanently?")) return;
    try {
      await deleteGroup(group._id);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete group");
    }
  };

  const handleRegen = async () => {
    try {
      await regenerateInvite(group._id);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to regenerate code");
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base">
              {group.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-[15px] leading-tight">{group.name}</h3>
            {group.description && (
              <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{group.description}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
            <Crown className="w-3 h-3" /> Admin
          </span>
        )}
      </div>

      {/* Members progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Members</span>
          <span>{group.members.length} / {group.maxMembers}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-blue-700 h-1.5 rounded-full transition-all" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      {/* Member avatars */}
      <div className="flex -space-x-2">
        {group.members.slice(0, 5).map((m, i) => (
          <div
            key={m._id || i}
            title={m.name || m.email}
            className="w-7 h-7 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-[11px] font-bold text-blue-800"
          >
            {(m.name || m.email || "?").charAt(0).toUpperCase()}
          </div>
        ))}
        {group.members.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-500 font-semibold">
            +{group.members.length - 5}
          </div>
        )}
      </div>

      {/* Invite code */}
      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
        <span className="text-slate-400 text-xs font-medium flex-1">
          Code: <span className="text-slate-700 font-mono font-semibold">{group.inviteCode}</span>
        </span>
        <button onClick={() => copy(group.inviteCode)} className="text-slate-400 hover:text-blue-700 transition" title="Copy">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        {isAdmin && (
          <button onClick={handleRegen} className="text-slate-400 hover:text-blue-700 transition" title="Regenerate">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {isAdmin ? (
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
            <Trash2 className="w-3.5 h-3.5" /> Delete Group
          </button>
        ) : (
          <button onClick={handleLeave} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
            <LogOut className="w-3.5 h-3.5" /> Leave Group
          </button>
        )}
      </div>
    </div>
  );
}