import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { AuthContext, withAuth } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getOrderById } from '@/lib/services/orders';

/**
 * GET /api/orders/[id]
 * Récupère une commande pour l'utilisateur connecté
 * L'utilisateur ne peut voir que SES propres commandes
 */
async function getOrderHandler(
  request: NextRequest,
  authContext: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: orderId } = await params;
  const userId = authContext.userId;

  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  logger.info(
    {
      requestId,
      action: 'get_order',
      orderId,
      userId,
    },
    'Fetching order for user'
  );

  try {
    const order = await getOrderById(orderId, userId);

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          currency: order.currency,
          subtotalAmount: order.subtotalAmount.toString(),
          taxAmount: order.taxAmount.toString(),
          shippingAmount: order.shippingAmount.toString(),
          discountAmount: order.discountAmount.toString(),
          totalAmount: order.totalAmount.toString(),
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          items: order.items.map(item => ({
            id: item.id,
            productSnapshot: item.productSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
            currency: item.currency,
          })),
          payments: order.payments.map(payment => ({
            id: payment.id,
            amount: payment.amount.toString(),
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            processedAt: payment.processedAt,
          })),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Order not found', requestId },
        { status: 404 }
      );
    }

    if (message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', requestId },
        { status: 403 }
      );
    }

    logger.error(
      { requestId, orderId, error: message },
      'Failed to fetch order'
    );

    return NextResponse.json(
      { success: false, error: 'Failed to fetch order', requestId },
      { status: 500 }
    );
  }
}

export const GET = withError(
  withAuth(withRateLimit(getOrderHandler, RateLimits.PUBLIC))
);
