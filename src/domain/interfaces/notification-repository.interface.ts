import { IRepository } from './repository.interface';
import { INotification } from '../models/Notification.model';
import { PaginationResult } from '../../common/types/pagination.type';
import { ID } from '../../common/types/id.type';

export interface INotificationRepository extends IRepository<INotification> {
    findUserNotifications(
        userId: ID,
        page: number,
        limit: number,
        onlyUnread?: boolean
    ): Promise<PaginationResult<INotification>>;

    markAsRead(notificationId: ID): Promise<boolean>;
    markAllAsRead(userId: ID): Promise<boolean>;
}