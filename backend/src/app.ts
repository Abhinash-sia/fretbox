import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import apiV1Router from './routes/index.js';
import { getEnv } from './config/env.js';

import compression from 'compression';
import { requestTimeoutMiddleware } from './middlewares/timeout.middleware.js';

export const createApp = (): Express => {
  const app = express();

  // 0. Response Compression & Request Timeout
  app.use(compression());
  app.use(requestTimeoutMiddleware);

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS
  const env = getEnv();
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // 3. General API Rate Limiting Baseline
  const baselineRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => env.NODE_ENV === 'test' || req.path.includes('/health'),
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later.',
      },
    },
  });

  app.use('/api/', baselineRateLimiter);

  // Stricter Rate Limiter for Sensitive Authentication Endpoints
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 auth requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      success: false,
      error: {
        code: 'AUTH_TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
      },
    },
  });

  app.use('/api/v1/auth/login', authRateLimiter);
  app.use('/api/v1/auth/register', authRateLimiter);

  // 4. Request Body Parsing with strict size limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 5. Pino HTTP Logging Middleware
  app.use(loggerMiddleware);

  // 6. Versioned API Routes
  app.use('/api/v1', apiV1Router);

  // 7. 404 Handler
  app.use(notFoundMiddleware);

  // 8. Centralized Error Middleware
  app.use(errorMiddleware);

  return app;
};
