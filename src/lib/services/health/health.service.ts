import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import { getUserCount } from '@/lib/services/users';

export interface HealthInfo {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    connected: boolean;
    userCount: number;
  };
  environment: string;
  version: string;
}

/**
 * Perform a system health check
 */
export async function getSystemHealth(): Promise<HealthInfo> {
  try {
    const userCount = await getUserCount();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount,
      },
      environment: env.NODE_ENV,
      version: process.env.npm_package_version ?? '0.1.0',
    };
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        userCount: 0,
      },
      environment: env.NODE_ENV,
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }
}
