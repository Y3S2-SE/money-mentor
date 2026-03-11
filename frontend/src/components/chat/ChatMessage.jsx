export default function ChatMessage({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isOwn) {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[70%]">
          <div className="bg-blue-950 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          </div>
          <p className="text-[10px] text-slate-400 text-right mt-1 pr-1">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-2">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-800 shrink-0 mb-4">
        {(message.sender?.name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="max-w-[70%]">
        <p className="text-[11px] text-slate-400 mb-1 ml-1">{message.sender?.name}</p>
        <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
          <p className="text-sm text-slate-800 leading-relaxed break-words">{message.content}</p>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 ml-1">{time}</p>
      </div>
    </div>
  );
}