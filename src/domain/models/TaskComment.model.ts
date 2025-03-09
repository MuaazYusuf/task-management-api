import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskComment extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for quick comment lookups
TaskCommentSchema.index({ taskId: 1, createdAt: -1 });
TaskCommentSchema.index({ userId: 1 });

export const TaskComment = mongoose.model<ITaskComment>('TaskComment', TaskCommentSchema);