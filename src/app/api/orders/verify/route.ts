import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/core/db';
import { ApiContext } from '@/lib/middleware/types';
import { AuthContext, withAuth } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

/**
 * GET /api/orders/verify
 * Vérifie l'existence d'une commande après paiement (Stripe redirect).
 * Réservé aux utilisateurs connectés pour des raisons de sécurité.
 */
async function verifyOrderHandler(
  request: NextRequest,
  { auth }: ApiContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const authContext = auth as AuthContext;
  const userId = authContext.userId;

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent_id');

  const identifier = sessionId || paymentIntentId;

  if (!identifier) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      'session_id or payment_intent_id is required',
      400
    );
  }

  // SECURITY: Search payment with strict ownership check
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { externalId: { contains: identifier } },
        { transactionData: { path: ['id'], equals: identifier } },
      ],
      status: 'COMPLETED',
      order: {
        userId: userId,
      },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          subtotalAmount: true,
          taxAmount: true,
          shippingAmount: true,
          currency: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              variantId: true,
              productSnapshot: true,
              unitPrice: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (payment?.order) {
    return NextResponse.json({
      exists: true,
      order: {
        id: payment.order.id,
        orderNumber: payment.order.orderNumber,
        total: Number(payment.order.totalAmount),
        subtotal: Number(payment.order.subtotalAmount),
        tax: Number(payment.order.taxAmount),
        shipping: Number(payment.order.shippingAmount),
        currency: payment.order.currency,
        createdAt: payment.order.createdAt,
        items: payment.order.items.map(item => ({
          id: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price: Number(item.unitPrice),
          // Extract name from snapshot if possible
          name: (item.productSnapshot as any)?.name || 'Product',
        })),
      },
      requestId,
    });
  }

  return NextResponse.json({
    exists: false,
    requestId,
  });
}

export const GET = withError(
  withAuth(withRateLimit(verifyOrderHandler, RateLimits.ORDER_VERIFY))
);
