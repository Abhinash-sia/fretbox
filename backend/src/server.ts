import { Server } from 'http';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './infrastructure/mongodb/db.js';
import { connectRedis, disconnectRedis } from './infrastructure/redis/redis.js';
import {
  initRealtimeServer,
  closeRealtimeServer,
} from './modules/communication/services/realtime.service.js';

let server: Server | null = null;
let isShuttingDown = false;

const startServer = async (): Promise<void> => {
  try {
    // 1. Validate environment configuration at startup
    const env = getEnv();
    logger.info(
      { nodeEnv: env.NODE_ENV, port: env.PORT },
      'Initializing Fretbox Backend Service...',
    );

    // 2. Initialize Database & Redis connections
    await connectDB(env.MONGODB_URI);
    await connectRedis(env.REDIS_URL);

    // 3. Create Express Application & Start HTTP Listener
    const app = createApp();
    server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `Server running on http://localhost:${env.PORT}/api/v1/health`,
      );
    });

    // 4. Initialize Socket.IO Realtime Service
    initRealtimeServer(server);
  } catch (error) {
    logger.fatal({ error }, 'Failed to start application server');
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    logger.warn({ signal }, 'Shutdown already in progress, ignoring extra signal');
    return;
  }
  isShuttingDown = true;

  logger.info({ signal }, `Received ${signal}. Starting graceful shutdown sequence...`);

  // Force exit timeout after 10 seconds if shutdown hangs
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10 seconds. Forcing process exit.');
    process.exit(1);
  }, 10000);

  try {
    // 1. Close Realtime Socket.IO Server
    await closeRealtimeServer();

    // 2. Stop HTTP Server (stop receiving new requests)
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) return reject(err);
          logger.info('HTTP server stopped successfully');
          resolve();
        });
      });
    }

    // 2. Close Redis Connection
    await disconnectRedis();

    // 3. Close MongoDB Connection
    await disconnectDB();

    clearTimeout(forceExitTimeout);
    logger.info('Graceful shutdown complete. Exiting process.');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimeout);
    logger.error({ error }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Process Signal Listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process Exception Listeners
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception detected');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled Rejection detected');
  gracefulShutdown('unhandledRejection');
});

// Start application
startServer();
