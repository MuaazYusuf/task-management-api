import amqp, { Connection, Channel, ChannelModel } from 'amqplib';
import { env } from '../../config/env';
import { IMessageBus } from './message-bus.interface';

export class RabbitMQService implements IMessageBus {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            if (!env.RABBITMQ_URL) {
                throw new Error('RabbitMQ configuration missing');
            }

            // Explicitly type the connection to ensure type safety
            this.connection = await amqp.connect(env.RABBITMQ_URL);

            // Create channel after ensuring connection is properly typed
            if (this.connection) {
                this.channel = await this.connection.createChannel();
            } else {
                throw new Error('Failed to establish RabbitMQ connection');
            }

            this.isInitialized = true;
            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    async publish(queue: string, message: any): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.channel!.assertQueue(queue, { durable: true });

            this.channel!.sendToQueue(
                queue,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );
        } catch (error) {
            console.error(`Failed to publish message to queue ${queue}:`, error);
            throw error;
        }
    }

    async subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.channel!.assertQueue(queue, { durable: true });

            this.channel!.consume(queue, async (msg) => {
                if (msg) {
                    try {
                        const parsedMessage = JSON.parse(msg.content.toString());
                        await handler(parsedMessage);
                        this.channel!.ack(msg);
                    } catch (error) {
                        console.error(`Error processing message from queue ${queue}:`, error);
                        // Nack and requeue if processing failed
                        this.channel!.nack(msg, false, true);
                    }
                }
            });
        } catch (error) {
            console.error(`Failed to subscribe to queue ${queue}:`, error);
            throw error;
        }
    }
}