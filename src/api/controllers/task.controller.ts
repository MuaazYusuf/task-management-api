import { Request, Response, NextFunction } from 'express';
import { createTaskSchema, updateTaskSchema, getTasksQuerySchema, addCommentSchema, assignTaskSchema } from '../validators/task.validator';
import { NotFoundError } from '../../common/errors';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { ITaskService } from '../../domain/interfaces/services/task-service.interface';
import { ITask } from '../../domain/models/Task.model';

export class TaskController {
    constructor(private taskService: ITaskService) { }

    createTask = [
        validateRequest(createTaskSchema),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const taskData = req.body;
                const userId = req.user!.userId;
                if (taskData.dueDate) {
                    taskData.dueDate = new Date(taskData.dueDate);
                }
                const taskWithAssignees: Partial<ITask> = {
                    ...taskData,
                    assignees: taskData.assignees || []
                };

                const task = await this.taskService.createTask(taskWithAssignees, userId);

                res.status(201).json({
                    status: 'success',
                    data: {
                        task
                    }
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = req.params.id;
            const task = await this.taskService.getTaskById(taskId);

            if (!task) {
                throw new NotFoundError('Task not found');
            }

            res.status(200).json({
                status: 'success',
                data: {
                    task
                }
            });
        } catch (error) {
            next(error);
        }
    };

    updateTask = [
        validateRequest(updateTaskSchema),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const taskId = req.params.id;
                const taskData = req.body;
                const userId = req.user!.userId;

                const task = await this.taskService.updateTask(taskId, taskData, userId);

                if (!task) {
                    throw new NotFoundError('Task not found');
                }

                res.status(200).json({
                    status: 'success',
                    data: {
                        task
                    }
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = req.params.id;
            const deleted = await this.taskService.deleteTask(taskId);

            if (!deleted) {
                throw new NotFoundError('Task not found');
            }

            res.status(200).json({
                status: 'success',
                message: 'Task deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    getUserTasks = [
        validateRequest(getTasksQuerySchema, 'query'),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const userId = req.params.userId || req.user!.userId;
                const {
                    page = 1,
                    limit = 10,
                    status,
                    dueDateFrom,
                    dueDateTo,
                    search,
                    sortBy = 'dueDate',
                    sortOrder = 'asc'
                } = req.query as any;

                // Build filter
                const filter: any = {};
                if (status) {
                    filter.status = status;
                }

                if (dueDateFrom || dueDateTo) {
                    filter.dueDate = {};
                    if (dueDateFrom) {
                        filter.dueDate.from = new Date(dueDateFrom);
                    }
                    if (dueDateTo) {
                        filter.dueDate.to = new Date(dueDateTo);
                    }
                }

                if (search) {
                    filter.search = search;
                }

                // Build pagination and sorting
                const sort: Record<string, 1 | -1> = {
                    [sortBy]: sortOrder === 'desc' ? -1 : 1
                };

                const tasks = await this.taskService.getUserTasks(userId, filter, {
                    page,
                    limit,
                    sort
                });

                res.status(200).json({
                    status: 'success',
                    data: tasks
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    assignTask = [
        validateRequest(assignTaskSchema),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const taskId = req.params.id;
                const { userId } = req.body;
                const assignedBy = req.user!.userId;

                const assigned = await this.taskService.assignTaskToUser(taskId, userId, assignedBy);

                if (!assigned) {
                    throw new NotFoundError('Task not found');
                }

                res.status(200).json({
                    status: 'success',
                    message: 'Task assigned successfully'
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    unassignTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = req.params.id;
            const userId = req.params.userId;

            const unassigned = await this.taskService.removeTaskFromUser(taskId, userId);

            if (!unassigned) {
                throw new NotFoundError('Task assignment not found');
            }

            res.status(200).json({
                status: 'success',
                message: 'Task unassigned successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    addComment = [
        validateRequest(addCommentSchema),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const taskId = req.params.id;
                const { text } = req.body;
                const userId = req.user!.userId;

                const comment = await this.taskService.addComment(taskId, userId, text);

                res.status(201).json({
                    status: 'success',
                    data: {
                        comment
                    }
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    getTaskComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = req.params.id;
            const page = parseInt(req.query.page as string || '1');
            const limit = parseInt(req.query.limit as string || '10');

            const comments = await this.taskService.getTaskComments(taskId, page, limit);

            res.status(200).json({
                status: 'success',
                data: comments
            });
        } catch (error) {
            next(error);
        }
    };

    getTaskHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const taskId = req.params.id;
            const history = await this.taskService.getTaskHistory(taskId);

            res.status(200).json({
                status: 'success',
                data: {
                    history
                }
            });
        } catch (error) {
            next(error);
        }
    };

    getTaskStatusCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const counts = await this.taskService.getTaskStatusCounts(userId);

            res.status(200).json({
                status: 'success',
                data: {
                    counts
                }
            });
        } catch (error) {
            next(error);
        }
    };
}