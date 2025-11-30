import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { withError } from '@/lib/middleware/withError';
import { AuthContext, withAdminAuth } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getOrderByIdAdmin } from '@/lib/services/order.service';

/**
 * GET /api/admin/orders/[id]
 * Récupère une commande (admin uniquement)
 * L'admin peut voir TOUTES les commandes
 */
async function getOrderAdminHandler(
  request: NextRequest,
  authContext: AuthContext,
  { params }: { params: Promise<{ id: string }> }
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

  try {
    const order = await getOrderByIdAdmin(orderId);

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
          customerNotes: order.customerNotes,
          internalNotes: order.internalNotes,
          user: order.user,
          items: order.items.map(item => ({
            id: item.id,
            productSnapshot: item.productSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
            currency: item.currency,
            product: item.product,
            variant: item.variant,
          })),
          payments: order.payments,
          shipments: order.shipments,
          statusHistory: order.statusHistory,
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

    logger.error(
      { requestId, orderId, error: message },
      'Admin failed to fetch order'
    );

    return NextResponse.json(
      { success: false, error: 'Failed to fetch order', requestId },
      { status: 500 }
    );
  }
}

export const GET = withError(
  withAdminAuth(withRateLimit(getOrderAdminHandler, RateLimits.ADMIN))
);
