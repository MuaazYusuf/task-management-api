import { Queue, Worker, QueueEvents } from 'bullmq';
import { IQueueService, JobOptions } from './queue.service.interface';
import { env } from '../../config/env';

export class BullMQService implements IQueueService {
    private queues: Map<string, Queue> = new Map();
    private workers: Map<string, Worker> = new Map();
    private queueEvents: Map<string, QueueEvents> = new Map();

    private readonly redisConnection = {
        host: env.REDIS_HOST,
        port: parseInt(env.REDIS_PORT),
        password: env.REDIS_PASSWORD
    };

    constructor() {
        // Initialize default queues
        this.initializeQueue('notifications');
        this.initializeQueue('notification');
        this.initializeQueue('taskCleanup');
    }

    private initializeQueue(queueName: string): Queue {
        if (!this.queues.has(queueName)) {
            const queue = new Queue(queueName, {
                connection: this.redisConnection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000
                    },
                    removeOnComplete: true,
                    removeOnFail: 100 // Keep last 100 failed jobs
                }
            });

            // Initialize queue events for monitoring
            const queueEvents = new QueueEvents(queueName, {
                connection: this.redisConnection
            });

            this.queues.set(queueName, queue);
            this.queueEvents.set(queueName, queueEvents);

            // Setup event listeners
            this.setupEventListeners(queueName);
        }

        return this.queues.get(queueName)!;
    }

    private setupEventListeners(queueName: string): void {
        const queueEvents = this.queueEvents.get(queueName);

        if (queueEvents) {
            queueEvents.on('completed', ({ jobId }) => {
                console.log(`Job ${jobId} in queue ${queueName} completed successfully`);
            });

            queueEvents.on('failed', ({ jobId, failedReason }) => {
                console.error(`Job ${jobId} in queue ${queueName} failed:`, failedReason);
            });

            queueEvents.on('stalled', ({ jobId }) => {
                console.warn(`Job ${jobId} in queue ${queueName} stalled`);
            });
        }
    }

    async addJob<T>(queueName: string, data: T, options: JobOptions = {}): Promise<void> {
        const queue = this.initializeQueue(queueName);

        await queue.add(queueName, data, {
            delay: options.delay,
            priority: options.priority,
            attempts: options.attempts,
            removeOnComplete: options.removeOnComplete,
            removeOnFail: options.removeOnFail
        });
    }

    registerProcessor(queueName: string, processor: (data: any) => Promise<void>): void {
        // Initialize queue if it doesn't exist
        this.initializeQueue(queueName);

        // Create worker if it doesn't exist
        if (!this.workers.has(queueName)) {
            const worker = new Worker(
                queueName,
                async job => {
                    await processor(job.data);
                },
                { connection: this.redisConnection }
            );

            worker.on('error', (error) => {
                console.error(`Worker for queue ${queueName} encountered error:`, error);
            });

            this.workers.set(queueName, worker);
        }
    }
}