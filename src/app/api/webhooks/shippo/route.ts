import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  updateOrderStatus,
  sendStatusChangeEmail,
} from '@/lib/services/orders';
import { OrderStatus } from '@/generated/prisma';
import { env } from '@/lib/core/env';

import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withError } from '@/lib/middleware/withError';

async function handleShippoWebhook(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // 1. Vérification de sécurité (Secret Token)
  // L'URL dans Shippo doit être: /api/webhooks/shippo?token=VOTRE_SECRET
  if (env.SHIPPO_WEBHOOK_SECRET) {
    const token = request.nextUrl.searchParams.get('token');
    if (token !== env.SHIPPO_WEBHOOK_SECRET) {
      logger.warn(
        { requestId, ip: request.headers.get('x-forwarded-for') },
        'Shippo Webhook: Unauthorized access attempt (invalid token)'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const eventType = body.event;
    const data = body.data;

    logger.info(
      { requestId, eventType, trackingNumber: data?.tracking_number },
      'Shippo webhook received'
    );

    if (eventType === 'track_updated') {
      const trackingStatus = data?.tracking_status;
      const trackingNumber = data?.tracking_number;
      const status = trackingStatus?.status;

      if (!trackingNumber) {
        return NextResponse.json(
          { error: 'No tracking number found' },
          { status: 400 }
        );
      }

      // Trouver le shipment correspondant
      const shipment = await prisma.shipment.findFirst({
        where: { trackingCode: trackingNumber },
        include: { order: true },
      });

      if (!shipment) {
        logger.warn(
          { requestId, trackingNumber },
          'Shippo Webhook: Shipment not found'
        );
        return NextResponse.json({
          received: true,
          status: 'skipped_not_found',
        });
      }

      // Si le statut est DELIVERED, on met à jour la commande
      if (status === 'DELIVERED') {
        const orderId = shipment.orderId;
        const currentStatus = shipment.order.status;

        // Éviter les mises à jour redondantes
        if (currentStatus === OrderStatus.DELIVERED) {
          logger.info(
            { requestId, orderId },
            'Order already delivered, skipping update'
          );
          return NextResponse.json({
            received: true,
            status: 'skipped_already_delivered',
          });
        }

        logger.info(
          { requestId, orderId, trackingNumber },
          'Shippo Webhook: Marking order as DELIVERED'
        );

        await updateOrderStatus(
          orderId,
          OrderStatus.DELIVERED,
          'Shippo Webhook: Delivered',
          'SYSTEM'
        );

        return NextResponse.json({
          received: true,
          status: 'updated_delivered',
        });
      } else {
        logger.info(
          { requestId, status, trackingNumber },
          'Shippo Webhook: Status not handled for update'
        );
      }
    } else {
      logger.info(
        { requestId, eventType },
        'Shippo Webhook: Event type ignored'
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error(
      { requestId, error: error.message },
      'Shippo Webhook: Error processing request'
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const POST = withError(
  withRateLimit(handleShippoWebhook, RateLimits.WEBHOOK)
);
