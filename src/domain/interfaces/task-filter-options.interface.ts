import { TaskStatus } from "../models/Task.model";

export interface TaskFilterOptions {
    status?: TaskStatus;
    dueDate?: {
        from?: Date;
        to?: Date;
    };
    search?: string;
}