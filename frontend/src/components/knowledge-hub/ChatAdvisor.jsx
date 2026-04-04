import React, { useState } from 'react';
import ChatComponent from './ChatComponent';
import YouTubeComponent from './YouTubeComponent';

const ChatAdvisor = () => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 bg-surface pb-4">
      <ChatComponent 
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        onMessageSent={() => setRefreshTrigger(prev => prev + 1)}
      />
      
      <YouTubeComponent 
        activeChatId={activeChatId}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default ChatAdvisor;
