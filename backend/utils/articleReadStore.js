// IT23218512 - hotfix/vuln-7

// vuln-7: server-side record of when a user opened an article.
// The article reward check uses this instead of trusting timeSpentSeconds sent by the client.

const readStarts = new Map();
const READ_START_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const keyFor = (userId, articleId) => `${userId}:${articleId}`;

// Record when the user opened the article.
// Keeps the first open time so the server's clock never runs shorter than the browser's timer.
export const startRead = (userId, articleId) => {
    const key = keyFor(userId, articleId);
    const existing = readStarts.get(key);
    if (existing && Date.now() < existing.expiresAt) return;

    readStarts.set(key, { startedAt: Date.now(), expiresAt: Date.now() + READ_START_TTL_MS });

    // Auto-cleanup; unref() so this timer never keeps the Node process alive
    setTimeout(() => readStarts.delete(key), READ_START_TTL_MS).unref();
};

// Seconds since the user opened the article, or null if it was never opened or has expired
export const getReadSeconds = (userId, articleId) => {
    const key = keyFor(userId, articleId);
    const entry = readStarts.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        readStarts.delete(key);
        return null;
    }

    return Math.floor((Date.now() - entry.startedAt) / 1000);
};

// Remove the entry once the reward has been given
export const endRead = (userId, articleId) => {
    readStarts.delete(keyFor(userId, articleId));
};
