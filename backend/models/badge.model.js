import mongoose from 'mongoose';

const badgeDefinitionSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        name: {
            type: String,
            required: [true, 'Badge name is required'],
            trim: true,
            maxLenght: [50, 'Badge name cannot exceed 50 characters']
        },
        description: {
            type: String,
            required: [true, 'Badge description is required'],
            maxLenght: [150, 'Description cannot exceed 150 characters']
        },
        category: {
            type: String,
            enum: ['action', 'milestone', 'streak'],
            required: [true, 'Badge category is required']
        },
        xpReward: {
            type: Number,
            default: 0,
            min: [0, 'XP reward cannot be negative']
        },
        condition: {
            type: {
                type: String,
                enum: ['action', 'xp_total', 'streak_days', 'level'],
                required: true
            },
            threshold: {
                type: Number,
                default: null
            },
            actionKey: {
                type: String,
                default: null
            }
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// badgeDefinitionSchema.index({ key: 1 });
badgeDefinitionSchema.index({ category: 1, isActive: 1 });

const BadgeDefinition = mongoose.model('BadgeDefinition', badgeDefinitionSchema);

export default BadgeDefinition;