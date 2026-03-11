export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers.length) return null;

  const names = typingUsers.map((u) => u.userName).join(', ');
  const label = typingUsers.length === 1
    ? `${names} is typing`
    : `${names} are typing`;

  return (
    <div className="flex items-end gap-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-800 shrink-0">
        {typingUsers[0].userName.charAt(0).toUpperCase()}
      </div>
      <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex items-center gap-2">
          {/* Animated dots */}
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
      </div>
    </div>
  );
}