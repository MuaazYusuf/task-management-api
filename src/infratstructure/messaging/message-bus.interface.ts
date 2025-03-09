export interface IMessageBus {
    initialize(): Promise<void>;
    publish(topic: string, message: any): Promise<void>;
    subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void>;
}