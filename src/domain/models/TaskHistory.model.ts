import mongoose, { Document, Schema } from 'mongoose';

export enum HistoryActionType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  DELETED = 'deleted'
}

export interface ITaskHistory extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: HistoryActionType;
  previousValue?: string;
  newValue?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const TaskHistorySchema = new Schema<ITaskHistory>(
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
    action: {
      type: String,
      enum: Object.values(HistoryActionType),
      required: true
    },
    previousValue: {
      type: String
    },
    newValue: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: false
  }
);

// Index for task history queries
TaskHistorySchema.index({ taskId: 1, timestamp: -1 });
TaskHistorySchema.index({ userId: 1 });
TaskHistorySchema.index({ action: 1 });

export const TaskHistory = mongoose.model<ITaskHistory>('TaskHistory', TaskHistorySchema);