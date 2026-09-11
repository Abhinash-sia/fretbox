import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service.js';
import { sendSuccess } from '../../../utils/response.js';

export const getHealth = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const healthData = healthService.getHealth();
    sendSuccess(res, healthData, 200);
  } catch (error) {
    next(error);
  }
};

export const getReadiness = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const readinessData = healthService.getReadiness();
    const statusCode = readinessData.status === 'unhealthy' ? 503 : 200;
    sendSuccess(res, readinessData, statusCode);
  } catch (error) {
    next(error);
  }
};
