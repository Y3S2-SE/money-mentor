import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Wifi, WifiOff, Users, Award, ArrowLeft, Crown, Copy, Check, RefreshCw, Trash2, LogOut, MoreVertical } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import BadgePicker from './BadgePicker';
import { deleteMessage } from '../../services/messageService';
import { useCopy } from '../../hooks/useCopy';
import { leaveGroup, deleteGroup, regenerateInvite } from '../../services/groupService';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/toastSlice';

export default function ChatPanel({ group, currentUserId, onRefresh, onBack }) {
  const { user } = useSelector((state) => state.auth);
  const { copied, copy } = useCopy();
  const [input, setInput] = useState('');
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const dispatch = useDispatch();
  const isAdmin = group.admin?._id === currentUserId || group.admin === currentUserId;

  const {
    messages, onlineUsers, typingUsers, isConnected,
    isLoading, error, sendMessage, sendBadge,
    sendTypingStart, sendTypingStop, removeMessage,
  } = useChat(group._id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    setInput('');
    setShowBadgePicker(false);
  }, [group._id]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    if (!isTypingRef.current) { isTypingRef.current = true; sendTypingStart(); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { isTypingRef.current = false; sendTypingStop(); }, 1500);
  };

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;
    sendMessage(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    clearTimeout(typingTimeout.current);
    if (isTypingRef.current) { isTypingRef.current = false; sendTypingStop(); }
  }, [input, isConnected, sendMessage, sendTypingStop]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleBadgeSelect = useCallback((badgeId) => {
    if (!isConnected) return;
    sendBadge(badgeId);
    setShowBadgePicker(false);
  }, [isConnected, sendBadge]);

  const handleDeleteMessage = useCallback(async (groupId, messageId) => {
    try { await deleteMessage(groupId, messageId); removeMessage(messageId); }
    catch (err) { console.error('Delete error:', err); }
  }, [removeMessage]);

  const handleLeave = async () => {
    setShowGroupMenu(false);
    if (!window.confirm('Leave this group?')) return;
    try {
      await leaveGroup(group._id);
      dispatch(addToast({ type: 'info', message: 'You left the group', subMessage: 'You have been removed from this group' }));
      onRefresh();
      onBack();
    } catch (err) { alert(err.response?.data?.message || 'Failed to leave'); }
  };

  const handleDelete = async () => {
    setShowGroupMenu(false);
    if (!window.confirm('Delete this group permanently?')) return;
    try { await deleteGroup(group._id); onRefresh(); onBack(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleRegen = async () => {
    setShowGroupMenu(false);
    try { await regenerateInvite(group._id); onRefresh(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to regenerate'); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">

      {/* ── Header ── */}
      <div className="bg-[#0f172a] px-4 py-3 flex items-center gap-3 shrink-0">
        {/* Back (mobile) */}
        <button onClick={onBack} className="md:hidden p-1 -ml-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{group.name.charAt(0).toUpperCase()}</span>
          </div>
          {isAdmin && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-[#0f172a] flex items-center justify-center">
              <Crown className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white text-sm truncate">{group.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              {isConnected
                ? <><Wifi className="w-3 h-3 text-green-400" /><span className="text-[11px] text-green-400">Connected</span></>
                : <><WifiOff className="w-3 h-3 text-white/30" /><span className="text-[11px] text-white/30">Connecting…</span></>
              }
            </div>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1 text-[11px] text-white/40">
              <Users className="w-3 h-3" />
              <span>{onlineUsers.length} online</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowGroupMenu(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showGroupMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowGroupMenu(false)} />
              <div className="absolute right-0 top-11 z-20 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-52 overflow-hidden">
                <button
                  onClick={() => { copy(group.inviteCode); setShowGroupMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy invite: <span className="font-mono ml-1">{group.inviteCode}</span>
                </button>
                {isAdmin && (
                  <button onClick={handleRegen} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition">
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate code
                  </button>
                )}
                <div className="my-1 border-t border-slate-100" />
                {isAdmin ? (
                  <button onClick={handleDelete} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition">
                    <Trash2 className="w-3.5 h-3.5" /> Delete group
                  </button>
                ) : (
                  <button onClick={handleLeave} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition">
                    <LogOut className="w-3.5 h-3.5" /> Leave group
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          background: '#f0f2f5',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white rounded-2xl px-6 py-5 shadow-sm flex flex-col items-center gap-2">
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
            <div className="bg-white/80 rounded-2xl px-6 py-5 shadow-sm text-center">
              <p className="text-2xl mb-1">👋</p>
              <p className="text-sm font-semibold text-slate-600">No messages yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Say hello to <span className="font-medium">{group.name}</span>!</p>
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

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          {/* Badge picker */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowBadgePicker(v => !v)}
              disabled={!isConnected}
              title="Share a badge"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition
                ${showBadgePicker ? 'bg-[#0f172a] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Award className="w-4 h-4" />
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
            placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
            disabled={!isConnected}
            rows={1}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition disabled:opacity-50 overflow-hidden"
            style={{ lineHeight: '1.5', minHeight: '38px' }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0
              ${input.trim() && isConnected
                ? 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-300 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}