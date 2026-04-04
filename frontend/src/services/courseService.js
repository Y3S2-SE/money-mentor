import api from './api';

export const getCourses = async (params = {}) => {
    const response = await api.get('/course', { params });
    return response.data;
};

export const getCourseById = async (id) => {
    const response = await api.get(`/course/${id}`);
    return response.data;
};

export const submitCourseAnswers = async (id, answers) => {
    const response = await api.post(`/course/${id}/submit`, { answers });
    return response.data;
};

// Helper to perfectly align the frontend UI payload with the very strict backend rules
const sanitizeCourseData = (courseData) => {
    const data = JSON.parse(JSON.stringify(courseData)); // Deep clone
    
    // 1. Backend strict isURL() fails on empty strings (optional checks undefined, not empty strings).
    // So we must fully remove it if it's empty so validation bypasses it.
    if (!data.thumbnail || data.thumbnail.trim() === '') {
        delete data.thumbnail;
    }

    // 2. 'crypto' exists in our frontend UI but not in the original backend enum. Map to general.
    if (data.category === 'crypto') {
        data.category = 'general';
    }

    // 3. When updating, questions array contains `_id` fields. The strict validation 
    // might reject the payload if subdocuments contain un-whitelisted fields.
    if (data.questions && Array.isArray(data.questions)) {
        data.questions = data.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswerIndex: Number(q.correctAnswerIndex ?? 0),
            explanation: q.explanation,
            points: q.points
        }));
    }

    // Ensure we don't send any top-level DB fields that shouldn't be patched directly
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;

    return data;
};

// Admin endpoints
export const createCourse = async (courseData) => {
    const response = await api.post('/course/create', sanitizeCourseData(courseData));
    return response.data;
};

export const updateCourse = async (id, courseData) => {
    const response = await api.put(`/course/${id}`, sanitizeCourseData(courseData));
    return response.data;
};

export const deleteCourse = async (id) => {
    const response = await api.delete(`/course/${id}`);
    return response.data;
};
