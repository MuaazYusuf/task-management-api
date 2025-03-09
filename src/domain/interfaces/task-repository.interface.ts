import { PaginationResult } from "../../common/types/pagination.type";
import { ITask, TaskStatus } from "../models/Task.model";
import { IRepository } from "./repository.interface";
import { TaskFilterOptions } from "./task-filter-options.interface";
import { TaskPaginationOptions } from "./task-pagination-options.interface";
import { ID } from '../../common/types/id.type';

export interface ITaskRepository extends IRepository<ITask> {
    findTasksForUser(
        userId: ID,
        filter: TaskFilterOptions,
        pagination: TaskPaginationOptions
    ): Promise<PaginationResult<ITask>>;

    countTasksByStatus(userId: ID): Promise<Record<TaskStatus, number>>;
}