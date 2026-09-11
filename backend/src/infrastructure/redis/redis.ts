import { Redis } from 'ioredis';
import { logger } from '../../config/logger.js';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client has not been initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const connectRedis = async (redisUrl: string): Promise<Redis> => {
  if (redisClient && (redisClient.status === 'ready' || redisClient.status === 'connecting')) {
    logger.info('Redis client already initialized');
    return redisClient;
  }

  return new Promise((resolve, reject) => {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.error('Redis retry strategy exhausted after 3 attempts');
          return null; // stop retrying
        }
        return Math.min(times * 100, 2000);
      },
    });

    client.on('connect', () => {
      logger.info('Redis socket connection established');
    });

    client.on('ready', () => {
      logger.info({ redisUrl }, 'Redis client ready and connected');
    });

    client.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });

    client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    client
      .connect()
      .then(() => {
        redisClient = client;
        resolve(client);
      })
      .catch((err) => {
        logger.error({ err, redisUrl }, 'Failed to connect to Redis');
        reject(err);
      });
  });
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error({ error }, 'Error while disconnecting Redis');
      // Force disconnect if graceful quit fails
      if (redisClient) {
        redisClient.disconnect();
        redisClient = null;
      }
    }
  }
};

export const getRedisStatus = (): { isConnected: boolean; status: string } => {
  if (!redisClient) {
    return { isConnected: false, status: 'uninitialized' };
  }
  return {
    isConnected: redisClient.status === 'ready',
    status: redisClient.status,
  };
};
