import { ITaskHistoryRepository } from '../../../domain/interfaces/task-history-repository.interface';
import { ITaskHistory, TaskHistory } from '../../../domain/models/TaskHistory.model';
import { BaseRepository } from './base.repository';
import { ID, toObjectId } from '../../../common/types/id.type';

export class TaskHistoryRepository extends BaseRepository<ITaskHistory> implements ITaskHistoryRepository {
    constructor() {
        super(TaskHistory);
    }

    async findTaskHistory(taskId: ID): Promise<ITaskHistory[]> {
        try {
            const taskObjId = toObjectId(taskId);
            return this.model.find({ taskId: taskObjId })
                .sort({ timestamp: -1 })
                .populate('userId', 'firstName lastName email')
                .exec();
        } catch (error) {
            throw error;
        }
    }

    async createTaskHistory(historyData: Partial<ITaskHistory>): Promise<ITaskHistory> {
        try {
            // Convert any string IDs to ObjectIds
            if (historyData.taskId && typeof historyData.taskId === 'string') {
                historyData.taskId = toObjectId(historyData.taskId);
            }

            if (historyData.userId && typeof historyData.userId === 'string') {
                historyData.userId = toObjectId(historyData.userId);
            }

            return await this.create(historyData);
        } catch (error) {
            throw error;
        }
    }
}