import { NotFoundError } from "../../common/errors";
import { ID, toObjectId } from "../../common/types/id.type";
import { PaginationResult } from "../../common/types/pagination.type";
import { ICacheService } from "../../infratstructure/cache/cache.service.interface";
import { IMessageBus } from "../../infratstructure/messaging/message-bus.interface";
import { IQueueService } from "../../infratstructure/queue/queue.service.interface";
import { INotificationRepository } from "../interfaces/notification-repository.interface";
import { ITaskService, TaskWithRelations } from "../interfaces/services/task-service.interface";
import { ITaskCommentRepository } from "../interfaces/task-comment-repository.interface";
import { TaskFilterOptions } from "../interfaces/task-filter-options.interface";
import { ITaskHistoryRepository } from "../interfaces/task-history-repository.interface";
import { TaskPaginationOptions } from "../interfaces/task-pagination-options.interface";
import { ITaskRepository } from "../interfaces/task-repository.interface";
import { IUserTaskRepository } from "../interfaces/user-task-repository.interface";
import { NotificationType } from "../models/Notification.model";
import { ITask, TaskStatus } from "../models/Task.model";
import { ITaskComment } from "../models/TaskComment.model";
import { HistoryActionType, ITaskHistory } from "../models/TaskHistory.model";

export class TaskService implements ITaskService {
    constructor(
        private taskRepository: ITaskRepository,
        private userTaskRepository: IUserTaskRepository,
        private taskHistoryRepository: ITaskHistoryRepository,
        private taskCommentRepository: ITaskCommentRepository,
        private notificationRepository: INotificationRepository,
        private cacheService: ICacheService,
        private queueService: IQueueService,
        private messageBus: IMessageBus
    ) { }

    async createTask(taskData: Partial<ITask>, createdBy: ID): Promise<ITask> {
        try {
            // Convert createdBy to ObjectId if it's a string
            const createdByObjId = toObjectId(createdBy);

            // Extract assignees before creating the task
            const assignees = taskData.assignees || [];

            // Create a clean copy of task data without assignees
            const { assignees: _, ...cleanTaskData } = taskData;

            // Create task
            const task = await this.taskRepository.create({
                ...cleanTaskData,
                createdBy: createdByObjId
            });

            // Record task creation in history
            await this.taskHistoryRepository.create({
                taskId: toObjectId(String(task._id)),
                userId: createdByObjId,
                action: HistoryActionType.CREATED,
                timestamp: new Date()
            });

            // If any assignees are provided, assign the task to them
            if (assignees.length > 0) {
                const assigneePromises = assignees.map(userId =>
                    this.assignTaskToUser(toObjectId(String(task._id)), userId, createdByObjId)
                );

                await Promise.all(assigneePromises);
            }

            // Publish task.created event
            await this.messageBus.publish('task.created', {
                taskId: toObjectId(String(task._id)),
                title: task.title,
                description: task.description,
                dueDate: task.dueDate.toISOString(),
                createdBy: createdByObjId.toString(),
                assignees: assignees.map(id => id.toString()),
                timestamp: new Date().toISOString()
            });

            return task;
        } catch (error) {
            throw error;
        }
    }

    async getTaskById(taskId: ID): Promise<TaskWithRelations | null> {
        try {
            const task = await this.taskRepository.findById(taskId);
            if (!task) return null;

            // Get task assignees
            const assignedUsers = await this.userTaskRepository.findUsersByTaskId(taskId);

            // Convert to TaskWithRelations
            const taskWithRelations: TaskWithRelations = task.toObject();
            taskWithRelations.assignees = assignedUsers;

            return taskWithRelations;
        } catch (error) {
            throw error;
        }
    }

