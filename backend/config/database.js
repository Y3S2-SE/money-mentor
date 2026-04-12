import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
    try {
        const isPerformance = process.env.NODE_ENV === "performance";

        const dockerUri = process.env.MONGODB_DOCKER_URI;
        const atlasUri = process.env.MONGODB_URI;

        const useDockerInPerf =
            isPerformance && process.env.PERF_DB_TARGET === "docker" && dockerUri;

        const uri = useDockerInPerf ? dockerUri : atlasUri;

        let options = {};

        if (isPerformance) {
            if (useDockerInPerf) {
                // Docker/local DB profile
                options = {
                    maxPoolSize: 30, //80
                    minPoolSize: 5, //10
                    serverSelectionTimeoutMS: 5000, //10000
                    socketTimeoutMS: 20000, //60000
                    maxIdleTimeMS: 30000, //60000
                    connectTimeoutMS: 5000, //15000
                };
            } else {
                // Atlas profile
                options = {
                    maxPoolSize: 35,
                    minPoolSize: 5,
                    serverSelectionTimeoutMS: 8000,
                    socketTimeoutMS: 30000,
                    maxIdleTimeMS: 30000,
                    connectTimeoutMS: 10000,
                };
            }
        }

        if (Object.keys(options).length > 0) {
            await mongoose.connect(uri, options);
        } else {
            await mongoose.connect(uri);
        }

        const dbName = mongoose.connection.name;
        logger.success("MongoDB connected Successfully");
        logger.info(`Database: ${dbName}`);
        logger.info(`DB target: ${useDockerInPerf ? "docker" : "atlas/default"}`);
    } catch (error) {
        logger.error("MongoDB Connection Error:", error);
        process.exit(1);
    }
};

// Connection events
mongoose.connection.on("connected", () => {
    logger.success("Mongoose connecting");
});

mongoose.connection.on("error", (err) => {
    logger.error("Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
    logger.warn("Mongoose disconnected");
});