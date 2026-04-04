import { useState } from 'react';
import { Crown, Copy, Check, LogOut, Trash2, RefreshCw, MoreVertical } from 'lucide-react';
import { useCopy } from '../../hooks/useCopy';
import { leaveGroup, deleteGroup, regenerateInvite } from '../../services/groupService';

export default function GroupCard({ group, currentUserId, onRefresh, isSelected, onSelect }) {
  const { copied, copy } = useCopy();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = group.admin?._id === currentUserId || group.admin === currentUserId;

  const handleLeave = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm('Leave this group?')) return;
    try { await leaveGroup(group._id); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to leave group'); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm('Delete this group permanently?')) return;
    try { await deleteGroup(group._id); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete group'); }
  };

  const handleRegen = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try { await regenerateInvite(group._id); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to regenerate code'); }
  };

  return (
    <div
      onClick={onSelect}
      className={`relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors
        ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'}
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-[#0f172a] rounded-r-full" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full bg-[#0f172a] flex items-center justify-center">
          <span className="text-white font-bold text-sm">{group.name.charAt(0).toUpperCase()}</span>
        </div>
        {isAdmin && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
            <Crown className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-slate-900 text-sm truncate">{group.name}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{group.members.length}/{group.maxMembers}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-slate-400 truncate">
            {group.description || `${group.members.length} member${group.members.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {/* Thin progress bar */}
        <div className="mt-1.5 w-full bg-slate-200 rounded-full h-0.5">
          <div
            className="bg-blue-500 h-0.5 rounded-full transition-all"
            style={{ width: `${Math.round((group.members.length / group.maxMembers) * 100)}%` }}
          />
        </div>
      </div>

      {/* Menu */}
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-44 overflow-hidden">
              <button
                onClick={e => { e.stopPropagation(); copy(group.inviteCode); setMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy invite code
              </button>
              {isAdmin && (
                <button
                  onClick={handleRegen}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate code
                </button>
              )}
              <div className="my-1 border-t border-slate-100" />
              {isAdmin ? (
                <button onClick={handleDelete} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Delete group
                </button>
              ) : (
                <button onClick={handleLeave} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition">
                  <LogOut className="w-3.5 h-3.5" /> Leave group
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}