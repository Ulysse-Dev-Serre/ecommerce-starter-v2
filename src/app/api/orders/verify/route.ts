import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/core/db';
import { logger } from '../../../../lib/core/logger';
import { AuthContext, withAuth } from '../../../../lib/middleware/withAuth';
import { withError } from '../../../../lib/middleware/withError';
import {
  withRateLimit,
  RateLimits,
} from '../../../../lib/middleware/withRateLimit';

async function verifyOrderHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent_id');

  const identifier = sessionId || paymentIntentId;

  if (!identifier) {
    return NextResponse.json(
      { error: 'session_id or payment_intent_id is required' },
      { status: 400 }
    );
  }

  logger.info(
    {
      requestId,
      identifier,
      userId: authContext.userId,
    },
    'Verifying order for session'
  );

  try {
    // SECURITY: Search payment with ownership check
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { externalId: { contains: identifier } },
          { transactionData: { path: ['id'], equals: identifier } },
        ],
        status: 'COMPLETED',
        // CRITICAL: Verify ownership
        order: {
          userId: authContext.userId,
        },
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
      // SECURITY: Double-check ownership (defense in depth)
      if (payment.order.userId !== authContext.userId) {
        logger.warn(
          {
            requestId,
            sessionId,
            orderUserId: payment.order.userId,
            requestUserId: authContext.userId,
            reason: 'Ownership mismatch',
          },
          'Security: Attempted unauthorized order access'
        );
        return NextResponse.json({ exists: false }, { status: 403 });
      }

      logger.info(
        {
          requestId,
          sessionId,
          orderNumber: payment.order.orderNumber,
          userId: authContext.userId,
        },
        'Order found for session'
      );

      return NextResponse.json({
        exists: true,
        orderNumber: payment.order.orderNumber,
        orderId: payment.order.id,
        createdAt: payment.order.createdAt,
      });
    }

    // Fallback : chercher via les metadata dans webhookEvent
    const webhookEvent = await prisma.webhookEvent.findFirst({
      where: {
        source: 'stripe',
        processed: true,
        eventType: {
          in: ['payment_intent.succeeded', 'checkout.session.completed'],
        },
      },
      orderBy: {
        processedAt: 'desc',
      },
      take: 1,
    });

    if (webhookEvent) {
      // Vérifier si une commande a été créée récemment
      const recentOrder = await prisma.order.findFirst({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60000), // Dans les 60 dernières secondes
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          orderNumber: true,
          id: true,
          createdAt: true,
        },
      });

      if (recentOrder) {
        return NextResponse.json({
          exists: true,
          orderNumber: recentOrder.orderNumber,
          orderId: recentOrder.id,
          createdAt: recentOrder.createdAt,
        });
      }
    }

    logger.info(
      {
        requestId,
        sessionId,
      },
      'Order not found yet for session'
    );

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    logger.error(
      {
        requestId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to verify order'
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to verify order',
      },
      { status: 500 }
    );
  }
}

export const GET = withError(
  withRateLimit(withAuth(verifyOrderHandler), RateLimits.ORDER_VERIFY)
);
