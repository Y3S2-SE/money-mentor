import { useState } from "react";
import { X } from "lucide-react";

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function CreateGroupModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", description: "", maxMembers: 5 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit(form); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal title="New Group" subtitle="Start a saving circle with your squad" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Group Name *</label>
          <input
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            placeholder="e.g. Vacation Fund 2025"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition"
            placeholder="What's this group saving for?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Max Members</label>
          <input
            type="number" min={2} max={50}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            value={form.maxMembers}
            onChange={(e) => setForm({ ...form, maxMembers: Number(e.target.value) })}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50 mt-1"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating…
            </span>
          ) : "Create Group"}
        </button>
      </form>
    </Modal>
  );
}

export function JoinGroupModal({ onClose, onSubmit }) {
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit(inviteCode); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal title="Join a Group" subtitle="Enter the invite code from your group admin" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Invite Code *</label>
          <input
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-[0.2em] text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition text-center"
            placeholder="a3f9c2b1"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Joining…
            </span>
          ) : "Join Group"}
        </button>
      </form>
    </Modal>
  );
}