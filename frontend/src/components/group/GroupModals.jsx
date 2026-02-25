import { useState } from "react";
import { X, Plus } from "lucide-react";

// Shared modal shell
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Create Group Modal ────────────────────────────────────────────────────────
export function CreateGroupModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", description: "", maxMembers: 5 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);  // parent handles the API call
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create a New Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Group Name *</label>
          <input
            required
            className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="e.g. Vacation Fund 2025"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
          <textarea
            rows={2}
            className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            placeholder="What's this group saving for?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Max Members</label>
          <input
            type="number" min={2} max={50}
            className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={form.maxMembers}
            onChange={(e) => setForm({ ...form, maxMembers: Number(e.target.value) })}
          />
        </div>
        <button
          type="submit" disabled={submitting}
          className="w-full bg-blue-950 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Group"}
        </button>
      </form>
    </Modal>
  );
}

// ── Join Group Modal ──────────────────────────────────────────────────────────
export function JoinGroupModal({ onClose, onSubmit }) {
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(inviteCode);  // parent handles the API call
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Join a Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invite Code *</label>
          <input
            required
            className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 tracking-widest"
            placeholder="e.g. a3f9c2b1"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>
        <button
          type="submit" disabled={submitting}
          className="w-full bg-blue-950 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50"
        >
          {submitting ? "Joining…" : "Join Group"}
        </button>
      </form>
    </Modal>
  );
}