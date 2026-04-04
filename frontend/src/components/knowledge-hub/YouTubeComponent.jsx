import React, { useState, useEffect } from 'react';
import { getVideoSuggestions } from '../../services/youtubeService';

const YouTubeComponent = ({ activeChatId, refreshTrigger }) => {
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

  useEffect(() => {
    if (activeChatId) {
      fetchVideos(activeChatId);
    } else {
      setVideos([]);
      setCacheStats(null);
    }
  }, [activeChatId, refreshTrigger]);

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

  return (
    <div className="w-[30%] bg-surface-bright rounded-2xl border border-outline-variant/30 hidden xl:flex flex-col relative overflow-hidden shadow-sm h-full">
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
              className="block bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:border-red-500/50 hover:shadow-md transition-all group shrink-0"
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
  );
};

export default YouTubeComponent;
