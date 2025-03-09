import { INotificationRepository } from '../../../domain/interfaces/notification-repository.interface';
import { INotification, Notification } from '../../../domain/models/Notification.model';
import { BaseRepository } from './base.repository';
import { PaginationResult } from '../../../common/types/pagination.type';
import { ID, toObjectId } from '../../../common/types/id.type';

export class NotificationRepository extends BaseRepository<INotification> implements INotificationRepository {
    constructor() {
        super(Notification);
    }

    async findUserNotifications(
        userId: ID,
        page: number,
        limit: number,
        onlyUnread: boolean = false
    ): Promise<PaginationResult<INotification>> {
        try {
            const skip = (page - 1) * limit;

            const filter: any = { userId: userId };
            if (onlyUnread) {
                filter.isRead = false;
            }

            const [notifications, totalCount] = await Promise.all([
                this.model.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.model.countDocuments(filter)
            ]);

            return {
                data: notifications,
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

    async markAsRead(notificationId: ID): Promise<boolean> {
        try {
            const notifObjId = toObjectId(notificationId);
            const result = await this.update(notifObjId, { isRead: true });
            return !!result;
        } catch (error) {
            throw error;
        }
    }

    async markAllAsRead(userId: ID): Promise<boolean> {
        try {
            const userObjId = toObjectId(userId);
            const result = await this.model.updateMany(
                {
                    userId: userObjId,
                    isRead: false
                },
                { isRead: true }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            throw error;
        }
    }
}