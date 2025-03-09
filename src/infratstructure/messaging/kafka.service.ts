import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { env } from '../../config/env';
import { IMessageBus } from './message-bus.interface';

export class KafkaService implements IMessageBus {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private isInitialized = false;

    constructor() {
        if (!env.KAFKA_BROKERS) {
            throw new Error('Kafka configuration missing');
        }

        const brokers = env.KAFKA_BROKERS.split(',');

        this.kafka = new Kafka({
            clientId: env.KAFKA_CLIENT_ID || 'task-management-api',
            brokers
        });

        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({
            groupId: env.KAFKA_GROUP_ID || 'task-management-group'
        });
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.producer.connect();
            await this.consumer.connect();

            this.isInitialized = true;
            console.log('Connected to Kafka');
        } catch (error) {
            console.error('Failed to connect to Kafka:', error);
            throw error;
        }
    }

    async publish(topic: string, message: any): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.producer.send({
                topic,
                messages: [
                    { value: JSON.stringify(message) }
                ]
            });
        } catch (error) {
            console.error(`Failed to publish message to topic ${topic}:`, error);
            throw error;
        }
    }

    async subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.consumer.subscribe({ topic });

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                    try {
                        const parsedMessage = JSON.parse(message.value!.toString());
                        await handler(parsedMessage);
                    } catch (error) {
                        console.error(`Error processing message from topic ${topic}:`, error);
                    }
                }
            });
        } catch (error) {
            console.error(`Failed to subscribe to topic ${topic}:`, error);
            throw error;
        }
    }
}