import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getOrderByIdAdmin } from '@/lib/services/orders';

/**
 * GET /api/admin/orders/[id]
 * Récupère une commande (admin uniquement)
 */
async function getOrderAdminHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: orderId } = await params;

  logger.info(
    {
      requestId,
      action: 'admin_get_order',
      orderId,
      adminId: authContext.userId,
    },
    'Admin fetching order'
  );

  const order = await getOrderByIdAdmin(orderId);

  return NextResponse.json(
    {
      success: true,
      requestId,
      data: order,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );
}

export const GET = withError(
  withAdmin(withRateLimit(getOrderAdminHandler, RateLimits.ADMIN))
);
