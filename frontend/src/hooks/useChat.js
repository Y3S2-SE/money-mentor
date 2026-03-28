import { useState, useEffect, useRef, useCallback } from 'react';
import { getWsTicket, getMessageHistory } from '../services/messageService';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:5080';

const MSG = {
  SEND_MESSAGE: 'send_message',
  TYPING_START:  'typing_start',
  TYPING_STOP:   'typing_stop',
  NEW_MESSAGE:   'new_message',
  USER_JOINED:   'user_joined',
  USER_LEFT:     'user_left',
  TYPING:        'typing',
  CONNECTED:     'connected',
  ERROR:         'error',
};

export const useChat = (groupId) => {
  const [messages, setMessages]       = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);

  const wsRef           = useRef(null);
  const typingTimersRef = useRef({});   // per-user auto-clear timers

  // ── Load message history ────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await getMessageHistory(groupId);
      setMessages(data.data.messages);
    } catch (err) {
      setError('Failed to load message history');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // ── Connect WebSocket ───────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!groupId) return;

    try {
      const ticket = await getWsTicket();
      const ws = new WebSocket(`${WS_BASE}/ws?ticket=${ticket}&groupId=${groupId}`);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case MSG.CONNECTED:
            setOnlineUsers(data.onlineUsers || []);
            break;

          case MSG.NEW_MESSAGE:
            setMessages((prev) => {
              // avoid duplicates
              const exists = prev.some((m) => m._id === data.message._id);
              return exists ? prev : [...prev, data.message];
            });
            break;

          case MSG.USER_JOINED:
            setOnlineUsers(data.onlineUsers || []);
            break;

          case MSG.USER_LEFT:
            setOnlineUsers(data.onlineUsers || []);
            // clear typing if they left
            setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            break;

          case MSG.TYPING: {
            const { userId, userName, isTyping } = data;
            // Clear existing timer for this user
            if (typingTimersRef.current[userId]) {
              clearTimeout(typingTimersRef.current[userId]);
            }
            if (isTyping) {
              setTypingUsers((prev) => {
                const exists = prev.some((u) => u.userId === userId);
                return exists ? prev : [...prev, { userId, userName }];
              });
              // Auto-clear typing after 4s in case stop event is missed
              typingTimersRef.current[userId] = setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
              }, 4000);
            } else {
              setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
            }
            break;
          }

          case MSG.ERROR:
            setError(data.message);
            break;

          default:
            break;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
        setIsConnected(false);
      };

    } catch (err) {
      setError(err.message || 'Failed to connect to chat');
      setIsLoading(false);
    }
  }, [groupId]);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback((content) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!content?.trim()) return;

    wsRef.current.send(JSON.stringify({
      type: MSG.SEND_MESSAGE,
      content: content.trim(),
    }));
  }, []);

  // ── Typing indicators ───────────────────────────────────────────────────
  const sendTypingStart = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: MSG.TYPING_START }));
  }, []);

  const sendTypingStop = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: MSG.TYPING_STOP }));
  }, []);

  // ── Disconnect ──────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Clear all typing timers
    Object.values(typingTimersRef.current).forEach(clearTimeout);
    typingTimersRef.current = {};
  }, []);

  // ── Init: load history then connect ────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    setIsConnected(false);
    setIsLoading(true);
    setError(null);

    loadHistory();
    connect();

    return () => disconnect();
  }, [groupId]);

  return {
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    isLoading,
    error,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
  };
};