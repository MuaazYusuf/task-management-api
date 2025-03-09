import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { rateLimiterMiddleware } from '../middlewares/rate-limiter.middleware';

export const createAuthRouter = (authController: AuthController, authMiddleware: AuthMiddleware): Router => {
  const router = Router();

  // Apply stricter rate limiting for auth routes
  router.use(rateLimiterMiddleware('auth'));

  // Public routes
  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/refresh-token', authController.refreshToken);

  // Protected routes
  router.post(
    '/change-password',
    authMiddleware.authenticate,
    authController.changePassword
  );

  router.post(
    '/logout',
    authMiddleware.authenticate,
    authController.logout
  );

  return router;
};