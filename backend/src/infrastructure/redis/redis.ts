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

/**
 * Safe Redis GET operation.
 * Returns null if Redis is uninitialized, disconnected, or throws an error.
 */
export const safeGetCache = async <T>(key: string): Promise<T | null> => {
  try {
    if (!redisClient || redisClient.status !== 'ready') {
      return null;
    }
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    logger.warn({ err, key }, 'Redis cache get failed, falling back to database');
    return null;
  }
};

/**
 * Safe Redis SET operation with TTL in seconds.
 * Silently logs warning if Redis fails or is unavailable.
 */
export const safeSetCache = async (
  key: string,
  value: unknown,
  ttlSeconds: number = 300,
): Promise<boolean> => {
  try {
    if (!redisClient || redisClient.status !== 'ready') {
      return false;
    }
    const serialized = JSON.stringify(value);
    await redisClient.set(key, serialized, 'EX', ttlSeconds);
    return true;
  } catch (err) {
    logger.warn({ err, key }, 'Redis cache set failed');
    return false;
  }
};

/**
 * Safe Redis DEL operation.
 */
export const safeDeleteCache = async (key: string): Promise<boolean> => {
  try {
    if (!redisClient || redisClient.status !== 'ready') {
      return false;
    }
    await redisClient.del(key);
    return true;
  } catch (err) {
    logger.warn({ err, key }, 'Redis cache delete failed');
    return false;
  }
};

/**
 * Safe Redis delete keys by pattern prefix.
 */
export const safeDeletePattern = async (pattern: string): Promise<boolean> => {
  try {
    if (!redisClient || redisClient.status !== 'ready') {
      return false;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (err) {
    logger.warn({ err, pattern }, 'Redis cache pattern delete failed');
    return false;
  }
};
