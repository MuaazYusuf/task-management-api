import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '../validators/auth.validator';
import { IAuthService } from '../../domain/interfaces/services/auth-service.interface';
import { validateRequest } from '../middlewares/validate-request.middleware';

export class AuthController {
  constructor(private authService: IAuthService) {}

  register = [
    validateRequest(registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userData = req.body;
        const user = await this.authService.register(userData);
        
        res.status(201).json({
          status: 'success',
          data: {
            user
          }
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  login = [
    validateRequest(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email, password } = req.body;
        const tokens = await this.authService.login(email, password);
        
        res.status(200).json({
          status: 'success',
          data: tokens
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  refreshToken = [
    validateRequest(refreshTokenSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { refreshToken } = req.body;
        const tokens = await this.authService.refreshToken(refreshToken);
        
        res.status(200).json({
          status: 'success',
          data: tokens
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  changePassword = [
    validateRequest(changePasswordSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user!.userId;
        
        await this.authService.changePassword(userId, oldPassword, newPassword);
        
        res.status(200).json({
          status: 'success',
          message: 'Password changed successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      await this.authService.logout(userId);
      
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}