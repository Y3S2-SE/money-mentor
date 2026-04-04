import React, { useState } from 'react';
import ChatComponent from './ChatComponent';
import YouTubeComponent from './YouTubeComponent';
import useSwipeTabs from '../../hooks/useSwipeTabs';

const ChatAdvisor = () => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'videos'

  const tabs = ['chat', 'videos'];
  const { handleTouchStart, handleTouchEnd } = useSwipeTabs(tabs, activeTab, setActiveTab);

  return (
    <div
      className="flex flex-col h-[calc(100vh-140px)] bg-surface pb-4 relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Tab Switcher */}
      <div className="flex xl:hidden mb-4 bg-surface-container/50 rounded-2xl p-1.5 border border-outline-variant/30 mx-4">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">forum</span>
          Chat
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'videos' ? 'bg-red-500 text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          Videos
        </button>
      </div>

      <div className="flex flex-1 gap-6 px-4 md:px-0 h-full relative overflow-hidden">
        <div className={`flex-1 h-full ${activeTab === 'chat' ? 'flex' : 'hidden xl:flex'}`}>
          <ChatComponent
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            onMessageSent={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>

        <div className={`xl:w-[320px] 2xl:w-[380px] h-full ${activeTab === 'videos' ? 'flex' : 'hidden xl:flex'}`}>
          <YouTubeComponent
            activeChatId={activeChatId}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatAdvisor;
