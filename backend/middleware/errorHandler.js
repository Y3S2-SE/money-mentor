import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const notFound = (req, res, next) => {
    const error = new Error(`Not Found = ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    logger.error(`Unhandled request error [${req.method} ${req.originalUrl}]`, err);

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            success: false,
            message: 'Invalid resource identifier'
        });
    }

    if (err?.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'A resource with that value already exists'
        });
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        message: statusCode >= 500 ? 'Internal server error' : err.message,
    })
}