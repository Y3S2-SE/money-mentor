import { GoogleGenerativeAI } from '@google/generative-ai';
import Chat from '../models/chat.model.js';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// System prompt — tells Gemini to act as a financial assistant
const SYSTEM_PROMPT = `You are MoneyMentor, a knowledgeable and friendly personal finance assistant. 
You help users with budgeting, saving, investing, debt management, taxes, and general financial planning.
Keep responses clear, practical, and easy to understand. 
Always encourage healthy financial habits.
If a question is outside the scope of personal finance, politely redirect the user back to financial topics.
Format responses in plain text without markdown symbols like **, ##, or bullet dashes — use clean numbered lists or plain sentences instead.`;

// Helper — generate YouTube keywords from conversation (separate call, safely handled)
const generateKeywords = async (messages) => {
    try {
        const conversationSummary = messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        const keywordPrompt = `Based on this financial conversation, generate 3 to 5 short YouTube search keywords that would help the user learn more about the topics discussed. Return only a JSON array of strings, nothing else. Example: ["budgeting for beginners", "50 30 20 rule explained"]
        
Conversation:
${conversationSummary}`;

        const result = await model.generateContent(keywordPrompt);
        const text = result.response.text().trim();

        // Strip markdown code fences if Gemini wraps it
        const clean = text.replace(/```json|```/g, '').trim();
        const keywords = JSON.parse(clean);

        return Array.isArray(keywords) ? keywords : [];
    } catch {
        return []; // silently fail — keywords are not critical
    }
};

// @desc    Start a new conversation
// @route   POST /api/chat
// @access  Private
export const startConversation = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Start Gemini chat with system prompt baked into history
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood! I am MoneyMentor, your personal finance assistant. How can I help you today?' }]
                }
            ]
        });

        const result = await chat.sendMessage(message);
        const aiResponse = result.response.text();

        // Auto-generate title from first user message (trim to 60 chars)
        const title = message.length > 60 ? message.substring(0, 57) + '...' : message;

        const messages = [
            { role: 'user', content: message },
            { role: 'model', content: aiResponse }
        ];

        // Generate YouTube keywords based on this first exchange
        const youtubeKeywords = await generateKeywords(messages);

        // Save conversation to DB
        const newChat = await Chat.create({
            user: req.user._id,
            title,
            messages,
            youtubeKeywords
        });

        res.status(201).json({
            success: true,
            message: 'Conversation started',
            data: {
                chatId: newChat._id,
                title: newChat.title,
                aiResponse,
                youtubeKeywords,
                createdAt: newChat.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to start conversation',
            error: error.message
        });
    }
};

// @desc    Send a message in an existing conversation
// @route   POST /api/chat/:id/message
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const chatDoc = await Chat.findById(req.params.id);

        if (!chatDoc) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Make sure this conversation belongs to the logged-in user
        if (chatDoc.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
        }

        // Rebuild Gemini chat history from saved messages
        // System prompt + acknowledgement first, then all previous messages
        const history = [
            {
                role: 'user',
                parts: [{ text: SYSTEM_PROMPT }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood! I am MoneyMentor, your personal finance assistant. How can I help you today?' }]
            },
            ...chatDoc.messages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }))
        ];

        const chat = model.startChat({ history });

        const result = await chat.sendMessage(message);
        const aiResponse = result.response.text();

        // Append both new messages to the conversation
        chatDoc.messages.push({ role: 'user', content: message });
        chatDoc.messages.push({ role: 'model', content: aiResponse });

        // Regenerate YouTube keywords based on the full updated conversation
        chatDoc.youtubeKeywords = await generateKeywords(chatDoc.messages);

        await chatDoc.save();

        res.status(200).json({
            success: true,
            data: {
                chatId: chatDoc._id,
                aiResponse,
                youtubeKeywords: chatDoc.youtubeKeywords
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// @desc    Get all conversations for logged-in user
// @route   GET /api/chat
// @access  Private
export const getAllConversations = async (req, res) => {
    try {
        const chats = await Chat.find({ user: req.user._id })
            .select('-messages') // don't send full message history in list view
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: chats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations',
            error: error.message
        });
    }
};

// @desc    Get a single conversation with full messages
// @route   GET /api/chat/:id
// @access  Private
export const getConversation = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (chat.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
        }

        res.status(200).json({ success: true, data: chat });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversation',
            error: error.message
        });
    }
};

// @desc    Delete a conversation
// @route   DELETE /api/chat/:id
// @access  Private
export const deleteConversation = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (chat.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this conversation' });
        }

        await Chat.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete conversation',
            error: error.message
        });
    }
};