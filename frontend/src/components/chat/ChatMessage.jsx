import { useState } from 'react';
import ChatBadgeCard from './ChatBadgeCard';

// link-preview card component
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
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{preview.siteName}</p>
        )}
        {preview.title && (
          <p className="text-xs font-semibold text-slate-800 line-clamp-2">{preview.title}</p>
        )}
        {preview.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{preview.description}</p>
        )}
      </div>
    </a>
  );
}

// delete confirmation modal component
function DeleteModal({ message, onConfirm, onCancel, isDeleting }) {
  // Truncate preview of message content
  const preview = message.type === 'badge'
    ? '🏅 Badge share'
    : (message.content?.length > 50
        ? message.content.slice(0, 50) + '…'
        : message.content);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel} // click outside to dismiss
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[320px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()} // prevent dismiss when clicking inside
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Delete message?</h3>
        </div>

        {/* Message preview */}
        <div className="mx-5 mb-4 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-xs text-slate-500 italic">{preview}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// delete button component
function DeleteButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150
                 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100
                 flex items-center justify-center shrink-0 self-center"
      title="Delete message"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
      </svg>
    </button>
  );
}


export default function ChatMessage({ message, isOwn, groupId, onDelete }) {
  const [showModal, setShowModal]   = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(groupId, message._id);
      setShowModal(false);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // badge share message
  if (message.type === 'badge' && message.badgeShare) {
    return (
      <>
        {showModal && (
          <DeleteModal
            message={message}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowModal(false)}
            isDeleting={isDeleting}
          />
        )}
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start items-end gap-2'} mb-2 group`}>
          {!isOwn && (
            <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-800 shrink-0 mb-4">
              {(message?.sender?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="max-w-[75%]">
            {!isOwn && (
              <p className="text-[11px] text-slate-400 mb-1 ml-1">{message.sender?.username}</p>
            )}
            <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
              isOwn ? 'bg-blue-950 rounded-tr-sm' : 'bg-white border border-slate-100 rounded-tl-sm'
            }`}>
              <p className={`text-xs mb-2 ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}>
                🏅 shared a badge
              </p>
              <ChatBadgeCard badgeShare={message.badgeShare} />
            </div>
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end pr-1' : 'ml-1'}`}>
              {isOwn && <DeleteButton onClick={() => setShowModal(true)} />}
              <p className="text-[10px] text-slate-400">{time}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // own message (text or badge) with delete option in right side
  if (isOwn) {
    return (
      <>
        {showModal && (
          <DeleteModal
            message={message}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowModal(false)}
            isDeleting={isDeleting}
          />
        )}
        <div className="flex justify-end mb-2 group">
          <div className="max-w-[70%]">
            <div className="bg-blue-950 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
              <LinkPreviewCard preview={message.linkPreview} />
            </div>
            <div className="flex justify-end items-center gap-1 mt-1 pr-1">
              <DeleteButton onClick={() => setShowModal(true)} />
              <p className="text-[10px] text-slate-400">{time}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // other user's message (text or badge) without delete option, aligned left with avatar
  return (
    <div className="flex justify-start items-end gap-2 mb-2 group">
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