    async updateTask(taskId: ID, taskData: Partial<ITask>, userId: ID): Promise<ITask | null> {
        try {
            // Convert IDs to ObjectIds
            const taskObjId = toObjectId(taskId);
            const userObjId = toObjectId(userId);

            // Get current task
            const currentTask = await this.taskRepository.findById(taskObjId);
            if (!currentTask) {
                throw new NotFoundError('Task not found');
            }

            // Extract assignees if present
            const assignees = taskData.assignees;

            // Create a clean copy of task data without assignees
            const { assignees: _, ...cleanTaskData } = taskData;

            // Check if status is being updated
            const isStatusUpdate = cleanTaskData.status && cleanTaskData.status !== currentTask.status;

            // Update task
            const updatedTask = await this.taskRepository.update(taskObjId, cleanTaskData);
            if (!updatedTask) return null;

            // Track status change in history if needed
            if (isStatusUpdate) {
                await this.taskHistoryRepository.create({
                    taskId: toObjectId(String(updatedTask._id)),
                    userId: userObjId,
                    action: HistoryActionType.STATUS_CHANGED,
                    previousValue: currentTask.status,
                    newValue: updatedTask.status as string,
                    timestamp: new Date()
                });
            } else {
                // Track general update
                await this.taskHistoryRepository.create({
                    taskId: toObjectId(String(updatedTask._id)),
                    userId: userObjId,
                    action: HistoryActionType.UPDATED,
                    timestamp: new Date(),
                    metadata: { updatedFields: Object.keys(cleanTaskData) }
                });
            }

            // Update assignees if provided
            if (assignees && Array.isArray(assignees)) {
                // Get current assignees
                const currentAssignees = await this.userTaskRepository.findUsersByTaskId(taskObjId);

                // Calculate users to assign and unassign
                const currentAssigneeIds = currentAssignees.map(id => id.toString());
                const newAssigneeIds = assignees.map(id => id.toString());

                const toAssign = assignees.filter(id => !currentAssigneeIds.includes(id.toString()));
                const toUnassign = currentAssignees.filter(id => !newAssigneeIds.includes(id.toString()));

                // Assign new users
                const assignPromises = toAssign.map(assigneeId =>
                    this.assignTaskToUser(taskObjId, assigneeId, userObjId)
                );

                // Unassign removed users
                const unassignPromises = toUnassign.map(assigneeId =>
                    this.removeTaskFromUser(taskObjId, assigneeId)
                );

                // Execute all changes in parallel
                await Promise.all([...assignPromises, ...unassignPromises]);
            }

            // Find users assigned to this task for notifications and cache invalidation
            const assignedUsers = await this.userTaskRepository.findUsersByTaskId(taskObjId);

            // Create notifications for assigned users
            if (assignedUsers.length > 0) {
                const notificationPromises = assignedUsers.map(assignedUserId =>
                    this.queueService.addJob('createNotification', {
                        userId: assignedUserId,
                        type: NotificationType.TASK_UPDATED,
                        content: `Task "${updatedTask.title}" has been updated`,
                        relatedTo: {
                            model: 'Task',
                            id: updatedTask._id
                        }
                    })
                );

                // Queue notifications in parallel
                await Promise.all(notificationPromises);
            }

            // Invalidate cache for task lists
            await this.invalidateUserTasksCache(assignedUsers);

            // Publish task.updated event
            await this.messageBus.publish('task.updated', {
                taskId: toObjectId(String(updatedTask._id)),
                title: updatedTask.title,
                description: updatedTask.description,
                status: updatedTask.status,
                previousStatus: isStatusUpdate ? currentTask.status : undefined,
                dueDate: updatedTask.dueDate.toISOString(),
                updatedBy: userObjId.toString(),
                updatedFields: Object.keys(cleanTaskData),
                assignees: assignedUsers.map(id => id.toString()),
                timestamp: new Date().toISOString()
            });

            // If status changed, publish a specific event for that
            if (isStatusUpdate) {
                await this.messageBus.publish('task.status.changed', {
                    taskId: toObjectId(String(updatedTask._id)),
                    title: updatedTask.title,
                    previousStatus: currentTask.status,
                    newStatus: updatedTask.status,
                    updatedBy: userObjId.toString(),
                    timestamp: new Date().toISOString()
                });
            }

            return updatedTask;
        } catch (error) {
            throw error;
        }
    }

    async deleteTask(taskId: ID): Promise<boolean> {
        try {
            const taskObjId = toObjectId(taskId);

            // Get assigned users before deletion for cache invalidation
            const assignedUsers = await this.userTaskRepository.findUsersByTaskId(taskObjId);

            // Delete task
            const deleted = await this.taskRepository.delete(taskObjId);
            if (!deleted) return false;

            // Queue cleanup task
            await this.queueService.addJob('cleanupTaskResources', { taskId: taskObjId.toString() });

            // Invalidate cache for task lists
            await this.invalidateUserTasksCache(assignedUsers);

            return true;
        } catch (error) {
            throw error;
        }
    }

    async getUserTasks(
        userId: ID,
        filter: TaskFilterOptions,
        pagination: TaskPaginationOptions
    ): Promise<PaginationResult<ITask>> {
        try {
            const userObjId = toObjectId(userId);

            // Create cache key
            const cacheKey = `user-tasks:${userObjId.toString()}:${JSON.stringify(filter)}:${JSON.stringify(pagination)}`;

            // Try to get from cache
            const cachedData = await this.cacheService.get<PaginationResult<ITask>>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Get tasks from database
            const tasks = await this.taskRepository.findTasksForUser(userObjId, filter, pagination);

            // Cache results
            await this.cacheService.set(cacheKey, tasks, 300); // Cache for 5 minutes

            return tasks;
        } catch (error) {
            throw error;
        }
    }

