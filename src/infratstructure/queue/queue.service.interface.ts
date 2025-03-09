export interface JobOptions {
    delay?: number;
    priority?: number;
    attempts?: number;
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
}

export interface IQueueService {
    addJob<T>(jobName: string, data: T, options?: JobOptions): Promise<void>;
    registerProcessor(queueName: string, processor: (data: any) => Promise<void>): void;
}