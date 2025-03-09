import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { BadRequestError } from '../../common/errors';
import { env } from '../../config/env';

const redisClient = new Redis({
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
    password: env.REDIS_PASSWORD,
    enableOfflineQueue: false
});

// Create rate limiters with different configurations
const apiLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rate_limit_api',
    points: 100, // 100 requests
    duration: 60, // per 1 minute
    blockDuration: 60 * 5 // Block for 5 minutes if exceeded
});

const authLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rate_limit_auth',
    points: 10, // 10 requests
    duration: 60, // per 1 minute
    blockDuration: 60 * 15 // Block for 15 minutes if exceeded
});

export const rateLimiterMiddleware = (type: 'api' | 'auth' = 'api') => {
    const limiter = type === 'auth' ? authLimiter : apiLimiter;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Use IP address as the rate limiting key
            const key = req.ip || 'unknown';

            await limiter.consume(key);
            next();
        } catch (error: any) {
            if (error.consumedPoints) {
                // Rate limit exceeded
                next(new BadRequestError('Too many requests. Please try again later.'));
            } else {
                // Redis or other error
                next(error);
            }
        }
    };
};