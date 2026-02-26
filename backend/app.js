import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'test') {
    dotenv.config();
}

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import groupRoutes from "./routes/group.route.js";
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import transactionRoutes from "./routes/transaction.routes.js";
import gamificationRoutes from './routes/gamification.route.js';
import courseRoutes from './routes/course.route.js';
import chatRoutes from './routes/chat.route.js';
import youtubeRoutes from './routes/youtube.route.js';
import chatRoomRoutes from "./routes/chatRoom.route.js";


const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        environment: process.env.NODE_ENV || 'development',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        uptime: process.uptime(),
    });
});

// Routes
app.use("/api/groups", groupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use('/api/play', gamificationRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use("/api/chat-room", chatRoomRoutes);


// Error handling 
app.use(notFound);
app.use(errorHandler);

export default app;