import mongoose from "mongoose";
import http from 'http';
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { connectDB } from "./config/database.js";

const PORT = process.env.PORT || 5080;

const server = http.createServer(app);

// Connect MongoDB first, then start server
const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            logger.success(`server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        })
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start server 
startServer();

server.on("error", (err) => {
  logger.error("Server error", err);
});

// Graceful shutdown 
const shutdown = () => {
    logger.info('Shutting down gracefully...');

    server.close(async () => {
        try {
            await mongoose.connection.close();
            logger.warn('MongoDB connection closed');
            process.exit(0);
        } catch (err) {
            logger.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);