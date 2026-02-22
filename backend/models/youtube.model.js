import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    videoId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: null },
    channelName: { type: String, default: '' },
    publishedAt: { type: String, default: null },
    url: { type: String, required: true }
}, { _id: false }); // no need for _id on embedded video objects

const youtubeCacheSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true,
        unique: true,       // one cache entry per keyword
        trim: true,
        lowercase: true     // normalize so "Budgeting" and "budgeting" hit the same cache
    },
    videos: {
        type: [videoSchema],
        default: []
    },
    cachedAt: {
        type: Date,
        default: Date.now   // used to check if cache is stale (7 days)
    }
});

// Index on keyword for fast lookups
youtubeCacheSchema.index({ keyword: 1 });

const YoutubeCache = mongoose.model('YoutubeCache', youtubeCacheSchema);

export default YoutubeCache;