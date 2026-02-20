import { NextRequest, NextResponse } from 'next/server';

import { ApiContext } from '@/lib/middleware/types';
import { withError } from '@/lib/middleware/withError';
import { getSystemHealth } from '@/lib/services/health';

/**
 * GET /api/internal/health
 * Performs a basic health check of the application and its dependencies.
 */
async function healthCheckHandler(
  request: NextRequest,
  _context: ApiContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

  const healthInfo = await getSystemHealth();

  return NextResponse.json({
    success: healthInfo.status === 'healthy',
    data: healthInfo,
    requestId,
  });
}

export const GET = withError(healthCheckHandler);
