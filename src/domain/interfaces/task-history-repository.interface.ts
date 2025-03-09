import { IRepository } from './repository.interface';
import { ITaskHistory } from '../models/TaskHistory.model';
import { ID } from '../../common/types/id.type';

export interface ITaskHistoryRepository extends IRepository<ITaskHistory> {
    findTaskHistory(taskId: ID): Promise<ITaskHistory[]>;
    createTaskHistory(historyData: Partial<ITaskHistory>): Promise<ITaskHistory>;
}