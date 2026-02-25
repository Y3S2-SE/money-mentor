import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['user', 'model'],
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        title: {
            type: String,
            default: 'New Conversation',
            maxLength: 60
        },
        messages: {
            type: [messageSchema],
            default: []
        },
        // AI-generated keywords based on conversation topic for YouTube suggestions
        youtubeKeywords: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;