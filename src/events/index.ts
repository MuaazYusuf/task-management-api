import { INotificationRepository } from "../domain/interfaces/notification-repository.interface";
import { ITaskRepository } from "../domain/interfaces/task-repository.interface";
import { IUserTaskRepository } from "../domain/interfaces/user-task-repository.interface";
import { IMessageBus } from "../infratstructure/messaging/message-bus.interface";
import { IQueueService } from "../infratstructure/queue/queue.service.interface";
import { TaskEventHandler } from "./handlers/task.handler";

export const registerEventHandlers = (
    messageBus: IMessageBus,
    queueService: IQueueService,
    taskRepository: ITaskRepository,
    userTaskRepository: IUserTaskRepository,
    notificationRepository: INotificationRepository
): void => {
    // Initialize handlers
    const taskEventHandler = new TaskEventHandler(
        taskRepository,
        userTaskRepository,
        notificationRepository,
        queueService
    );

    // Subscribe to events
    messageBus.subscribe('task.created', taskEventHandler.handleTaskCreated.bind(taskEventHandler));
    messageBus.subscribe('task.updated', taskEventHandler.handleTaskUpdated.bind(taskEventHandler));

    // Register the background job processor for sending reminders
    queueService.registerProcessor(
        'sendDueDateReminder',
        taskEventHandler.sendDueDateReminder.bind(taskEventHandler)
    );

    console.log('Event handlers registered successfully');
};