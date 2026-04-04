import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Wifi, WifiOff, Users, Award } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import BadgePicker from './BadgePicker';

export default function ChatWindow({ group, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const [input, setInput]               = useState('');
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const isTypingRef   = useRef(false);
  const typingTimeout = useRef(null);
  const bottomRef     = useRef(null);

  const {
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    isLoading,
    error,
    sendMessage,
    sendBadge,          // ← from useChat
    sendTypingStart,
    sendTypingStop,
  } = useChat(group._id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStart();
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStop();
    }, 1500);
  };

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;

    sendMessage(trimmed);
    setInput('');

    clearTimeout(typingTimeout.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingStop();
    }
  }, [input, isConnected, sendMessage, sendTypingStop]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Badge share ───────────────────────────────────────────────────────────
  const handleBadgeSelect = useCallback((badgeId) => {
    if (!isConnected) return;
    sendBadge(badgeId);
    setShowBadgePicker(false);
  }, [isConnected, sendBadge]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl flex flex-col w-full max-w-lg h-[600px] overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {group.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm leading-tight">{group.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isConnected ? (
                  <><Wifi className="w-3 h-3 text-green-500" /><span className="text-[11px] text-green-500">Connected</span></>
                ) : (
                  <><WifiOff className="w-3 h-3 text-slate-400" /><span className="text-[11px] text-slate-400">Connecting...</span></>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span>{onlineUsers.length} online</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-950 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Loading messages...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-slate-400">No messages yet. Say hello! 👋</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const senderId = typeof msg.sender === 'object'
                  ? msg.sender?._id
                  : msg.sender;
                const isOwn = senderId == user?.id;

                return (
                  <ChatMessage
                    key={msg._id}
                    message={msg}
                    isOwn={isOwn}
                  />
                );
              })}
              <TypingIndicator typingUsers={typingUsers} />
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* ── Input ── */}
        <div className="bg-white border-t border-slate-100 px-4 py-3 shrink-0">
          <div className="flex items-end gap-2">

            {/* Badge picker button + popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowBadgePicker((v) => !v)}
                disabled={!isConnected}
                title="Share a badge"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition
                  ${showBadgePicker
                    ? 'bg-blue-950 text-white border-blue-950'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}
                  disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Award className="w-4 h-4" />
              </button>

              {showBadgePicker && (
                <BadgePicker
                  onSelect={handleBadgeSelect}
                  onClose={() => setShowBadgePicker(false)}
                />
              )}
            </div>

            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected}
              rows={1}
              className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950/30 transition disabled:opacity-50 max-h-28 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || !isConnected}
              className="w-10 h-10 bg-blue-950 hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 mt-1.5 ml-1">
            Enter to send · Shift+Enter for new line
          </p>
        </div>

      </div>
    </div>
  );
}