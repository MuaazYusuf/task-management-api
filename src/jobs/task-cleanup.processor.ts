import { IUserTaskRepository } from '../domain/interfaces/user-task-repository.interface';
import { ITaskHistoryRepository } from '../domain/interfaces/task-history-repository.interface';
import { ITaskCommentRepository } from '../domain/interfaces/task-comment-repository.interface';
import { ID, toObjectId } from '../common/types/id.type';

export interface TaskCleanupJobData {
  taskId: ID;
}

export class TaskCleanupProcessor {
  constructor(
    private userTaskRepository: IUserTaskRepository,
    private taskHistoryRepository: ITaskHistoryRepository,
    private taskCommentRepository: ITaskCommentRepository
  ) { }

  async processTaskCleanup(data: TaskCleanupJobData): Promise<void> {
    try {
      const taskObjId = toObjectId(data.taskId);

      // Execute cleanup operations in parallel
      await Promise.all([
        // Delete all user task assignments
        this.cleanupUserTasks(taskObjId),

        // Delete all task history records
        this.cleanupTaskHistory(taskObjId),

        // Delete all task comments
        this.cleanupTaskComments(taskObjId)
      ]);

      console.log(`Successfully cleaned up resources for task ${data.taskId}`);
    } catch (error) {
      console.error('Failed to clean up task resources:', error);
      throw error;
    }
  }

  private async cleanupUserTasks(taskId: ID): Promise<void> {
    const userTasks = await this.userTaskRepository.find({ taskId });

    if (userTasks.length > 0) {
      await Promise.all(userTasks.map(ut =>
        this.userTaskRepository.delete(toObjectId(String(ut._id)))
      ));
      console.log(`Deleted ${userTasks.length} user task assignments`);
    }
  }

  private async cleanupTaskHistory(taskId: ID): Promise<void> {
    const histories = await this.taskHistoryRepository.find({ taskId });

    if (histories.length > 0) {
      await Promise.all(histories.map(history =>
        this.taskHistoryRepository.delete(toObjectId(String(history._id)))
      ));
      console.log(`Deleted ${histories.length} task history records`);
    }
  }

  private async cleanupTaskComments(taskId: ID): Promise<void> {
    const comments = await this.taskCommentRepository.find({ taskId });

    if (comments.length > 0) {
      await Promise.all(comments.map(comment =>
        this.taskCommentRepository.delete(toObjectId(String(comment._id)))
      ));
      console.log(`Deleted ${comments.length} task comments`);
    }
  }
}