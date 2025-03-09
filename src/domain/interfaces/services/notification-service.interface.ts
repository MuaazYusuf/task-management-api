import { ID } from "../../../common/types/id.type";
import { PaginationResult } from "../../../common/types/pagination.type";
import { INotification, NotificationType } from "../../models/Notification.model";


export interface INotificationService {
    getUserNotifications(userId: ID, page: number, limit: number, onlyUnread?: boolean): Promise<PaginationResult<INotification>>;
    markAsRead(notificationId: ID): Promise<boolean>;
    markAllAsRead(userId: ID): Promise<boolean>;
    createNotification(
        userId: ID,
        type: NotificationType,
        content: string,
        relatedTo: {
            model: string;
            id: ID;
        }
    ): Promise<INotification>;
}