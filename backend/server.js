import mongoose from "mongoose";
import http from 'http';
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { connectDB } from "./config/database.js";

const PORT = process.env.PORT;

const server = http.createServer(app);

// Connect MongoDB
connectDB();

// Start server 
server.listen(PORT, () => {
  logger.success(`server running on port ${PORT}`);
});

server.on("error", (err) => {
  logger.error("Server failed to start", err);
});

// Graceful shutdown 
const shutdown = () => {
    logger.info('Closing server...');
    server.close(async () => {
        try {
            await mongoose.connection.close();
            logger.warn('MongoDB closed');

            process.exit(0);
        } catch (err) {
            logger.error('MongoDB close error: ', err);
            process.exit(1);
        }
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);