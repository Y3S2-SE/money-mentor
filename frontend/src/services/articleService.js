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
    const data = JSON.parse(JSON.stringify(articleData)); // Deep clone

    // Remove empty thumbnail to satisfy backend .isURL() which fails on empty strings
    if (!data.thumbnail || data.thumbnail.trim() === '') {
        delete data.thumbnail;
    }

    // Clean up DB fields that shouldn't be in the payload
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;
    delete data.createdBy;
    delete data.wordCount;
    delete data.readTime;
    delete data.completions;

    return data;
};

/**
 * Create a new article (Admin only)
 */
export const createArticle = async (articleData) => {
    const response = await api.post('/articles/create', sanitizeArticleData(articleData));
    return response.data;
};

/**
 * Update an existing article (Admin only)
 */
export const updateArticle = async (id, articleData) => {
    const response = await api.put(`/articles/${id}`, sanitizeArticleData(articleData));
    return response.data;
};

/**
 * Delete an article (Admin only)
 */
export const deleteArticle = async (id) => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
};
