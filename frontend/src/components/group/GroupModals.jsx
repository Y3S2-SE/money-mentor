import { useState } from "react";
import { X } from "lucide-react";

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>
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

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

function useGroupNameValidation(value) {
  if (!value) return "";
  if (!/^[A-Za-z]/.test(value)) return "Must start with a letter (A–Z)";
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(value)) return "No symbols allowed — letters and numbers only";
  return "";
}

function useMembersValidation(value) {
  if (value < 2) return "Minimum 2 members";
  if (value > 15) return "Maximum 15 members";
  return "";
}

export function CreateGroupModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", description: "", maxMembers: 5 });
  const [touched, setTouched] = useState({ name: false, maxMembers: false });
  const [submitting, setSubmitting] = useState(false);


  const nameError = useGroupNameValidation(form.name);
  const membersError = useMembersValidation(form.maxMembers);

  const isValid = form.name && !nameError && !membersError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try { await onSubmit(form); }
    finally { setSubmitting(false); }
  };

  const inputClass = (hasError, value) =>
    `w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${hasError
      ? "border-red-400 focus:ring-red-500/20 focus:border-red-400"
      : value
        ? "border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-400"
        : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-400"
    }`;

  return (
    <Modal title="New Group" subtitle="Start a saving circle with your squad" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Group Name *
          </label>
          <input
            required
            maxLength={15}
            className={inputClass(touched.name && nameError, !nameError && form.name)}
            placeholder="e.g. VacationFund2025"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={() => setTouched({ ...touched, name: true })}
            onFocus={() => setTouched((t) => ({ ...t, name: true }))}
          />
          <div className="flex justify-between items-center mt-1">
            <FieldError message={touched.name ? nameError : ""} />
            <span className={`text-xs ml-auto ${form.name.length >= 14 ? "text-red-400" : "text-slate-400"}`}>
              {form.name.length} / 15
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Description <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition"
            placeholder="What's this group saving for?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Max Members <span className="normal-case font-normal text-slate-300">(2–15)</span>
          </label>
          <input
            type="number"
            min={2}
            max={15}
            className={inputClass(touched.maxMembers && membersError, !membersError)}
            value={form.maxMembers}
            onChange={(e) => {
              const val = e.target.value.replace(/^0+/, "");
              setForm({ ...form, maxMembers: val });
            }}
            onFocus={() => setTouched((t) => ({ ...t, name: true }))}
            onBlur={() => setTouched({ ...touched, maxMembers: true })}
          />
          <FieldError message={touched.maxMembers ? membersError : ""} />
        </div>

        <button
          type="submit"
          disabled={submitting || !isValid}
          className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-40 mt-1"
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
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const codeError = touched && !inviteCode.trim() ? "Invite code is required" : "";
  const isValid = inviteCode.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try { await onSubmit(inviteCode); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal title="Join a Group" subtitle="Enter the invite code from your group admin" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Invite Code *
          </label>
          <input
            required
            className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-mono tracking-[0.2em] text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:ring-2 transition text-center ${codeError
              ? "border-red-400 focus:ring-red-500/20 focus:border-red-400"
              : isValid
                ? "border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-400"
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-400"
              }`}
            placeholder="a3f9c2b1"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          <FieldError message={codeError} />
        </div>
        <button
          type="submit"
          disabled={submitting || !isValid}
          className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-40"
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