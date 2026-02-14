import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export const setupTestDB = async () => {
    try {
        // Close any existing connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to test database');
    } catch (error) {
        console.error('Test DB connection error:', error);
        throw error;
    }
};

export const teardownTestDB = async () => {
    try {
        // Drop test database to clean up
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        console.log('Test database disconnected and dropped');
    } catch (error) {
        console.error('Test DB teardown error:', error);
    }
};

export const clearTestDB = async () => {
    try {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    } catch (error) {
        console.error('Error clearing test database:', error);
    }
};