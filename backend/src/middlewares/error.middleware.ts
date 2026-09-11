import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/index.js';
import { sendError } from '../utils/response.js';
import { logger } from '../config/logger.js';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // 1. Known AppError (operational error)
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, 'Non-operational AppError occurred');
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // 2. Syntax error from body-parser (malformed JSON)
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    sendError(res, 400, 'MALFORMED_JSON', 'Invalid JSON payload received');
    return;
  }

  // 3. Unexpected / Unknown error
  console.error('UNEXPECTED B8 TEST ERROR:', err);
  logger.error({ err }, 'Unexpected system error encountered');

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Internal server error' : err.message || 'Internal server error';

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
};
