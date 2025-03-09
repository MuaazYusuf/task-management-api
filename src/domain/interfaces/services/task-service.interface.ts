import { ID } from "../../../common/types/id.type";
import { PaginationResult } from "../../../common/types/pagination.type";
import { ITask, TaskStatus } from "../../models/Task.model";
import { ITaskComment } from "../../models/TaskComment.model";
import { ITaskHistory } from "../../models/TaskHistory.model";
import { TaskFilterOptions } from "../task-filter-options.interface";
import { TaskPaginationOptions } from "../task-pagination-options.interface";


export interface TaskWithRelations extends ITask {
    assignees?: ID[];
    comments?: ITaskComment[];
    history?: ITaskHistory[];
}

export interface ITaskService {
    createTask(taskData: Partial<ITask>, createdBy: ID): Promise<ITask>;
    getTaskById(taskId: ID): Promise<TaskWithRelations | null>;
    updateTask(taskId: ID, taskData: Partial<ITask>, userId: ID): Promise<ITask | null>;
    deleteTask(taskId: ID): Promise<boolean>;
    getUserTasks(
        userId: ID,
        filter: TaskFilterOptions,
        pagination: TaskPaginationOptions
    ): Promise<PaginationResult<ITask>>;
    assignTaskToUser(taskId: ID, userId: ID, assignedBy: ID): Promise<boolean>;
    removeTaskFromUser(taskId: ID, userId: ID): Promise<boolean>;
    addComment(taskId: ID, userId: ID, text: string): Promise<ITaskComment>;
    getTaskComments(taskId: ID, page: number, limit: number): Promise<PaginationResult<ITaskComment>>;
    getTaskHistory(taskId: ID): Promise<ITaskHistory[]>;
    getTaskStatusCounts(userId: ID): Promise<Record<TaskStatus, number>>;
}