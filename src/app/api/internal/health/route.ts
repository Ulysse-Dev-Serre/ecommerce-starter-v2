import { NextResponse } from 'next/server';
import { env } from '@/lib/core/env';

import { logger } from '../../../../lib/core/logger';
import { withError } from '../../../../lib/middleware/withError';
import { getUserCount } from '../../../../lib/services/users';

async function healthCheck(): Promise<NextResponse> {
  logger.info({ action: 'health_check' }, 'Performing health check');

  const userCount = await getUserCount();

  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: true,
      userCount,
    },
    environment: env.NODE_ENV,
    version: process.env.npm_package_version ?? '0.1.0',
  };

  logger.info(
    {
      action: 'health_check_success',
      userCount,
    },
    'Health check completed successfully'
  );

  return NextResponse.json({
    success: true,
    data: healthInfo,
  });
}

export const GET = withError(healthCheck);
