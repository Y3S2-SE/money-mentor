import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Logs the database name for clarity
        const dbName = mongoose.connection.name;
        logger.success('MongoDB connected Successfully');
        logger.info(`Database: ${dbName}`);
    } catch (error) {
        logger.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

//Connection events
mongoose.connection.on('connected', () => {
    logger.success('Mongoose connecting');
});

mongoose.connection.on('error', (err) => {
    logger.error('Mongoose error:', err);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected');
});