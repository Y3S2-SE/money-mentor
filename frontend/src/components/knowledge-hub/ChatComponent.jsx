import React, { useState, useEffect, useRef } from 'react';
import { startConversation, sendMessage, getAllConversations, getConversation } from '../../services/chatService';

const ChatComponent = ({ activeChatId, setActiveChatId, onMessageSent }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await getAllConversations();
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId);
    setLoading(true);
    try {
      const res = await getConversation(chatId);
      setMessages(res.data.messages || []);
      onMessageSent(); // Trigger video refresh
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMsg = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      if (activeChatId) {
        const res = await sendMessage(activeChatId, userMsg.content);
        setMessages(prev => [...prev, { role: 'model', content: res.data.aiResponse }]);
        onMessageSent();
      } else {
        const res = await startConversation(userMsg.content);
        setActiveChatId(res.data.chatId);
        setMessages(prev => [...prev, { role: 'model', content: res.data.aiResponse }]);
        fetchConversations(); 
        onMessageSent();
      }
    } catch (error) {
      console.error('Message failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    onMessageSent(); // Clear videos
  };

  return (
    <div className="flex flex-1 gap-6 h-full relative">
      {/* LEFT: Conversation History Sidebar */}
      <div 
        className={`bg-surface-bright rounded-2xl border border-outline-variant/30 flex flex-col relative transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isSidebarOpen ? 'w-[250px] opacity-100' : 'w-0 border-none opacity-0'
        }`}
      >
        <div className="p-4 border-b border-outline-variant/30 shrink-0 w-full min-w-[250px]">
          <button 
            onClick={handleNewChat}
            className="w-full py-3 bg-primary text-white rounded-xl font-label text-[11px] uppercase tracking-wider font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 w-full min-w-[250px]">
          {conversations.map(chat => (
            <div 
              key={chat._id} 
              onClick={() => handleSelectChat(chat._id)}
              className={`p-3 rounded-lg cursor-pointer text-sm font-medium transition-colors line-clamp-2 ${activeChatId === chat._id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-outline-variant/10 text-on-surface'}`}
            >
              {chat.title}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center text-on-surface/50 text-xs mt-10 px-4 whitespace-normal">
              Your conversation history will appear here.
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Chat Interface */}
      <div className="flex-1 bg-surface-bright rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden relative shadow-sm min-w-0">
        <div className="p-4 border-b border-outline-variant/30 flex items-center gap-3 shrink-0 bg-white/50 backdrop-blur-sm z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors flex items-center justify-center"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <span className="material-symbols-outlined">{isSidebarOpen ? 'left_panel_close' : 'left_panel_open'}</span>
          </button>
          
          <div className="p-2 bg-primary/10 rounded-lg text-primary hidden sm:block shrink-0">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-headline font-bold text-on-surface truncate">MoneyMentor AI Advisor</h2>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 hidden sm:block truncate">Gemini 2.5 Flash Powered</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
          {messages.length === 0 && !loading && (
            <div className="m-auto text-center max-w-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="material-symbols-outlined text-4xl text-primary">forum</span>
              </div>
              <h3 className="text-xl font-bold font-headline mb-2">Hello there!</h3>
              <p className="text-on-surface/60 text-sm">
                I'm MoneyMentor. Ask me anything about budgeting, saving, or investing!
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                m.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-outline-variant/10 text-on-surface rounded-bl-none border border-outline-variant/20'
              }`}>
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
             <div className="flex justify-start">
               <div className="bg-outline-variant/10 text-on-surface/50 rounded-2xl rounded-bl-none p-4 py-3 flex gap-2 items-center border border-outline-variant/20">
                  <span className="w-2 h-2 bg-on-surface/30 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-on-surface/30 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></span>
                  <span className="w-2 h-2 bg-on-surface/30 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-outline-variant/30 bg-white/50 backdrop-blur-sm shrink-0">
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about budgeting, saving, or investing..."
              className="flex-1 min-w-0 bg-surface border border-outline-variant/30 rounded-xl px-5 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-6 bg-primary text-white rounded-xl shadow border-none hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
