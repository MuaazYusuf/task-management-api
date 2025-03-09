import mongoose from 'mongoose';
import { IUserTaskRepository } from '../../../domain/interfaces/user-task-repository.interface';
import { IUserTask, UserTask } from '../../../domain/models/UserTask.model';
import { BaseRepository } from './base.repository';
import { ID, toObjectId } from '../../../common/types/id.type';

export class UserTaskRepository extends BaseRepository<IUserTask> implements IUserTaskRepository {
    constructor() {
        super(UserTask);
    }

    async findUsersByTaskId(taskId: ID): Promise<ID[]> {
        try {
            const taskObjId = toObjectId(taskId);
            const userTasks = await this.model.find({ taskId: taskObjId }).select('userId');
            return userTasks.map(ut => ut.userId);
        } catch (error) {
            throw error;
        }
    }

    async findTasksByUserId(userId: ID): Promise<ID[]> {
        try {
            const userObjId = toObjectId(userId);
            const userTasks = await this.model.find({ userId: userObjId }).select('taskId');
            return userTasks.map(ut => ut.taskId);
        } catch (error) {
            throw error;
        }
    }

    async assignTaskToUser(taskId: ID, userId: ID, assignedBy: ID): Promise<IUserTask> {
        try {
            // Convert string IDs to ObjectIds
            const taskObjId = toObjectId(taskId);
            const userObjId = toObjectId(userId);
            const assignedByObjId = toObjectId(assignedBy);

            // Check if assignment already exists
            const existingAssignment = await this.findOne({
                taskId: taskObjId,
                userId: userObjId
            });

            if (existingAssignment) {
                return existingAssignment;
            }

            // Create new assignment
            return await this.create({
                taskId: taskObjId,
                userId: userObjId,
                assignedBy: assignedByObjId,
                assignedAt: new Date()
            });
        } catch (error) {
            throw error;
        }
    }

    async removeTaskFromUser(taskId: ID, userId: ID): Promise<boolean> {
        try {
            // Convert string IDs to ObjectIds
            const taskObjId = toObjectId(taskId);
            const userObjId = toObjectId(userId);

            // Find and delete the assignment
            const result = await this.model.findOneAndDelete({
                taskId: taskObjId,
                userId: userObjId
            });

            return !!result;
        } catch (error) {
            throw error;
        }
    }
}