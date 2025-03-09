import { ITaskRepository } from '../../../domain/interfaces/task-repository.interface';
import { ITask, Task, TaskStatus } from '../../../domain/models/Task.model';
import { BaseRepository } from './base.repository';
import { PaginationResult } from '../../../common/types/pagination.type';
import { UserTask } from '../../../domain/models/UserTask.model';
import { ID, toObjectId } from '../../../common/types/id.type';
import { TaskFilterOptions } from '../../../domain/interfaces/task-filter-options.interface';
import { TaskPaginationOptions } from '../../../domain/interfaces/task-pagination-options.interface';

export class TaskRepository extends BaseRepository<ITask> implements ITaskRepository {
    constructor() {
        super(Task);
    }

    async findTasksForUser(
        userId: ID,
        filter: TaskFilterOptions,
        pagination: TaskPaginationOptions
    ): Promise<PaginationResult<ITask>> {
        try {
            // Convert userId to ObjectId
            let tasks: ITask[] = [];
            let totalCount: number = 0;

            // Calculate pagination
            const { page, limit, sort = { dueDate: 1 } } = pagination;
            const skip = (page - 1) * limit;
            
            // Find task IDs assigned to the user
            const userTasks = await UserTask.find({ userId: userId }).select('taskId');
            if(userTasks.length > 0) {
            const taskIds = userTasks.map(ut => ut.taskId);
            
            // Build filter
            const mongoFilter: any = { _id: { $in: taskIds } };

            if (filter.status) {
                mongoFilter.status = filter.status;
            }

            if (filter.dueDate) {
                mongoFilter.dueDate = {};
                if (filter.dueDate.from) {
                    mongoFilter.dueDate.$gte = filter.dueDate.from;
                }
                if (filter.dueDate.to) {
                    mongoFilter.dueDate.$lte = filter.dueDate.to;
                }
            }

            if (filter.search) {
                mongoFilter.$or = [
                    { title: { $regex: filter.search, $options: 'i' } },
                    { description: { $regex: filter.search, $options: 'i' } }
                ];
            }

            

            // Execute query
            [tasks, totalCount] = await Promise.all([
                this.model.find(mongoFilter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.model.countDocuments(mongoFilter)
            ]);
            }
            
            return {
                data: tasks,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async countTasksByStatus(userId: ID): Promise<Record<TaskStatus, number>> {
        try {
            // Convert userId to ObjectId
            const userObjectId = toObjectId(userId);

            // Find task IDs assigned to the user
            const userTasks = await UserTask.find({ userId: userObjectId }).select('taskId');
            const taskIds = userTasks.map(ut => ut.taskId);

            // Run aggregation to count tasks by status
            const result = await this.model.aggregate([
                { $match: { _id: { $in: taskIds } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            // Convert result to expected format
            const counts: Record<TaskStatus, number> = {
                [TaskStatus.TODO]: 0,
                [TaskStatus.IN_PROGRESS]: 0,
                [TaskStatus.REVIEW]: 0,
                [TaskStatus.DONE]: 0
            };

            result.forEach(item => {
                counts[item._id as TaskStatus] = item.count;
            });

            return counts;
        } catch (error) {
            throw error;
        }
    }
}