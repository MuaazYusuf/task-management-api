import Redis from 'ioredis';
import { ICacheService } from './cache.service.interface';
import { env } from '../../config/env';

export class RedisCacheService implements ICacheService {
    private readonly client: Redis;

    constructor() {
        this.client = new Redis({
            host: env.REDIS_HOST,
            port: parseInt(env.REDIS_PORT),
            password: env.REDIS_PASSWORD,
            keyPrefix: 'task-api:'
        });

        this.client.on('error', (error) => {
            console.error('Redis connection error:', error);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(key);
            if (!data) return null;

            return JSON.parse(data) as T;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
        try {
            await this.client.set(
                key,
                JSON.stringify(value),
                'EX',
                ttlSeconds
            );
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Redis delete error:', error);
        }
    }

    async deletePattern(pattern: string): Promise<void> {
        try {
            // Get all keys matching the pattern
            const keys = await this.client.keys(pattern);

            if (keys.length > 0) {
                // Delete all matching keys
                await this.client.del(...keys);
            }
        } catch (error) {
            console.error('Redis deletePattern error:', error);
        }
    }
}