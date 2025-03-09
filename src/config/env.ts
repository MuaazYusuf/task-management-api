import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define and validate environment variables
interface Environment {
    NODE_ENV: string;
    PORT: string;

    // MongoDB
    MONGODB_URI: string;

    // Redis
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD: string;

    // JWT
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRATION: string;
    JWT_REFRESH_EXPIRATION: string;

    // Kafka (if using Kafka)
    KAFKA_BROKERS?: string;
    KAFKA_CLIENT_ID?: string;
    KAFKA_GROUP_ID?: string;

    // RabbitMQ (if using RabbitMQ)
    RABBITMQ_URL?: string;

    // Cloud provider
    CLOUD_PROVIDER?: 'aws' | 'azure';

    // AWS specific
    AWS_REGION?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;

}

// Define required environment variables
const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'REDIS_HOST',
    'REDIS_PORT',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ACCESS_EXPIRATION',
    'JWT_REFRESH_EXPIRATION'
];

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create and export environment object
export const env: Environment = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000',

    // MongoDB
    MONGODB_URI: process.env.MONGODB_URI!,

    // Redis
    REDIS_HOST: process.env.REDIS_HOST!,
    REDIS_PORT: process.env.REDIS_PORT!,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

    // JWT
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION!,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION!,

    // Optional environment variables
    KAFKA_BROKERS: process.env.KAFKA_BROKERS,
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,
    KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,

    RABBITMQ_URL: process.env.RABBITMQ_URL,

    CLOUD_PROVIDER: process.env.CLOUD_PROVIDER as 'aws' | 'azure',

    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};