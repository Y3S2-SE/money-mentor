import { describe, it, expect } from '@jest/globals';
import YoutubeCache from '../../../models/youtube.model.js';

describe('YoutubeCache Model Unit Tests', () => {

    const validVideo = (overrides = {}) => ({
        videoId: 'dQw4w9WgXcQ',
        title: 'Budgeting for Beginners',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ...overrides
    });

    const makeCache = (overrides = {}) => new YoutubeCache({
        keyword: 'budgeting tips',
        ...overrides
    });

    // ── Default Values ─────────────────────────────────────────
    describe('Default Values', () => {
        it('should default videos to empty array', () => {
            const cache = makeCache();
            expect(cache.videos).toEqual([]);
        });

        it('should default cachedAt to current date', () => {
            const before = new Date();
            const cache = makeCache();
            const after = new Date();
            expect(cache.cachedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(cache.cachedAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    // ── Schema Validation ──────────────────────────────────────
    describe('Schema Validation', () => {
        it('should pass validation with valid keyword', async () => {
            const cache = makeCache();
            await expect(cache.validate()).resolves.toBeUndefined();
        });

        it('should fail validation without keyword', async () => {
            const cache = new YoutubeCache({});
            await expect(cache.validate()).rejects.toThrow();
        });

        it('should normalize keyword to lowercase', async () => {
            const cache = makeCache({ keyword: 'Budgeting For Beginners' });
            await cache.validate();
            expect(cache.keyword).toBe('budgeting for beginners');
        });

        it('should trim whitespace from keyword', async () => {
            const cache = makeCache({ keyword: '  saving money  ' });
            await cache.validate();
            expect(cache.keyword).toBe('saving money');
        });

        it('should pass validation with videos array', async () => {
            const cache = makeCache({ videos: [validVideo()] });
            await expect(cache.validate()).resolves.toBeUndefined();
        });
    });

    // ── Video Validation ───────────────────────────────────────
    describe('Video Validation', () => {
        it('should pass validation with all video fields', async () => {
            const cache = makeCache({
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
            await expect(cache.validate()).resolves.toBeUndefined();
            const video = cache.videos[0];
            expect(video.videoId).toBe('abc123');
            expect(video.title).toBe('How to Pay Off Debt Fast');
            expect(video.description).toBe('Learn debt payoff strategies.');
            expect(video.channelName).toBe('Finance Channel');
        });

        it('should fail validation when videoId is missing', async () => {
            const cache = makeCache({
                videos: [{ title: 'Tax Tips', url: 'https://youtube.com/watch?v=abc' }]
            });
            await expect(cache.validate()).rejects.toThrow();
        });

        it('should fail validation when video title is missing', async () => {
            const cache = makeCache({
                videos: [{ videoId: 'abc123', url: 'https://youtube.com/watch?v=abc123' }]
            });
            await expect(cache.validate()).rejects.toThrow();
        });

        it('should fail validation when video url is missing', async () => {
            const cache = makeCache({
                videos: [{ videoId: 'abc123', title: 'Tax Video' }]
            });
            await expect(cache.validate()).rejects.toThrow();
        });

        it('should default video description to empty string', async () => {
            const cache = makeCache({ videos: [validVideo({ description: undefined })] });
            await cache.validate();
            expect(cache.videos[0].description).toBe('');
        });

        it('should default video thumbnail to null', async () => {
            const cache = makeCache({ videos: [validVideo({ thumbnail: undefined })] });
            await cache.validate();
            expect(cache.videos[0].thumbnail).toBeNull();
        });

        it('should default video channelName to empty string', async () => {
            const cache = makeCache({ videos: [validVideo({ channelName: undefined })] });
            await cache.validate();
            expect(cache.videos[0].channelName).toBe('');
        });

        it('should default video publishedAt to null', async () => {
            const cache = makeCache({ videos: [validVideo({ publishedAt: undefined })] });
            await cache.validate();
            expect(cache.videos[0].publishedAt).toBeNull();
        });

        it('should accept multiple videos', async () => {
            const cache = makeCache({
                videos: [
                    validVideo({ videoId: 'vid1', title: 'Video 1', url: 'https://youtube.com/watch?v=vid1' }),
                    validVideo({ videoId: 'vid2', title: 'Video 2', url: 'https://youtube.com/watch?v=vid2' })
                ]
            });
            await expect(cache.validate()).resolves.toBeUndefined();
            expect(cache.videos).toHaveLength(2);
        });
    });

    // ── Staleness Logic ────────────────────────────────────────
    describe('Staleness Logic', () => {
        it('should allow setting a past cachedAt date', () => {
            const oldDate = new Date('2020-06-15');
            const cache = makeCache({ cachedAt: oldDate });
            expect(cache.cachedAt.toISOString()).toBe(oldDate.toISOString());
        });

        it('should be identifiable as stale when older than 7 days', () => {
            const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
            const cache = makeCache({ cachedAt: eightDaysAgo });
            const diffDays = (Date.now() - cache.cachedAt.getTime()) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBeGreaterThan(7);
        });

        it('should be identifiable as fresh when under 7 days old', () => {
            const cache = makeCache();
            const diffDays = (Date.now() - cache.cachedAt.getTime()) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBeLessThan(7);
        });

        it('should allow updating cachedAt to refresh the cache', () => {
            const oldDate = new Date('2020-01-01');
            const cache = makeCache({ cachedAt: oldDate });
            expect((Date.now() - cache.cachedAt.getTime()) / (1000 * 60 * 60 * 24)).toBeGreaterThan(7);

            cache.cachedAt = new Date();
            const diffDays = (Date.now() - cache.cachedAt.getTime()) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBeLessThan(1);
        });
    });

    // ── Keywords ───────────────────────────────────────────────
    describe('Keywords', () => {
        it('should store the keyword correctly', () => {
            const cache = makeCache({ keyword: 'investing basics' });
            expect(cache.keyword).toBe('investing basics');
        });

        it('should treat differently cased keywords as the same after normalization', async () => {
            const cache1 = makeCache({ keyword: 'investing' });
            const cache2 = makeCache({ keyword: 'INVESTING' });
            await cache1.validate();
            await cache2.validate();
            expect(cache1.keyword).toBe(cache2.keyword);
        });
    });
});