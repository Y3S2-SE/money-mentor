import ChatBadgeCard from './ChatBadgeCard';

function LinkPreviewCard({ preview }) {
  if (!preview?.url) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-xl overflow-hidden border border-slate-200 bg-white hover:bg-slate-50 transition"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt={preview.title}
          className="w-full h-32 object-cover"
          onError={(e) => (e.target.style.display = 'none')}
        />
      )}
      <div className="px-3 py-2">
        {preview.siteName && (
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
            {preview.siteName}
          </p>
        )}
        {preview.title && (
          <p className="text-xs font-semibold text-slate-800 line-clamp-2">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}

export default function ChatMessage({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Badge share message ────────────────────────────────────────────────
  if (message.type === 'badge' && message.badgeShare) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start items-end gap-2'} mb-2`}>
        {!isOwn && (
          <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-800 shrink-0 mb-4">
            {(message?.sender?.username || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="max-w-[75%]">
          {!isOwn && (
            <p className="text-[11px] text-slate-400 mb-1 ml-1">
              {message.sender?.username}
            </p>
          )}
          <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-blue-950 rounded-tr-sm'
              : 'bg-white border border-slate-100 rounded-tl-sm'
          }`}>
            <p className={`text-xs mb-2 ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}>
              🏅 shared a badge
            </p>
            <ChatBadgeCard badgeShare={message.badgeShare} />
          </div>
          <p className={`text-[10px] text-slate-400 mt-1 ${isOwn ? 'text-right pr-1' : 'ml-1'}`}>
            {time}
          </p>
        </div>
      </div>
    );
  }

  // ── Regular text message ───────────────────────────────────────────────
  if (isOwn) {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[70%]">
          <div className="bg-blue-950 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
            <LinkPreviewCard preview={message.linkPreview} />
          </div>
          <p className="text-[10px] text-slate-400 text-right mt-1 pr-1">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-end gap-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-800 shrink-0 mb-4">
        {(message?.sender?.username || '?').charAt(0).toUpperCase()}
      </div>
      <div className="max-w-[70%]">
        <p className="text-[11px] text-slate-400 mb-1 ml-1">{message.sender?.username}</p>
        <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
          <p className="text-sm text-slate-800 leading-relaxed break-words">{message.content}</p>
          <LinkPreviewCard preview={message.linkPreview} />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 ml-1">{time}</p>
      </div>
    </div>
  );
}