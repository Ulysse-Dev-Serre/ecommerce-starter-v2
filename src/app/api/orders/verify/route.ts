import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/core/db';
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
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
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
          orderNumber: true,
          id: true,
          createdAt: true,
        },
      },
    },
  });

  if (payment?.order) {
    return NextResponse.json({
      exists: true,
      orderNumber: payment.order.orderNumber,
      orderId: payment.order.id,
      createdAt: payment.order.createdAt,
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
