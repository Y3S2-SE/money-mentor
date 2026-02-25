import Chat from '../models/chat.model.js';
import YoutubeCache from '../models/youtube.model.js';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const MAX_RESULTS_PER_KEYWORD = 2;   // 2 videos per keyword
const CACHE_TTL_DAYS = 7;            // refresh cache after 7 days

// Check if a cached entry is stale (older than 7 days)
const isStale = (cachedAt) => {
    const now = new Date();
    const diffMs = now - new Date(cachedAt);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > CACHE_TTL_DAYS;
};

// Fetch videos from YouTube API for a single keyword and cache the result
const fetchAndCache = async (keyword) => {
    const response = await fetch(
        `${YOUTUBE_API_URL}?part=snippet&type=video&maxResults=${MAX_RESULTS_PER_KEYWORD}&q=${encodeURIComponent(keyword)}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await response.json();

    if (!data.items || data.items.length === 0) return [];

    const videos = data.items
        .filter(item => item.id?.videoId)
        .map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description || '',
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null,
            channelName: item.snippet.channelTitle || '',
            publishedAt: item.snippet.publishedAt || null,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));

    // Save or update cache for this keyword
    await YoutubeCache.findOneAndUpdate(
        { keyword: keyword.toLowerCase().trim() },
        { videos, cachedAt: new Date() },
        { upsert: true, new: true }
    );

    return videos;
};

// @desc    Get YouTube video suggestions based on chat's current keywords
// @route   GET /api/youtube/search?chatId=xxx
// @access  Private
export const getVideoSuggestions = async (req, res) => {
    try {
        const { chatId } = req.query;

        if (!chatId) {
            return res.status(400).json({ success: false, message: 'chatId is required' });
        }

        // Fetch chat and verify ownership
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (chat.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
        }

        if (!chat.youtubeKeywords || chat.youtubeKeywords.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No keywords available yet — send a message first',
                data: { keywords: [], videos: [], cacheStats: { fromCache: 0, fromApi: 0 } }
            });
        }

        const allVideos = [];
        const seenVideoIds = new Set();
        const cacheStats = { fromCache: 0, fromApi: 0 };

        // Process each keyword — check cache first, fall back to API
        for (const keyword of chat.youtubeKeywords) {
            const normalizedKeyword = keyword.toLowerCase().trim();
            const cached = await YoutubeCache.findOne({ keyword: normalizedKeyword });

            let videos;

            if (cached && !isStale(cached.cachedAt)) {
                // Cache hit and still fresh — use cached videos
                videos = cached.videos;
                cacheStats.fromCache++;
            } else {
                // Cache miss or stale — fetch from YouTube API and save
                try {
                    videos = await fetchAndCache(normalizedKeyword);
                    cacheStats.fromApi++;
                } catch {
                    // If YouTube API fails for this keyword, use stale cache if available
                    videos = cached ? cached.videos : [];
                }
            }

            // Deduplicate videos across all keywords
            for (const video of videos) {
                if (!seenVideoIds.has(video.videoId)) {
                    seenVideoIds.add(video.videoId);
                    allVideos.push(video);
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                keywords: chat.youtubeKeywords,
                videos: allVideos,
                cacheStats // useful for debugging — shows how many came from cache vs API
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video suggestions',
            error: error.message
        });
    }
};