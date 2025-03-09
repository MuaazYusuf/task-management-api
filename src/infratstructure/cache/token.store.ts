import Redis from 'ioredis';
import { env } from '../../config/env';

export interface ITokenStore {
  saveAccessToken(userId: string, token: string, expiresIn: number): Promise<void>;
  saveRefreshToken(userId: string, token: string, expiresIn: number): Promise<void>;
  getAccessToken(userId: string): Promise<string | null>;
  getRefreshToken(userId: string): Promise<string | null>;
  verifyAccessToken(userId: string, token: string): Promise<boolean>;
  verifyRefreshToken(userId: string, token: string): Promise<boolean>;
  removeTokens(userId: string): Promise<void>;
  removeRefreshToken(userId: string, token: string): Promise<void>;
}

export class RedisTokenStore implements ITokenStore {
  private readonly client: Redis;
  private readonly accessTokenPrefix = 'access_token:';
  private readonly refreshTokenPrefix = 'refresh_token:';

  constructor() {
    this.client = new Redis({
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT),
      password: env.REDIS_PASSWORD || undefined
    });

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async saveAccessToken(userId: string, token: string, expiresIn: number): Promise<void> {
    const key = `${this.accessTokenPrefix}${userId}`;
    await this.client.set(key, token, 'EX', expiresIn);
  }

  async saveRefreshToken(userId: string, token: string, expiresIn: number): Promise<void> {
    const key = `${this.refreshTokenPrefix}${userId}:${token}`;
    // Store the refresh token with user ID to allow multiple refresh tokens per user
    await this.client.set(key, 'valid', 'EX', expiresIn);
    
    // Also keep track of which refresh tokens belong to this user
    const userTokensKey = `${this.refreshTokenPrefix}${userId}:tokens`;
    await this.client.sadd(userTokensKey, token);
    await this.client.expire(userTokensKey, expiresIn);
  }

  async getAccessToken(userId: string): Promise<string | null> {
    const key = `${this.accessTokenPrefix}${userId}`;
    return this.client.get(key);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    // This is slightly different as we store multiple refresh tokens per user
    // Returns the first valid refresh token, primarily used for testing
    const userTokensKey = `${this.refreshTokenPrefix}${userId}:tokens`;
    const tokens = await this.client.smembers(userTokensKey);
    
    if (tokens.length === 0) return null;
    
    return tokens[0];
  }

  async verifyAccessToken(userId: string, token: string): Promise<boolean> {
    const storedToken = await this.getAccessToken(userId);
    return storedToken === token;
  }

  async verifyRefreshToken(userId: string, token: string): Promise<boolean> {
    const key = `${this.refreshTokenPrefix}${userId}:${token}`;
    const result = await this.client.get(key);
    return result === 'valid';
  }

  async removeTokens(userId: string): Promise<void> {
    // Remove access token
    const accessKey = `${this.accessTokenPrefix}${userId}`;
    await this.client.del(accessKey);
    
    // Get all refresh tokens for this user
    const userTokensKey = `${this.refreshTokenPrefix}${userId}:tokens`;
    const tokens = await this.client.smembers(userTokensKey);
    
    // Remove each refresh token
    const refreshKeys = tokens.map(token => `${this.refreshTokenPrefix}${userId}:${token}`);
    if (refreshKeys.length > 0) {
      await this.client.del(...refreshKeys);
    }
    
    // Remove the set of tokens
    await this.client.del(userTokensKey);
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    // Remove the specific refresh token
    const refreshKey = `${this.refreshTokenPrefix}${userId}:${token}`;
    await this.client.del(refreshKey);
    
    // Remove it from the set of user tokens
    const userTokensKey = `${this.refreshTokenPrefix}${userId}:tokens`;
    await this.client.srem(userTokensKey, token);
  }
}