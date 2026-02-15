import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export const setupTestDB = async () => {
    try {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('NODE_ENV must be "test" to run tests.');
        }

        const dbUri = process.env.MONGODB_URI;
        if (!dbUri || !dbUri.toLowerCase().includes('test')) {
            throw new Error(`Test database URI must contain "test" in the name. Got: ${dbUri}`);
        }

        // Close any existing connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to test database:', mongoose.connection.name);
    } catch (error) {
        console.error('Test DB connection error:', error);
        throw error;
    }
};

export const teardownTestDB = async () => {
    try {

        if (!mongoose.connection || mongoose.connection.readyState === 0) {
            console.log('No active connection to tear down');
            return;
        }
        const dbName = mongoose.connection.name;
        if (!dbName || !dbName.toLowerCase().includes('test')) {
            throw new Error(`Refusing to drop non-test database: ${dbName}`);
        }

        console.log(`Dropping test database: ${dbName}`);

        // Drop test database to clean up
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        console.log('Test database disconnected and dropped');
    } catch (error) {
        console.error('Test DB teardown error:', error);
        throw error;
    }
};

export const clearTestDB = async () => {
    try {
        const dbName = mongoose.connection.name;
        if (!dbName.toLocaleLowerCase().includes('test')) {
            throw new Error(`Refusing to clear non-test database: ${dbName}`);
        }

        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
        console.log('Test database cleared');
    } catch (error) {
        console.error('Error clearing test database:', error);
        throw error;
    }
};