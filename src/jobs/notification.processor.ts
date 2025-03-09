import { INotificationRepository } from '../domain/interfaces/notification-repository.interface';
import { NotificationType } from '../domain/models/Notification.model';
import { ID, toObjectId } from '../common/types/id.type';

export interface CreateNotificationJobData {
    userId: ID;
    type: NotificationType;
    content: string;
    relatedTo: {
        model: string;
        id: ID;
    };
}

export interface CreateNotificationsJobData {
    userIds: ID[];
    type: NotificationType;
    content: string;
    relatedTo: {
        model: string;
        id: ID;
    };
}

export class NotificationProcessor {
    constructor(private notificationRepository: INotificationRepository) { }

    async processCreateNotification(data: CreateNotificationJobData): Promise<void> {
        try {
            const userObjId = toObjectId(data.userId);
            const relatedToId = toObjectId(data.relatedTo.id);

            await this.notificationRepository.create({
                userId: userObjId,
                type: data.type,
                content: data.content,
                relatedTo: {
                    model: data.relatedTo.model,
                    id: relatedToId
                },
                isRead: false
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
            throw error;
        }
    }

    async processCreateNotifications(data: CreateNotificationsJobData): Promise<void> {
        try {
            const notificationPromises = data.userIds.map(userId => {
                const userObjId = toObjectId(userId);
                const relatedToId = toObjectId(data.relatedTo.id);

                return this.notificationRepository.create({
                    userId: userObjId,
                    type: data.type,
                    content: data.content,
                    relatedTo: {
                        model: data.relatedTo.model,
                        id: relatedToId
                    },
                    isRead: false
                });
            });

            await Promise.all(notificationPromises);
        } catch (error) {
            console.error('Failed to create notifications:', error);
            throw error;
        }
    }
}