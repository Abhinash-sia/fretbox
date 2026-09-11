import { Request, Response, NextFunction } from 'express';
import { getEnv } from '../config/env.js';

export const requestTimeoutMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const env = getEnv();
  const timeoutMs = env.REQUEST_TIMEOUT_MS || 10000;

  // Skip timeouts for health checks
  if (req.path.includes('/health')) {
    return next();
  }

  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: `Request execution timed out after ${timeoutMs}ms`,
        },
      });
    }
  }, timeoutMs);

  // Clear timeout timer once response finishes
  res.on('finish', () => {
    clearTimeout(timer);
  });

  res.on('close', () => {
    clearTimeout(timer);
  });

  next();
};
