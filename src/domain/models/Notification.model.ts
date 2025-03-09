import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  COMMENT_ADDED = 'comment_added',
  DEADLINE_REMINDER = 'deadline_reminder'
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  content: string;
  relatedTo: {
    model: string;
    id: mongoose.Types.ObjectId;
  };
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
    },
    content: {
      type: String,
      required: true
    },
    relatedTo: {
      model: {
        type: String,
        required: true,
        enum: ['Task', 'TaskComment']
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true
      }
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for user's notifications
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ 'relatedTo.id': 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);