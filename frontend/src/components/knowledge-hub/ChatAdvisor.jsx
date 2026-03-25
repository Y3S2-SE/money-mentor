import React, { useState, useEffect, useRef } from 'react';
import { startConversation, sendMessage, getAllConversations, getConversation } from '../../services/chatService';
import { getVideoSuggestions } from '../../services/youtubeService';

const ChatAdvisor = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Right sidebar
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

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
    setVideos([]);
    try {
      const res = await getConversation(chatId);
      setMessages(res.data.messages || []);
      
      // Fetch videos for this chat
      fetchVideos(chatId);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (chatId) => {
    setVideosLoading(true);
    try {
      const res = await getVideoSuggestions(chatId);
      setVideos(res.data.videos || []);
      setCacheStats(res.data.cacheStats);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setVideosLoading(false);
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
        fetchVideos(activeChatId); // update videos based on new keywords
      } else {
        const res = await startConversation(userMsg.content);
        setActiveChatId(res.data.chatId);
        setMessages(prev => [...prev, { role: 'model', content: res.data.aiResponse }]);
        fetchConversations(); // refresh sidebar list
        fetchVideos(res.data.chatId);
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
    setVideos([]);
    setCacheStats(null);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 bg-surface pb-4">
      
      {/* LEFT: Conversation History Sidebar */}
      <div className="w-1/4 bg-surface-bright rounded-2xl border border-outline-variant/30 flex flex-col hidden md:flex overflow-hidden relative">
        <div className="p-4 border-b border-outline-variant/30 shrink-0">
          <button 
            onClick={handleNewChat}
            className="w-full py-3 bg-primary text-white rounded-xl font-label text-[11px] uppercase tracking-wider font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
            <div className="text-center text-on-surface/50 text-xs mt-10 px-4">
              Your conversation history will appear here.
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Chat Interface */}
      <div className="flex-1 bg-surface-bright rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden relative shadow-sm">
        <div className="p-4 border-b border-outline-variant/30 flex items-center gap-3 shrink-0 bg-white/50 backdrop-blur-sm z-10">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-on-surface">MoneyMentor AI Advisor</h2>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface/50">Gemini 2.5 Flash Powered</p>
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
                {/* Extremely basic markdown parse just to handle newlines and rudimentary lists since Gemini returns plain text heavily */}
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
              className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-5 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
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

      {/* RIGHT: YouTube Video Suggestions */}
      <div className="w-[30%] bg-surface-bright rounded-2xl border border-outline-variant/30 hidden xl:flex flex-col relative overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant/30 bg-red-500/5 backdrop-blur-sm shrink-0 flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
            <span className="material-symbols-outlined">play_circle</span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-on-surface">Suggested Videos</h2>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface/50">Curated from YouTube</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeChatId ? (
            <div className="text-center text-on-surface/50 text-xs mt-10 px-4">
              Videos related to your financial discussion will automatically appear here.
            </div>
          ) : videosLoading ? (
             <div className="text-center p-8">
               <span className="material-symbols-outlined text-4xl text-on-surface/20 animate-spin">refresh</span>
             </div>
          ) : videos.length > 0 ? (
            videos.map(video => (
              <a 
                key={video.videoId} 
                href={video.url} 
                target="_blank" 
                rel="noreferrer"
                className="block bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:border-red-500/50 hover:shadow-md transition-all group"
              >
                <div className="aspect-video bg-outline-variant/10 relative overflow-hidden">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface/20">
                      <span className="material-symbols-outlined text-3xl">play_circle</span>
                    </div>
                  )}
                  {/* YouTube minimal overlay logo */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-white text-4xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all font-light" style={{fontVariationSettings: "'FILL' 1"}}>play_circle</span>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold leading-tight mb-1 line-clamp-2" title={video.title.replace(/&quot;/g, '"')}>{video.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'")}</h4>
                  <p className="text-[10px] text-on-surface/50">{video.channelName}</p>
                </div>
              </a>
            ))
          ) : (
            <div className="text-center text-on-surface/50 text-xs mt-10 px-4">
              No specific video suggestions found for this conversation yet. Ask another question!
            </div>
          )}
        </div>

        {/* Cache status monitor to show off the backend feature */}
        {cacheStats && (
           <div className="p-3 bg-surface border-t border-outline-variant/30 shrink-0 text-center">
             <p className="text-[9px] font-mono text-on-surface/40 uppercase tracking-wider">
               API: {cacheStats.fromApi} | CACHE: {cacheStats.fromCache} | QUOTA SAVED
             </p>
           </div>
        )}

      </div>
    </div>
  );
};

export default ChatAdvisor;
