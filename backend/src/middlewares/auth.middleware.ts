import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../modules/auth/services/token.service.js';
import { User } from '../modules/auth/models/user.model.js';
import { UnauthorizedError } from '../types/index.js';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is missing', 'AUTH_UNAUTHORIZED');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError(
        'Authorization header format must be Bearer <token>',
        'AUTH_UNAUTHORIZED',
      );
    }

    const token = parts[1];
    if (!token) {
      throw new UnauthorizedError('Access token is missing', 'AUTH_UNAUTHORIZED');
    }

    // Verify token signature and expiration
    const payload = tokenService.verifyAccessToken(token);

    // Verify associated user exists and is active
    const user = await User.findById(payload.sub).select('_id email role isActive');
    if (!user) {
      throw new UnauthorizedError(
        'User account associated with token not found',
        'AUTH_UNAUTHORIZED',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive', 'AUTH_ACCOUNT_INACTIVE');
    }

    // Attach authenticated user context to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
