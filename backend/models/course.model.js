import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
    },
    options: {
        type: [String],
        validate: {
            validator: (arr) => arr.length >= 2 && arr.length <= 6,
            message: 'Each question must have between 2 and 6 options'
        },
        required: true
    },
    correctAnswerIndex: {
        type: Number,
        required: [true, 'Correct answer index is required'],
        min: 0
    },
    explanation: {
        type: String,
        trim: true
    },
    points: {
        type: Number,
        default: 10,
        min: 1
    }
});

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
            minLength: [3, 'Title must be at least 3 characters'],
            maxLength: [100, 'Title cannot exceed 100 characters']
        },
        description: {
            type: String,
            required: [true, 'Course description is required'],
            trim: true,
            maxLength: [500, 'Description cannot exceed 500 characters']
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
            type: String, // URL to image
            default: null
        },
        questions: {
            type: [questionSchema],
            validate: {
                validator: (arr) => arr.length >= 1,
                message: 'A course must have at least one question'
            }
        },
        totalPoints: {
            type: Number,
            default: 0
        },
        passingScore: {
            type: Number,
            default: 70, // percentage
            min: 0,
            max: 100
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
        // Track which users completed the course and their scores
        completions: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                score: Number,         // percentage
                pointsEarned: Number,
                completedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

// Auto-calculate totalPoints from questions before saving
courseSchema.pre('save', function () {
    if (this.questions && this.questions.length > 0) {
        this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
    }
});

const Course = mongoose.model('Course', courseSchema);

export default Course;