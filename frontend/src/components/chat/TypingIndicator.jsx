export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers.length) return null;

  return (
    <div className="flex items-end gap-2 mb-1.5">
      {typingUsers.slice(0, 1).map((user) => (
        <div
          key={user.userId}
          className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-700 shrink-0"
        >
          {(user?.userName || '?').charAt(0).toUpperCase()}
        </div>
      ))}
      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}