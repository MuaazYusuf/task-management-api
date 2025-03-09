import { IQueueService } from '../infratstructure/queue/queue.service.interface';
import { NotificationProcessor } from './notification.processor';
import { TaskCleanupProcessor } from './task-cleanup.processor';

export const registerJobProcessors = (
    queueService: IQueueService,
    notificationProcessor: NotificationProcessor,
    taskCleanupProcessor: TaskCleanupProcessor
): void => {
    // Register notification processors
    queueService.registerProcessor(
        'createNotification',
        notificationProcessor.processCreateNotification.bind(notificationProcessor)
    );

    queueService.registerProcessor(
        'createNotifications',
        notificationProcessor.processCreateNotifications.bind(notificationProcessor)
    );

    // Register task cleanup processor
    queueService.registerProcessor(
        'cleanupTaskResources',
        taskCleanupProcessor.processTaskCleanup.bind(taskCleanupProcessor)
    );
};