import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    startConversation,
    sendMessage,
    getAllConversations,
    getConversation,
    deleteConversation
} from '../controllers/chat.controller.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

router.post('/', startConversation);             // Start new conversation
router.post('/:id/message', sendMessage);        // Continue existing conversation
router.get('/', getAllConversations);             // List all user's conversations
router.get('/:id', getConversation);             // Get one conversation with messages
router.delete('/:id', deleteConversation);       // Delete a conversation

export default router;