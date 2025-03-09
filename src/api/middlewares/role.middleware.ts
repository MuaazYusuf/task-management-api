import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../common/errors';

// Role hierarchy - higher roles have access to lower role permissions
const roleHierarchy: Record<string, number> = {
  'user': 0,
  'manager': 1,
  'admin': 2
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const { role } = req.user;
    
    // Check if user role is in allowed roles
    if (allowedRoles.includes(role)) {
      return next();
    }
    
    // Check if user role has higher privileges than any allowed role
    const userRoleLevel = roleHierarchy[role] || 0;
    const hasHigherRole = allowedRoles.some(allowedRole => 
      userRoleLevel > (roleHierarchy[allowedRole] || 0)
    );
    
    if (hasHigherRole) {
      return next();
    }
    
    return next(new AppError('You do not have permission to perform this action', 403));
  };
};