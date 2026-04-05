import { useState } from 'react';
import { useDispatch } from 'react-redux';
import ChatBadgeCard from './ChatBadgeCard';
import { addToast } from '../../store/slices/toastSlice';

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
        <img src={preview.image} alt={preview.title} className="w-full h-32 object-cover" onError={(e) => (e.target.style.display = 'none')} />
      )}
      <div className="px-3 py-2">
        {preview.siteName && <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{preview.siteName}</p>}
        {preview.title && <p className="text-xs font-semibold text-slate-800 line-clamp-2">{preview.title}</p>}
        {preview.description && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{preview.description}</p>}
      </div>
    </a>
  );
}

function DeleteModal({ message, onConfirm, onCancel, isDeleting }) {
  const preview = message.type === 'badge' ? '🏅 Badge share' : (message.content?.length > 50 ? message.content.slice(0, 50) + '…' : message.content);
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-75 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-semibold text-slate-800">Delete message?</h3>
          <div className="mt-3 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500 italic">{preview}</p>
          </div>
        </div>
        <div className="flex border-t border-slate-100">
          <button onClick={onCancel} disabled={isDeleting} className="flex-1 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 transition disabled:opacity-50 border-r border-slate-100">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
            {isDeleting ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatMessage({ message, isOwn, groupId, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useDispatch();

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(groupId, message._id);
      setShowModal(false);
      dispatch(addToast({ type: 'success', message: 'Message deleted', subMessage: 'Your message has been removed' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete message', subMessage: 'Please try again later' }));
    } finally {
      setIsDeleting(false);
    }
  };

  // Badge message
  if (message.type === 'badge' && message.badgeShare) {
    return (
      <>
        {showModal && <DeleteModal message={message} onConfirm={handleDeleteConfirm} onCancel={() => setShowModal(false)} isDeleting={isDeleting} />}
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start items-end gap-2'} mb-1.5 group`}>
          {!isOwn && (
            <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-700 shrink-0 mb-5">
              {(message?.sender?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="max-w-[80%]">
            {!isOwn && <p className="text-[11px] text-slate-500 mb-1 ml-1 font-medium">{message.sender?.username}</p>}
            <div className={`px-3 py-2.5 rounded-2xl shadow-sm ${isOwn ? 'bg-[#0f172a] rounded-tr-sm' : 'bg-white rounded-tl-sm'}`}>
              <p className={`text-[11px] mb-2 ${isOwn ? 'text-blue-300' : 'text-slate-400'}`}>🏅 shared a badge</p>
              <ChatBadgeCard badgeShare={message.badgeShare} />
            </div>
            <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end pr-1' : 'ml-1'}`}>
              {isOwn && (
                <button onClick={() => setShowModal(true)} className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                  </svg>
                </button>
              )}
              <p className="text-[10px] text-slate-400">{time}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Own message
  if (isOwn) {
    return (
      <>
        {showModal && <DeleteModal message={message} onConfirm={handleDeleteConfirm} onCancel={() => setShowModal(false)} isDeleting={isDeleting} />}
        <div className="flex justify-end mb-1.5 group items-end gap-1">
          <button onClick={() => setShowModal(true)} className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-400 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
            </svg>
          </button>
          <div className="max-w-[75%]">
            <div className="bg-[#0f172a] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm leading-relaxed wrap-break-word">{message.content}</p>
              <LinkPreviewCard preview={message.linkPreview} />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 text-right pr-1">{time}</p>
          </div>
        </div>
      </>
    );
  }

  // Other user's message
  return (
    <div className="flex justify-start items-end gap-2 mb-1.5">
      <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-700 shrink-0 mb-5">
        {(message?.sender?.username || '?').charAt(0).toUpperCase()}
      </div>
      <div className="max-w-[75%]">
        <p className="text-[11px] text-slate-500 mb-1 ml-1 font-medium">{message.sender?.username}</p>
        <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
          <p className="text-sm text-slate-900 leading-relaxed wrap-break-word">{message.content}</p>
          <LinkPreviewCard preview={message.linkPreview} />
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 ml-1">{time}</p>
      </div>
    </div>
  );
}