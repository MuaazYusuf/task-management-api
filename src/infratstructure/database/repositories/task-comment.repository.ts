import { ITaskCommentRepository } from '../../../domain/interfaces/task-comment-repository.interface';
import { ITaskComment, TaskComment } from '../../../domain/models/TaskComment.model';
import { BaseRepository } from './base.repository';
import { PaginationResult } from '../../../common/types/pagination.type';
import { ID, toObjectId } from '../../../common/types/id.type';

export class TaskCommentRepository extends BaseRepository<ITaskComment> implements ITaskCommentRepository {
    constructor() {
        super(TaskComment);
    }

    async findTaskComments(
        taskId: ID,
        page: number,
        limit: number
    ): Promise<PaginationResult<ITaskComment>> {
        try {
            const taskObjId = toObjectId(taskId);
            const skip = (page - 1) * limit;

            const [comments, totalCount] = await Promise.all([
                this.model.find({ taskId: taskObjId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'firstName lastName email')
                    .exec(),
                this.model.countDocuments({ taskId: taskObjId })
            ]);

            return {
                data: comments,
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
}