import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { UnauthorizedError } from '../../../types/index.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.register(req.body);
    sendSuccess(res, user, 201, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    sendSuccess(res, result, 200, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    sendSuccess(res, { message: 'Logged out successfully' }, 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user, 200);
  } catch (error) {
    next(error);
  }
};

export const testStudent = (req: Request, res: Response): void => {
  sendSuccess(res, {
    message: 'Access granted to Student demonstration endpoint',
    user: req.user,
  });
};

export const testFaculty = (req: Request, res: Response): void => {
  sendSuccess(res, {
    message: 'Access granted to Faculty demonstration endpoint',
    user: req.user,
  });
};

export const testAdmin = (req: Request, res: Response): void => {
  sendSuccess(res, {
    message: 'Access granted to Administrator demonstration endpoint',
    user: req.user,
  });
};
