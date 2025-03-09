import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../common/errors';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log error for debugging
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.errors.reduce((acc, curr) => {
            const path = curr.path.join('.');
            acc[path] = curr.message;
            return acc;
        }, {} as Record<string, string>);

        res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
        return;
    }

    // Handle Mongoose validation errors
    if (err instanceof mongoose.Error.ValidationError) {
        const errors = Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
        }, {} as Record<string, string>);

        res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
        return;
    }

    // Handle Mongoose cast errors (invalid ObjectId)
    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({
            status: 'error',
            message: `Invalid ${err.path}: ${err.value}`,
        });
        return;
    }

    // Handle Mongoose duplicate key errors
    if (err.name === 'MongoError' && (err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue)[0];
        res.status(409).json({
            status: 'error',
            message: `Duplicate field value: ${field}. Please use another value.`,
        });
        return;
    }

    // Handle known application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            errors: err.errors
        });
        return;
    }

    // Handle unknown errors
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Something went wrong. Please try again later.'
        : err.message || 'Internal server error';

    res.status(statusCode).json({
        status: 'error',
        message
    });
}