import { IRepository } from './repository.interface';
import { ITaskComment } from '../models/TaskComment.model';
import { PaginationResult } from '../../common/types/pagination.type';
import { ID } from '../../common/types/id.type';

export interface ITaskCommentRepository extends IRepository<ITaskComment> {
    findTaskComments(
        taskId: ID,
        page: number,
        limit: number
    ): Promise<PaginationResult<ITaskComment>>;
}