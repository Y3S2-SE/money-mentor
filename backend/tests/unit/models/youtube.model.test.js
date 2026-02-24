import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import YoutubeCache from '../../../models/youtube.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup/testSetup.js';

describe('YoutubeCache Model Unit Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  // Reusable valid video object
  const validVideo = (overrides = {}) => ({
    videoId: 'dQw4w9WgXcQ',
    title: 'Budgeting for Beginners',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ...overrides
  });

  // ── Cache Creation ─────────────────────────────────────────────
  describe('Cache Creation', () => {
    it('should create a valid cache entry', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'budgeting for beginners',
        videos: [validVideo()]
      });

      expect(cache.keyword).toBe('budgeting for beginners');
      expect(cache.videos).toHaveLength(1);
      expect(cache.cachedAt).toBeDefined();
    });

    it('should fail without keyword', async () => {
      await expect(YoutubeCache.create({ videos: [] })).rejects.toThrow();
    });

    it('should default to empty videos array', async () => {
      const cache = await YoutubeCache.create({ keyword: 'investing basics' });
      expect(cache.videos).toEqual([]);
    });

    it('should set cachedAt to current date by default', async () => {
      const before = new Date();
      const cache = await YoutubeCache.create({ keyword: 'compound interest' });
      const after = new Date();

      expect(cache.cachedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(cache.cachedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should fail with duplicate keyword', async () => {
      await YoutubeCache.create({ keyword: 'budgeting tips' });
      await expect(YoutubeCache.create({ keyword: 'budgeting tips' })).rejects.toThrow();
    });

    it('should normalize keyword to lowercase', async () => {
      const cache = await YoutubeCache.create({ keyword: 'Budgeting For Beginners' });
      expect(cache.keyword).toBe('budgeting for beginners');
    });

    it('should treat same keyword with different casing as duplicate after normalization', async () => {
      await YoutubeCache.create({ keyword: 'investing' });
      await expect(YoutubeCache.create({ keyword: 'INVESTING' })).rejects.toThrow();
    });

    it('should trim whitespace from keyword', async () => {
      const cache = await YoutubeCache.create({ keyword: '  saving money  ' });
      expect(cache.keyword).toBe('saving money');
    });
  });

  // ── Videos ─────────────────────────────────────────────────────
  describe('Videos', () => {
    it('should save a video with all fields', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'debt management',
        videos: [{
          videoId: 'abc123',
          title: 'How to Pay Off Debt Fast',
          description: 'Learn debt payoff strategies.',
          thumbnail: 'https://img.youtube.com/vi/abc123/mqdefault.jpg',
          channelName: 'Finance Channel',
          publishedAt: '2024-01-01T00:00:00Z',
          url: 'https://www.youtube.com/watch?v=abc123'
        }]
      });

      const video = cache.videos[0];
      expect(video.videoId).toBe('abc123');
      expect(video.title).toBe('How to Pay Off Debt Fast');
      expect(video.description).toBe('Learn debt payoff strategies.');
      expect(video.channelName).toBe('Finance Channel');
      expect(video.publishedAt).toBe('2024-01-01T00:00:00Z');
      expect(video.url).toBe('https://www.youtube.com/watch?v=abc123');
    });

    it('should fail when video videoId is missing', async () => {
      await expect(YoutubeCache.create({
        keyword: 'taxes explained',
        videos: [{ title: 'Tax Tips', url: 'https://youtube.com/watch?v=abc' }]
      })).rejects.toThrow();
    });

    it('should fail when video title is missing', async () => {
      await expect(YoutubeCache.create({
        keyword: 'taxes explained',
        videos: [{ videoId: 'abc123', url: 'https://youtube.com/watch?v=abc123' }]
      })).rejects.toThrow();
    });

    it('should fail when video url is missing', async () => {
      await expect(YoutubeCache.create({
        keyword: 'taxes explained',
        videos: [{ videoId: 'abc123', title: 'Tax Video' }]
      })).rejects.toThrow();
    });

    it('should default video description to empty string', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'emergency fund',
        videos: [validVideo({ description: undefined })]
      });
      expect(cache.videos[0].description).toBe('');
    });

    it('should default video thumbnail to null', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'emergency fund',
        videos: [validVideo({ thumbnail: undefined })]
      });
      expect(cache.videos[0].thumbnail).toBeNull();
    });

    it('should default video channelName to empty string', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'emergency fund',
        videos: [validVideo({ channelName: undefined })]
      });
      expect(cache.videos[0].channelName).toBe('');
    });

    it('should default video publishedAt to null', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'emergency fund',
        videos: [validVideo({ publishedAt: undefined })]
      });
      expect(cache.videos[0].publishedAt).toBeNull();
    });

    it('should save multiple videos', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'financial planning',
        videos: [
          validVideo({ videoId: 'vid1', title: 'Video 1', url: 'https://youtube.com/watch?v=vid1' }),
          validVideo({ videoId: 'vid2', title: 'Video 2', url: 'https://youtube.com/watch?v=vid2' })
        ]
      });
      expect(cache.videos).toHaveLength(2);
    });

    it('should not add _id to embedded video objects', async () => {
      const cache = await YoutubeCache.create({
        keyword: 'savings account',
        videos: [validVideo()]
      });
      expect(cache.videos[0]._id).toBeUndefined();
    });
  });

  // ── Cache Update (upsert pattern) ──────────────────────────────
  describe('Cache Update', () => {
    it('should update videos and cachedAt on upsert', async () => {
      await YoutubeCache.create({
        keyword: 'budgeting',
        videos: [validVideo({ videoId: 'old1', title: 'Old Video', url: 'https://youtube.com/watch?v=old1' })],
        cachedAt: new Date('2020-01-01')
      });

      const newVideos = [validVideo({ videoId: 'new1', title: 'New Video', url: 'https://youtube.com/watch?v=new1' })];
      const updated = await YoutubeCache.findOneAndUpdate(
        { keyword: 'budgeting' },
        { videos: newVideos, cachedAt: new Date() },
        { upsert: true, new: true }
      );

      expect(updated.videos[0].title).toBe('New Video');
      expect(updated.cachedAt.getTime()).toBeGreaterThan(new Date('2020-01-01').getTime());
    });

    it('should create a new entry if keyword does not exist on upsert', async () => {
      const result = await YoutubeCache.findOneAndUpdate(
        { keyword: 'new keyword' },
        { videos: [validVideo()], cachedAt: new Date() },
        { upsert: true, new: true }
      );

      expect(result.keyword).toBe('new keyword');
      expect(result.videos).toHaveLength(1);
    });
  });

  // ── Staleness Check ────────────────────────────────────────────
  describe('Staleness (cachedAt)', () => {
    it('should allow setting a past cachedAt date', async () => {
      const oldDate = new Date('2020-06-15');
      const cache = await YoutubeCache.create({
        keyword: 'old cache',
        cachedAt: oldDate
      });
      expect(cache.cachedAt.toISOString()).toBe(oldDate.toISOString());
    });

    it('should be identifiable as stale when older than 7 days', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const cache = await YoutubeCache.create({
        keyword: 'stale keyword',
        cachedAt: eightDaysAgo
      });

      const diffDays = (Date.now() - cache.cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(7);
    });

    it('should be identifiable as fresh when under 7 days old', async () => {
      const cache = await YoutubeCache.create({ keyword: 'fresh keyword' });

      const diffDays = (Date.now() - cache.cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThan(7);
    });
  });
});