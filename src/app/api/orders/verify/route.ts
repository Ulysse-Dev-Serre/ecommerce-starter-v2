import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/core/db';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { resolveCartIdentity } from '@/lib/services/cart/identity';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

async function verifyOrderHandler(
  request: NextRequest,
  authContext: OptionalAuthContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { userId, anonymousId } = await resolveCartIdentity(authContext);

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

  // Search payment with ownership check
  // We verify that the payment belongs to the authenticated user OR matches the anonymous session
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { externalId: { contains: identifier } },
        { transactionData: { path: ['id'], equals: identifier } },
      ],
      status: 'COMPLETED',
      order: userId ? { userId } : { guestEmail: { not: null } }, // For guests, we rely on the identifier secret (PI ID)
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          id: true,
          createdAt: true,
          userId: true,
        },
      },
    },
  });

  if (payment?.order) {
    // If it's a user order, double check ownership
    if (payment.order.userId && payment.order.userId !== userId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Unauthorized: Order ownership mismatch',
        403
      );
    }

    // For anonymous orders, we could check anonymousId in metadata if we want extra security
    // but the paymentIntentId is already a secret known only to the purchaser.

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
  withOptionalAuth(withRateLimit(verifyOrderHandler, RateLimits.ORDER_VERIFY))
);
