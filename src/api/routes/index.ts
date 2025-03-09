import { Router } from 'express';
import { createAuthRouter } from './auth.routes';
import { createTaskRouter } from './task.routes';
import { AuthController } from '../controllers/auth.controller';
import { TaskController } from '../controllers/task.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { createNotificationRouter } from './notification.routes';
import { NotificationController } from '../controllers/notification.controller';

export const createAPIRouter = (
  authController: AuthController,
  taskController: TaskController,
  authMiddleware: AuthMiddleware,
  notificationController: NotificationController,
): Router => {
  const router = Router();

  // Register route groups
  router.use('/auth', createAuthRouter(authController, authMiddleware));
  router.use('/tasks', createTaskRouter(taskController, authMiddleware));
  router.use('/notifications', createNotificationRouter(notificationController, authMiddleware));

  return router;
};