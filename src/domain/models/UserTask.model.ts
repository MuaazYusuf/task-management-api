import mongoose, { Document, Schema } from 'mongoose';

export interface IUserTask extends Document {
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  assignedAt: Date;
  assignedBy: mongoose.Types.ObjectId;
}

const UserTaskSchema = new Schema<IUserTask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: false
  }
);

// Compound index for quick lookups by user or task
UserTaskSchema.index({ userId: 1, taskId: 1 }, { unique: true });
UserTaskSchema.index({ taskId: 1 });
UserTaskSchema.index({ userId: 1 });

export const UserTask = mongoose.model<IUserTask>('UserTask', UserTaskSchema);