    async assignTaskToUser(taskId: ID, userId: ID, assignedBy: ID): Promise<boolean> {
        try {
            const taskObjId = toObjectId(taskId);
            const userObjId = toObjectId(userId);
            const assignedByObjId = toObjectId(assignedBy);

            // Check if task exists
            const task = await this.taskRepository.findById(taskObjId);
            if (!task) {
                throw new NotFoundError('Task not found');
            }

            // Create assignment
            await this.userTaskRepository.assignTaskToUser(taskObjId, userObjId, assignedByObjId);

            // Record in history
            await this.taskHistoryRepository.create({
                taskId: taskObjId,
                userId: assignedByObjId,
                action: HistoryActionType.ASSIGNED,
                newValue: userObjId.toString(),
                timestamp: new Date()
            });

            // Create notification for assigned user
            await this.queueService.addJob('createNotification', {
                userId: userObjId,
                type: NotificationType.TASK_ASSIGNED,
                content: `You have been assigned to task "${task.title}"`,
                relatedTo: {
                    model: 'Task',
                    id: task._id
                }
            });

            // Invalidate cache
            await this.invalidateUserTasksCache([userObjId]);

            return true;
        } catch (error) {
            throw error;
        }
    }

    async removeTaskFromUser(taskId: ID, userId: ID): Promise<boolean> {
        try {
            const taskObjId = toObjectId(taskId);
            const userObjId = toObjectId(userId);

            // Remove assignment
            const removed = await this.userTaskRepository.removeTaskFromUser(taskObjId, userObjId);

            if (removed) {
                // Invalidate cache
                await this.invalidateUserTasksCache([userObjId]);
            }

            return removed;
        } catch (error) {
            throw error;
        }
    }

    async addComment(taskId: ID, userId: ID, text: string): Promise<ITaskComment> {
        try {
            const taskObjId = toObjectId(taskId);
            const userObjId = toObjectId(userId);

            // Check if task exists
            const task = await this.taskRepository.findById(taskObjId);
            if (!task) {
                throw new NotFoundError('Task not found');
            }

            // Create comment
            const comment = await this.taskCommentRepository.create({
                taskId: taskObjId,
                userId: userObjId,
                text
            });

            // Find users assigned to this task for notifications
            const assignedUsers = await this.userTaskRepository.findUsersByTaskId(taskObjId);

            // Queue notification creation
            if (assignedUsers.length > 0) {
                // Filter out the commenter
                const usersToNotify = assignedUsers.filter(
                    assignedUser => assignedUser.toString() !== userObjId.toString()
                );

                if (usersToNotify.length > 0) {
                    const notificationPromises = usersToNotify.map(assignedUserId =>
                        this.queueService.addJob('createNotification', {
                            userId: assignedUserId,
                            type: NotificationType.COMMENT_ADDED,
                            content: `New comment on task "${task.title}"`,
                            relatedTo: {
                                model: 'TaskComment',
                                id: comment._id
                            }
                        })
                    );

                    await Promise.all(notificationPromises);
                }
            }

            return comment;
        } catch (error) {
            throw error;
        }
    }

    async getTaskComments(taskId: ID, page: number, limit: number): Promise<PaginationResult<ITaskComment>> {
        try {
            const taskObjId = toObjectId(taskId);
            return await this.taskCommentRepository.findTaskComments(taskObjId, page, limit);
        } catch (error) {
            throw error;
        }
    }

    async getTaskHistory(taskId: ID): Promise<ITaskHistory[]> {
        try {
            const taskObjId = toObjectId(taskId);
            return await this.taskHistoryRepository.findTaskHistory(taskObjId);
        } catch (error) {
            throw error;
        }
    }

    async getTaskStatusCounts(userId: ID): Promise<Record<TaskStatus, number>> {
        try {
            const userObjId = toObjectId(userId);

            // Create cache key
            const cacheKey = `task-status-counts:${userObjId.toString()}`;

            // Try to get from cache
            const cachedData = await this.cacheService.get<Record<TaskStatus, number>>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Get counts from database
            const counts = await this.taskRepository.countTasksByStatus(userObjId);

            // Cache results
            await this.cacheService.set(cacheKey, counts, 300); // Cache for 5 minutes

            return counts;
        } catch (error) {
            throw error;
        }
    }

    private async invalidateUserTasksCache(userIds: ID[]): Promise<void> {
        try {
            if (!userIds || userIds.length === 0) return;

            // Create invalidation patterns for each user
            const patterns = userIds.map(userId =>
                `user-tasks:${typeof userId === 'string' ? userId : userId.toString()}:*`
            );

            // Delete matching cache keys
            await Promise.all(patterns.map(pattern => this.cacheService.deletePattern(pattern)));

            // Also invalidate status counts cache
            await Promise.all(userIds.map(userId =>
                this.cacheService.delete(`task-status-counts:${typeof userId === 'string' ? userId : userId.toString()}`)
            ));
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }
}