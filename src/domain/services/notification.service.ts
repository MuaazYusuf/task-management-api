import { ID, toObjectId } from "../../common/types/id.type";
import { PaginationResult } from "../../common/types/pagination.type";
import { INotificationRepository } from "../interfaces/notification-repository.interface";
import { INotificationService } from "../interfaces/services/notification-service.interface";
import { INotification, NotificationType } from "../models/Notification.model";

export class NotificationService implements INotificationService {
    constructor(private notificationRepository: INotificationRepository) {}
  
    async getUserNotifications(
      userId: ID, 
      page: number, 
      limit: number, 
      onlyUnread: boolean = false
    ): Promise<PaginationResult<INotification>> {
      try {
        return await this.notificationRepository.findUserNotifications(
          userId, 
          page, 
          limit, 
          onlyUnread
        );
      } catch (error) {
        throw error;
      }
    }
  
    async markAsRead(notificationId: ID): Promise<boolean> {
      try {
        const notifObjId = toObjectId(notificationId);
        return await this.notificationRepository.markAsRead(notifObjId);
      } catch (error) {
        throw error;
      }
    }
  
    async markAllAsRead(userId: ID): Promise<boolean> {
      try {
        const userObjId = toObjectId(userId);
        return await this.notificationRepository.markAllAsRead(userObjId);
      } catch (error) {
        throw error;
      }
    }
  
    async createNotification(
      userId: ID,
      type: NotificationType,
      content: string,
      relatedTo: {
        model: string;
        id: ID;
      }
    ): Promise<INotification> {
      try {
        const userObjId = toObjectId(userId);
        const relatedToId = toObjectId(relatedTo.id);
        
        return await this.notificationRepository.create({
          userId: userObjId,
          type,
          content,
          relatedTo: {
            model: relatedTo.model,
            id: relatedToId
          },
          isRead: false
        });
      } catch (error) {
        throw error;
      }
    }
  }