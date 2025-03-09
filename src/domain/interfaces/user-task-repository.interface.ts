import { IRepository } from './repository.interface';
import { IUserTask } from '../models/UserTask.model';
import { ID } from '../../common/types/id.type';

export interface IUserTaskRepository extends IRepository<IUserTask> {
    findUsersByTaskId(taskId: ID): Promise<ID[]>;
    findTasksByUserId(userId: ID): Promise<ID[]>;
    assignTaskToUser(taskId: ID, userId: ID, assignedBy: ID): Promise<IUserTask>;
    removeTaskFromUser(taskId: ID, userId: ID): Promise<boolean>;
}