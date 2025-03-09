import { toObjectId } from "../../common/types/id.type";
import { INotificationRepository } from "../../domain/interfaces/notification-repository.interface";
import { ITaskRepository } from "../../domain/interfaces/task-repository.interface";
import { IUserTaskRepository } from "../../domain/interfaces/user-task-repository.interface";
import { NotificationType } from "../../domain/models/Notification.model";
import { IQueueService } from "../../infratstructure/queue/queue.service.interface";

export class TaskEventHandler {
    constructor(
      private taskRepository: ITaskRepository,
      private userTaskRepository: IUserTaskRepository,
      private notificationRepository: INotificationRepository,
      private queueService: IQueueService
    ) {}
  
    /**
     * Handle task.created events to schedule due date reminders
     */
    async handleTaskCreated(event: any): Promise<void> {
      try {
        const { taskId, dueDate } = event;
        
        // Schedule a reminder for 1 day before due date
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        
        // If the due date is within the next 24 hours or already passed, send reminder immediately
        const now = new Date();
        const delayMs = Math.max(0, reminderDate.getTime() - now.getTime());
        
        // Queue the reminder with the calculated delay
        await this.queueService.addJob('sendDueDateReminder', { taskId }, {
          delay: delayMs,
          attempts: 3
        });
        
        console.log(`Scheduled due date reminder for task ${taskId} at ${reminderDate.toISOString()}`);
      } catch (error) {
        console.error('Error handling task.created event:', error);
      }
    }
  
    /**
     * Handle task.updated events to reschedule due date reminders if the due date changed
     */
    async handleTaskUpdated(event: any): Promise<void> {
      try {
        const { taskId, updatedFields, dueDate } = event;
        
        // Only process if due date was updated
        if (!updatedFields.includes('dueDate')) {
          return;
        }
        
        // Same logic as in handleTaskCreated
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        
        const now = new Date();
        const delayMs = Math.max(0, reminderDate.getTime() - now.getTime());
        
        // Queue the reminder with the calculated delay
        await this.queueService.addJob('sendDueDateReminder', { taskId }, {
          delay: delayMs,
          attempts: 3
        });
        
        console.log(`Rescheduled due date reminder for task ${taskId} at ${reminderDate.toISOString()}`);
      } catch (error) {
        console.error('Error handling task.updated event:', error);
      }
    }
  
    /**
     * Send due date reminder notifications to all users assigned to a task
     */
    async sendDueDateReminder(data: { taskId: string }): Promise<void> {
      try {
        const { taskId } = data;
        const taskObjId = toObjectId(taskId);
        
        // Fetch the task details
        const task = await this.taskRepository.findById(taskObjId);
        if (!task) {
          console.warn(`Task ${taskId} not found for sending reminder`);
          return;
        }
        
        // Fetch all users assigned to the task
        const assignedUsers = await this.userTaskRepository.findUsersByTaskId(taskObjId);
        if (!assignedUsers || assignedUsers.length === 0) {
          console.warn(`No users assigned to task ${taskId} for reminder`);
          return;
        }
        
        // Create a notification for each assigned user
        const notificationPromises = assignedUsers.map(userId => 
          this.notificationRepository.create({
            userId: toObjectId(String(userId)),
            type: NotificationType.DEADLINE_REMINDER,
            content: `Reminder: Task "${task.title}" is due tomorrow`,
            relatedTo: {
              model: 'Task',
              id: taskObjId
            },
            isRead: false
          })
        );
        
        await Promise.all(notificationPromises);
        console.log(`Sent due date reminders to ${assignedUsers.length} users for task ${taskId}`);
      } catch (error) {
        console.error('Error sending due date reminder:', error);
        throw error;
      }
    }
  }