import Course from "../models/course.model.js";
import User from "../models/user.model.js";

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res) => {
    try {
        const { title, description, category, difficulty, thumbnail, questions, passingScore } = req.body;

        const course = await Course.create({
            title,
            description,
            category,
            difficulty,
            thumbnail,
            questions,
            passingScore,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message
        });
    }
};

// @desc    Get all courses (published only for users, all for admins)
// @route   GET /api/courses
// @access  Private
export const getAllCourses = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, difficulty, search } = req.query;

        const query = {};

        // Non-admins only see published courses
        if (req.user.role !== 'admin') {
            query.isPublished = true;
        }

        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const courses = await Course.find(query)
            .select('-questions.correctAnswerIndex -questions.explanation -completions') // hide answers & completions in list view
            .populate('createdBy', 'username')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Course.countDocuments(query);

        res.status(200).json({
            success: true,
            data: courses,
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
            message: 'Failed to fetch courses',
            error: error.message
        });
    }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Private
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('createdBy', 'username');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Hide correct answers from non-admins
        if (req.user.role !== 'admin') {
            if (!course.isPublished) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
            const sanitized = course.toObject();
            sanitized.questions = sanitized.questions.map(({ correctAnswerIndex, explanation, ...rest }) => rest);
            return res.status(200).json({ success: true, data: sanitized });
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course',
            error: error.message
        });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
export const updateCourse = async (req, res) => {
    try {
        const { title, description, category, difficulty, thumbnail, questions, passingScore, isPublished } = req.body;

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { title, description, category, difficulty, thumbnail, questions, passingScore, isPublished },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error.message
        });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error.message
        });
    }
};

// @desc    Submit course answers & earn points
// @route   POST /api/courses/:id/submit
// @access  Private
export const submitCourse = async (req, res) => {
    try {
        const { answers } = req.body; // array of selected option indexes, e.g. [0, 2, 1]

        const course = await Course.findById(req.params.id);

        if (!course || !course.isPublished) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if user already completed this course
        const alreadyCompleted = course.completions.find(
            (c) => c.user.toString() === req.user._id.toString()
        );
        if (alreadyCompleted) {
            return res.status(400).json({
                success: false,
                message: 'You have already completed this course',
                data: alreadyCompleted
            });
        }

        if (!Array.isArray(answers) || answers.length !== course.questions.length) {
            return res.status(400).json({
                success: false,
                message: `Please answer all ${course.questions.length} questions`
            });
        }

        // Grade the answers
        let pointsEarned = 0;
        const results = course.questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswerIndex;
            if (isCorrect) pointsEarned += q.points;
            return {
                question: q.question,
                selectedIndex: answers[i],
                correctIndex: q.correctAnswerIndex,
                isCorrect,
                explanation: q.explanation || null,
                points: isCorrect ? q.points : 0
            };
        });

        const scorePercent = Math.round((pointsEarned / course.totalPoints) * 100);
        const passed = scorePercent >= course.passingScore;

        // Record completion
        course.completions.push({
            user: req.user._id,
            score: scorePercent,
            pointsEarned: passed ? pointsEarned : 0 // only award points if passed
        });
        await course.save();

        // Add points to user (only if passed)
        // NOTE: You'll need to add a `points` field to the User model
        if (passed) {
            await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } });
        }

        res.status(200).json({
            success: true,
            message: passed ? `Congratulations! You passed and earned ${pointsEarned} points!` : 'You did not pass. Review and try again.',
            data: {
                score: scorePercent,
                passed,
                pointsEarned: passed ? pointsEarned : 0,
                passingScore: course.passingScore,
                results
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to submit course',
            error: error.message
        });
    }
};