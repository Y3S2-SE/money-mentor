import Article from '../models/article.model.js';
import { uploadToCloudinary } from '../middleware/upload.middleware.js';

// @desc    Create a new article
// @route   POST /api/articles/create
// @access  Private/Admin
export const createArticle = async (req, res) => {
    try {
        let { title, summary, content, category, difficulty, thumbnail, pointsPerRead, isPublished } = req.body;

        // Handle file upload for thumbnail
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer, 'money_mentor/articles');
            thumbnail = uploadResult.secure_url;
        }

        // Multer might send regular fields as strings
        if (typeof content === 'string') {
            content = JSON.parse(content);
        }

        // Handle boolean conversion for isPublished (FormData sends strings)
        if (typeof isPublished === 'string') {
            isPublished = isPublished === 'true';
        }

        const article = await Article.create({
            title,
            summary,
            content,
            category,
            difficulty,
            thumbnail,
            pointsPerRead,
            isPublished: isPublished !== undefined ? isPublished : false,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Article created successfully',
            data: article
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create article',
            error: error.message
        });
    }
};

// @desc    Get all articles (published only for users, all for admins)
// @route   GET /api/articles
// @access  Private
export const getAllArticles = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, difficulty, search } = req.query;

        const query = {};

        // Non-admins only see published articles
        if (req.user.role !== 'admin') {
            query.isPublished = true;
        }

        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { summary: { $regex: search, $options: 'i' } }
            ];
        }

        const articles = await Article.find(query)
            .populate('createdBy', 'username')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        // Add isRead flag per article for the current user, hide other completions
        const mappedArticles = articles.map(article => {
            const articleObj = article.toObject();

            const userCompletion = articleObj.completions.find(
                (c) => c.user.toString() === req.user._id.toString()
            );

            articleObj.isRead = !!userCompletion;
            articleObj.userPointsEarned = userCompletion ? userCompletion.pointsEarned : null;
            articleObj.completedAt = userCompletion ? userCompletion.completedAt : null;

            // Remove full completions array — no other user IDs should leak
            delete articleObj.completions;

            return articleObj;
        });

        const total = await Article.countDocuments(query);

        res.status(200).json({
            success: true,
            data: mappedArticles,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch articles',
            error: error.message
        });
    }
};

// @desc    Get single article by ID
// @route   GET /api/articles/:id
// @access  Private
export const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id)
            .populate('createdBy', 'username');

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Non-admins cannot see drafts
        if (req.user.role !== 'admin' && !article.isPublished) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        const articleObj = article.toObject();

        // Add isRead flag for current user
        const userCompletion = articleObj.completions.find(
            (c) => c.user.toString() === req.user._id.toString()
        );
        articleObj.isRead = !!userCompletion;
        articleObj.userPointsEarned = userCompletion ? userCompletion.pointsEarned : null;

        // Hide other users' completions from non-admins
        if (req.user.role !== 'admin') {
            delete articleObj.completions;
        }

        res.status(200).json({ success: true, data: articleObj });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch article',
            error: error.message
        });
    }
};

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private/Admin
export const updateArticle = async (req, res) => {
    try {
        const allowedFields = ['title', 'summary', 'content', 'category', 'difficulty', 'thumbnail', 'pointsPerRead', 'isPublished'];

        const data = { ...req.body };

        // Handle file upload for thumbnail
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer, 'money_mentor/articles');
            data.thumbnail = uploadResult.secure_url;
        }

        // Multer might send regular fields as strings (especially from FormData)
        if (typeof data.content === 'string') {
            data.content = JSON.parse(data.content);
        }

        // Handle boolean conversion for isPublished (FormData sends strings)
        if (typeof data.isPublished === 'string') {
            data.isPublished = data.isPublished === 'true';
        }

        // Check if content is being updated to trigger wordCount/readTime logic
        if (data.content) {
            const article = await Article.findById(req.params.id);
            if (!article) {
                return res.status(404).json({ success: false, message: 'Article not found' });
            }

            // Apply updates
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    article[field] = data[field];
                }
            }

            const saved = await article.save();
            return res.status(200).json({
                success: true,
                message: 'Article updated successfully',
                data: saved
            });
        }

        const article = await Article.findByIdAndUpdate(
            req.params.id,
            data,
            { new: true, runValidators: false }
        );

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Article updated successfully',
            data: article
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update article',
            error: error.message
        });
    }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private/Admin
export const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        res.status(200).json({ success: true, message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete article',
            error: error.message
        });
    }
};

// @desc    Mark an article as read and earn points
// @route   POST /api/articles/complete
// @access  Private
export const completeArticle = async (req, res) => {
    try {
        const { articleId, timeSpentSeconds } = req.body;

        const article = await Article.findById(articleId);

        if (!article || !article.isPublished) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Duplicate check — mirrors course.controller.js pattern
        const alreadyCompleted = article.completions.find(
            (c) => c.user.toString() === req.user._id.toString()
        );
        if (alreadyCompleted) {
            return res.status(400).json({
                success: false,
                message: 'You have already earned points for this article',
                data: alreadyCompleted
            });
        }

        // Anti-gaming: user must spend at least 60% of the estimated read time
        const minimumSeconds = Math.floor(article.readTime * 60 * 0.6);
        if (timeSpentSeconds < minimumSeconds) {
            return res.status(400).json({
                success: false,
                message: `Reading too fast. Please spend at least ${minimumSeconds} seconds on this article to earn points.`
            });
        }

        const pointsEarned = article.pointsPerRead;

        // Push completion record (mirrors course completions push)
        article.completions.push({
            user: req.user._id,
            pointsEarned,
            timeSpentSeconds
        });
        await article.save();

        // Calculate new total article points for this user
        const allArticles = await Article.find({ 'completions.user': req.user._id });
        const totalArticlePoints = allArticles.reduce((total, a) => {
            const completion = a.completions.find(
                (c) => c.user.toString() === req.user._id.toString()
            );
            return total + (completion?.pointsEarned || 0);
        }, 0);

        res.status(200).json({
            success: true,
            message: `Great job! You earned ${pointsEarned} points for reading this article.`,
            data: {
                pointsEarned,
                totalArticlePoints
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to record article completion',
            error: error.message
        });
    }
};

// @desc    Get total points earned by logged-in user across all read articles
// @route   GET /api/articles/my-points
// @access  Private
export const getUserReadPoints = async (req, res) => {
    try {
        const articles = await Article.find({
            'completions.user': req.user._id
        });

        const totalPoints = articles.reduce((total, article) => {
            const completion = article.completions.find(
                (c) => c.user.toString() === req.user._id.toString()
            );
            return total + (completion?.pointsEarned || 0);
        }, 0);

        // Also return a list of completed article IDs (useful for the frontend "completed" badges)
        const completedArticleIds = articles.map(a => a._id);

        res.status(200).json({
            success: true,
            data: {
                totalPoints,
                completedArticleIds
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user read points',
            error: error.message
        });
    }
};
