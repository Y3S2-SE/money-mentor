// IT23218512 - hotfix/vuln-6

import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'test') {
    dotenv.config();
}

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import groupRoutes from "./routes/group.route.js";
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import transactionRoutes from "./routes/transaction.routes.js";
import gamificationRoutes from './routes/gamification.route.js';
import courseRoutes from './routes/course.route.js';
import chatRoutes from './routes/chat.route.js';
import youtubeRoutes from './routes/youtube.route.js';
import dashboardRoutes from "./routes/dashboard.routes.js";
import chatRoomRoutes from "./routes/chatRoom.route.js";
import articleRoutes from './routes/article.route.js';
// vuln-6: loginLimiter is a stricter limit for login only
import { apiLimiter, authLimiter, loginLimiter } from './middleware/rateLimiter.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

//app.use('/api', apiLimiter);
app.post('/api/auth/google', authLimiter, (req, res, next) => {
    const origin = req.get('Origin');

    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            success: false,
            code: 'GOOGLE_ORIGIN_INVALID',
            message: 'Google sign-in request is not allowed'
        });
    }

    if (req.get('X-Requested-With') !== 'XmlHttpRequest') {
        return res.status(403).json({
            success: false,
            code: 'GOOGLE_REQUEST_INVALID',
            message: 'Google sign-in request is not allowed'
        });
    }

    // GIS popup code exchange uses the calling page's origin.
    req.googleRedirectUri = origin;
    next();
});

// vuln-6: login gets its own stricter per-IP limit (20 / 15 min), separate from registration
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', authLimiter);

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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat-room", chatRoomRoutes);
app.use('/api/articles', articleRoutes);

// Error handling 
app.use(notFound);
app.use(errorHandler);

export default app;
