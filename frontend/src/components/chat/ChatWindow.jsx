import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Wifi, WifiOff, Users, Award, ArrowLeft } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import BadgePicker from './BadgePicker';
import { deleteMessage } from '../../services/messageService';

export default function ChatWindow({ group, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const [input, setInput] = useState('');
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    messages, onlineUsers, typingUsers, isConnected,
    isLoading, error, sendMessage, sendBadge,
    sendTypingStart, sendTypingStop, removeMessage,
  } = useChat(group._id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // auto-grow textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  const handleBadgeSelect = useCallback((badgeId) => {
    if (!isConnected) return;
    sendBadge(badgeId);
    setShowBadgePicker(false);
  }, [isConnected, sendBadge]);

  const handleDeleteMessage = useCallback(async (groupId, messageId) => {
    try {
      await deleteMessage(groupId, messageId);
      removeMessage(messageId);
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [removeMessage]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f0f2f5]">
      {/* Header — WhatsApp style */}
      <div className="bg-[#0f172a] text-white px-3 py-2 flex items-center gap-3 shrink-0 safe-area-top">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{group.name.charAt(0).toUpperCase()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm leading-tight truncate">{group.name}</h2>
          <div className="flex items-center gap-1 mt-0.5">
            {isConnected ? (
              <><Wifi className="w-3 h-3 text-green-400" /><span className="text-[11px] text-green-400">online</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-white/40" /><span className="text-[11px] text-white/40">connecting…</span></>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
          <Users className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs text-white/70">{onlineUsers.length}</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-sm flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Loading messages…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-sm">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/80 rounded-2xl px-6 py-4 shadow-sm text-center">
              <p className="text-2xl mb-1">👋</p>
              <p className="text-sm text-slate-500 font-medium">No messages yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Say hello to your group!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const senderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
              const isOwn = senderId == user?.id;
              return (
                <ChatMessage
                  key={msg._id}
                  message={msg}
                  isOwn={isOwn}
                  groupId={group._id}
                  onDelete={handleDeleteMessage}
                />
              );
            })}
            <TypingIndicator typingUsers={typingUsers} />
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="bg-[#f0f2f5] px-3 py-2 shrink-0 safe-area-bottom">
        <div className="flex items-end gap-2">
          {/* Badge picker */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowBadgePicker((v) => !v)}
              disabled={!isConnected}
              title="Share a badge"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition
                ${showBadgePicker ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}
                disabled:opacity-40 disabled:cursor-not-allowed shadow-sm`}
            >
              <Award className="w-4.5 h-4.5" />
            </button>
            {showBadgePicker && (
              <BadgePicker onSelect={handleBadgeSelect} onClose={() => setShowBadgePicker(false)} />
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Message…' : 'Connecting…'}
            disabled={!isConnected}
            rows={1}
            className="flex-1 bg-white border-0 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-sm resize-none disabled:opacity-50 overflow-hidden"
            style={{ lineHeight: '1.5', minHeight: '40px' }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 shadow-sm
              ${input.trim() && isConnected ? 'bg-[#0f172a] text-white hover:bg-[#1e293b]' : 'bg-white text-slate-300'}
              disabled:cursor-not-allowed`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}