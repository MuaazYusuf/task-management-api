import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../../common/errors';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { getNotificationsQuerySchema } from '../validators/notification.validator';
import { INotificationService } from '../../domain/interfaces/services/notification-service.interface';

export class NotificationController {
    constructor(private notificationService: INotificationService) { }

    getUserNotifications = [
        validateRequest(getNotificationsQuerySchema, 'query'),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const userId = req.user!.userId;
                const {
                    page = 1,
                    limit = 10,
                    onlyUnread = false
                } = req.query as any;

                const notifications = await this.notificationService.getUserNotifications(
                    userId,
                    page,
                    limit,
                    onlyUnread
                );

                res.status(200).json({
                    status: 'success',
                    data: notifications
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const notificationId = req.params.id;
            const marked = await this.notificationService.markAsRead(notificationId);

            if (!marked) {
                throw new NotFoundError('Notification not found');
            }

            res.status(200).json({
                status: 'success',
                message: 'Notification marked as read'
            });
        } catch (error) {
            next(error);
        }
    };

    markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            await this.notificationService.markAllAsRead(userId);

            res.status(200).json({
                status: 'success',
                message: 'All notifications marked as read'
            });
        } catch (error) {
            next(error);
        }
    };
}