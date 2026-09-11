import { getDBStatus } from '../../../infrastructure/mongodb/db.js';
import { getRedisStatus } from '../../../infrastructure/redis/redis.js';

export interface HealthCheckData {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface DependencyStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    mongodb: {
      connected: boolean;
      readyState: number;
    };
    redis: {
      connected: boolean;
      status: string;
    };
  };
}

export class HealthService {
  public getHealth(): HealthCheckData {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  public getReadiness(): DependencyStatus {
    const dbStatus = getDBStatus();
    const redisStatus = getRedisStatus();

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (!dbStatus.isConnected) {
      status = 'unhealthy';
    } else if (!redisStatus.isConnected) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        mongodb: {
          connected: dbStatus.isConnected,
          readyState: dbStatus.readyState,
        },
        redis: {
          connected: redisStatus.isConnected,
          status: redisStatus.status,
        },
      },
    };
  }
}

export const healthService = new HealthService();
