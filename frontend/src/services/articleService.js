import api from './api';

/**
 * Fetch all articles with optional filters
 * @param {Object} params - { category, search, page, limit }
 */
export const getAllArticles = async (params = {}) => {
    const response = await api.get('/articles', { params });
    return response.data;
};

/**
 * Fetch a single article by ID
 * @param {string} id 
 */
export const getArticleById = async (id) => {
    const response = await api.get(`/articles/${id}`);
    return response.data;
};

/**
 * Record article completion and earn points
 * @param {string} articleId 
 * @param {number} timeSpentSeconds 
 */
export const completeArticle = async (articleId, timeSpentSeconds) => {
    const response = await api.post('/articles/complete', { articleId, timeSpentSeconds });
    return response.data;
};

/**
 * Get user's total article points and completed ID list
 */
export const getUserReadPoints = async () => {
    const response = await api.get('/articles/my-points');
    return response.data;
};

// --- Admin Services ---

/**
 * Helper to sanitize article data for strict backend validation
 */
const sanitizeArticleData = (articleData) => {
    // 1. We must NOT use JSON.stringify as it strips out File objects (thumbnails)
    const data = { ...articleData };

    // 2. Remove empty thumbnail to satisfy backend .isURL() which fails on empty strings.
    // If it's a File object (from upload), we also bypass this string check.
    if (!data.thumbnail || (typeof data.thumbnail === 'string' && data.thumbnail.trim() === '')) {
        delete data.thumbnail;
    }

    // 3. Clean up DB fields that shouldn't be in the payload
    const cleanData = { ...data };
    delete cleanData._id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    delete cleanData.__v;
    delete cleanData.createdBy;
    delete cleanData.wordCount;
    delete cleanData.readTime;
    delete cleanData.completions;

    return cleanData;
};

/**
 * Create a new article (Admin only)
 */
export const createArticle = async (articleData) => {
    const data = sanitizeArticleData(articleData);
    const formData = new FormData();

    Object.keys(data).forEach(key => {
        if (key === 'content') {
            formData.append(key, JSON.stringify(data[key]));
        } else if (data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });

    const response = await api.post('/articles/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Update an existing article (Admin only)
 */
export const updateArticle = async (id, articleData) => {
    const data = sanitizeArticleData(articleData);
    const formData = new FormData();

    Object.keys(data).forEach(key => {
        if (key === 'content') {
            formData.append(key, JSON.stringify(data[key]));
        } else if (data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });

    const response = await api.put(`/articles/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Delete an article (Admin only)
 */
export const deleteArticle = async (id) => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
};
