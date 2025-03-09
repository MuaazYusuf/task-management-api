import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../../common/errors';
import { UserRole } from '../../domain/models/User.model';
import { IAuthService } from '../../domain/interfaces/services/auth-service.interface';
import logger from '../../common/logger/logger';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: UserRole;
            };
        }
    }
}

export class AuthMiddleware {
    constructor(private authService: IAuthService) { }

    authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Check for authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedError('Missing or invalid token');
            }

            // Extract token
            const token = authHeader.split(' ')[1];
            if (!token) {
                throw new UnauthorizedError('Missing token');
            }

            // Verify token
            const payload = await this.authService.validateToken(token);
            if (!payload) {
                throw new UnauthorizedError('Invalid or expired token');
            }

            // Add user info to request
            req.user = {
                userId: payload.userId,
                role: payload.role
            };

            next();
        } catch (error) {
            next(error);
        }
    };

    authorize = (roles: UserRole[]) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            try {
                // Check if user exists
                if (!req.user) {
                    throw new UnauthorizedError('User not authenticated');
                }

                // Check if user has required role
                if (!roles.includes(req.user.role)) {
                    throw new ForbiddenError('Insufficient permissions');
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    };
}