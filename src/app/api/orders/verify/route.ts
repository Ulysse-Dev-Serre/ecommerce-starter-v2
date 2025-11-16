import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/db/prisma';
import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';

async function verifyOrderHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  logger.info(
    {
      requestId,
      sessionId,
    },
    'Verifying order for session'
  );

  try {
    // Rechercher un paiement avec cet externalId (Stripe session → payment_intent)
    // On cherche via les metadata de la session stockées dans payment
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { externalId: { contains: sessionId } },
          { transactionData: { path: ['id'], equals: sessionId } },
        ],
        status: 'COMPLETED',
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
      logger.info(
        {
          requestId,
          sessionId,
          orderNumber: payment.order.orderNumber,
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

export const GET = withError(verifyOrderHandler);
