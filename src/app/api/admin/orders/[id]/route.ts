import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getOrderByIdAdmin, updateOrderStatus } from '@/lib/services/orders';

import { OrderStatus } from '../../../../../generated/prisma';

/**
 * GET /api/admin/orders/[id]
 * Récupère une commande (admin uniquement)
 */
async function getOrderAdminHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: orderId } = await params;
  const authContext = auth as AuthContext;

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

/**
 * PATCH /api/admin/orders/[id]
 * Met à jour le statut d'une commande
 */
async function updateOrderAdminHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: orderId } = await params;
  const authContext = auth as AuthContext;

  try {
    const body = await request.json();
    const { status, comment } = body as {
      status: OrderStatus;
      comment?: string;
    };

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    logger.info(
      {
        requestId,
        action: 'admin_update_order',
        orderId,
        status,
        adminId: authContext.userId,
      },
      'Admin updating order status'
    );

    const result = await updateOrderStatus({
      orderId,
      status,
      comment,
      userId: authContext.userId,
    });

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (error) {
    logger.error(
      { requestId, error, orderId },
      'Failed to update order status'
    );
    throw error; // Let withError handle it
  }
}

export const GET = withError(
  withAdmin(withRateLimit(getOrderAdminHandler, RateLimits.ADMIN))
);

export const PATCH = withError(
  withAdmin(withRateLimit(updateOrderAdminHandler, RateLimits.ADMIN))
);
