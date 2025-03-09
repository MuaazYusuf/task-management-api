import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/models/User.model';
import { rateLimiterMiddleware } from '../middlewares/rate-limiter.middleware';

export const createTaskRouter = (taskController: TaskController, authMiddleware: AuthMiddleware): Router => {
  const router = Router();
  
  // Apply rate limiting for API routes
  router.use(rateLimiterMiddleware('api'));
  
  // All routes require authentication
  router.use(authMiddleware.authenticate);
  
  // Create task
  router.post(
    '/',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.createTask
  );
  
  // Get task by ID
  router.get(
    '/:id',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.getTaskById
  );
  
  // Update task
  router.put(
    '/:id',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.updateTask
  );
  
  // Delete task
  router.delete(
    '/:id',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER]),
    taskController.deleteTask
  );
  
  // Get tasks for user
  router.get(
    '/user/:userId',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.getUserTasks
  );
  
  // Get current user's tasks
  router.get(
    '/',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.getUserTasks
  );
  
  // Assign task to user
  router.post(
    '/:id/assign',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER]),
    taskController.assignTask
  );
  
  // Unassign task from user
  router.delete(
    '/:id/assign/:userId',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER]),
    taskController.unassignTask
  );
  
  // Add comment to task
  router.post(
    '/:id/comments',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.addComment
  );
  
  // Get task comments
  router.get(
    '/:id/comments',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.getTaskComments
  );
  
  // Get task history
  router.get(
    '/:id/history',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.getTaskHistory
  );
  
  // Get task status counts
  router.get(
    '/status/counts',
    authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]),
    taskController.getTaskStatusCounts
  );
  
  return router;
};