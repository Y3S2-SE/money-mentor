import mongoose from 'mongoose';

/**
 * Recursively walks a BlockNote/TipTap content JSON tree and collects all text.
 * For plain-string content fields we also count directly.
 */
function extractTextFromContent(node) {
    if (!node) return '';
    if (typeof node === 'string') return node;

    let text = '';

    if (node.text && typeof node.text === 'string') {
        text += node.text + ' ';
    }

    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            text += extractTextFromContent(child);
        }
    }

    if (Array.isArray(node)) {
        for (const child of node) {
            text += extractTextFromContent(child);
        }
    }

    return text;
}

const completionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pointsEarned: {
        type: Number,
        required: true
    },
    timeSpentSeconds: {
        type: Number,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Article title is required'],
            trim: true,
            minLength: [3, 'Title must be at least 3 characters'],
            maxLength: [150, 'Title cannot exceed 150 characters']
        },
        summary: {
            type: String,
            required: [true, 'Article summary is required'],
            trim: true,
            maxLength: [300, 'Summary cannot exceed 300 characters']
        },
        // Stored as BlockNote / TipTap JSON. Allow any nested structure.
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'Article content is required']
        },
        wordCount: {
            type: Number,
            default: 0,
            min: 0
        },
        // Auto-calculated: Math.ceil(wordCount / 200)
        readTime: {
            type: Number,
            default: 1,
            min: 1
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'],
            default: 'general'
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        },
        thumbnail: {
            type: String,
            default: null
        },
        pointsPerRead: {
            type: Number,
            default: 15,
            min: [1, 'Points per read must be at least 1'],
            max: [100, 'Points per read cannot exceed 100']
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Track which users have read this article (mirrors course.model.js completions)
        completions: [completionSchema]
    },
    {
        timestamps: true
    }
);

// Auto-calculate wordCount and readTime from content before saving
articleSchema.pre('save', function () {
    if (this.isModified('content') && this.content) {
        const rawText = extractTextFromContent(this.content);
        const words = rawText.trim().split(/\s+/).filter(w => w.length > 0);
        this.wordCount = words.length;
        this.readTime = Math.max(1, Math.ceil(this.wordCount / 200));
    }
});

const Article = mongoose.model('Article', articleSchema);

export default Article;
