import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { AuthContext, withAuth } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { ApiContext } from '@/lib/middleware/types';
import {
  OrderWithIncludes,
  OrderItem,
  OrderPayment,
} from '@/lib/types/domain/order';
import { getOrderById } from '@/lib/services/orders';

/**
 * Helper to map Prisma order object to API response DTO
 */
function mapOrderResponse(order: OrderWithIncludes) {
  return {
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
    items: order.items.map((item: OrderItem) => ({
      id: item.id,
      productSnapshot: item.productSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: item.totalPrice.toString(),
      currency: item.currency,
    })),
    payments: order.payments.map((payment: OrderPayment) => ({
      id: payment.id,
      amount: payment.amount.toString(),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      processedAt: payment.processedAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * GET /api/orders/[id]
 * Récupère une commande pour l'utilisateur connecté
 * L'utilisateur ne peut voir que SES propres commandes
 */
async function getOrderHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { id: orderId } = await params;
  const authContext = auth as AuthContext;
  const userId = authContext.userId;

  logger.info(
    { requestId, action: 'get_order', orderId, userId },
    'Fetching order for user'
  );

  // The service already handles ownership verification and throws AppError if needed
  const order = await getOrderById(orderId, userId);

  return NextResponse.json({
    success: true,
    requestId,
    data: mapOrderResponse(order),
  });
}

export const GET = withError(
  withAuth(withRateLimit(getOrderHandler, RateLimits.PUBLIC))
);
