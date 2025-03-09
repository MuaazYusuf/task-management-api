import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/models/User.model';
import { rateLimiterMiddleware } from '../middlewares/rate-limiter.middleware';

export const createNotificationRouter = (
    notificationController: NotificationController,
    authMiddleware: AuthMiddleware
): Router => {
    const router = Router();

    // Apply rate limiting for API routes
    router.use(rateLimiterMiddleware('api'));

    // All routes require authentication
    router.use(authMiddleware.authenticate);

    // Get user notifications
    router.get(
        '/',
        authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
        notificationController.getUserNotifications
    );

    // Mark notification as read
    router.patch(
        '/:id/read',
        authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
        notificationController.markAsRead
    );

    // Mark all notifications as read
    router.patch(
        '/read-all',
        authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
        notificationController.markAllAsRead
    );

    return router;
};