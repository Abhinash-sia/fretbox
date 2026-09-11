import { Request, Response, NextFunction } from 'express';
import { UserRole, UnauthorizedError, ForbiddenError } from '../types/index.js';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required prior to authorization check'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`,
          'AUTH_FORBIDDEN',
        ),
      );
    }

    next();
  };
};
