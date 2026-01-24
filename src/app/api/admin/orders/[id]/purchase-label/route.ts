import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { withError } from '@/lib/middleware/withError';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import type { AuthContext } from '@/lib/middleware/withAuth';
import { env } from '@/lib/env';

async function purchaseLabelHandler(
  request: Request,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const params = await context.params;
  const orderId = params.id;

  const { role, userId } = authContext;

  logger.info(
    {
      role,
      userId,
      orderId,
    },
    'Checking permission for purchase-label'
  );

  // Redundant check for safety
  if (role !== 'ADMIN') {
    logger.warn(
      { role, userId },
      'Unauthorized access attempt to purchase-label'
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        shipments: true,
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if shipment already exists with tracking
    const existingShipment = order.shipments.find(s => s.trackingCode);
    if (existingShipment) {
      return NextResponse.json(
        { error: 'Label already exists' },
        { status: 400 }
      );
    }

    // Extract metadata from the successful payment
    const payment = order.payments.find(p => p.status === 'COMPLETED');
    const metadata = payment?.transactionData
      ? (payment.transactionData as any).metadata || {}
      : {};

    let rateId = metadata.shipping_rate_id;

    logger.info({ orderId, rateId }, 'Attempting to purchase shipping label');

    if (!rateId) {
      logger.warn(
        { orderId },
        'No shipping rate found in metadata, recalculating...'
      );

      try {
        const { getShippingRates } = await import(
          '../../../../../../lib/services/shippo'
        );

        const shippingAddress = order.shippingAddress as any;

        logger.info(
          {
            rawShippingAddress: shippingAddress,
            type: typeof shippingAddress,
            keys: shippingAddress ? Object.keys(shippingAddress) : [],
          },
          'DEBUG: Raw Shipping Address from DB'
        );

        if (!shippingAddress) {
          return NextResponse.json(
            { error: 'No shipping address to calculate rates' },
            { status: 400 }
          );
        }

        const addressFrom = {
          name: env.SHIPPO_FROM_NAME || '',
          company: env.SHIPPO_FROM_COMPANY || '',
          street1: env.SHIPPO_FROM_STREET1 || '',
          city: env.SHIPPO_FROM_CITY || '',
          state: env.SHIPPO_FROM_STATE || '',
          zip: env.SHIPPO_FROM_ZIP || '',
          country: env.SHIPPO_FROM_COUNTRY || 'CA',
          email: env.SHIPPO_FROM_EMAIL || '',
          phone: env.SHIPPO_FROM_PHONE || '',
        };

        const addressTo = {
          name:
            shippingAddress.name ||
            `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() ||
            'Customer',
          street1:
            shippingAddress.street1 ||
            shippingAddress.street ||
            shippingAddress.address1 ||
            '',
          street2:
            shippingAddress.street2 ||
            shippingAddress.apartment ||
            shippingAddress.address2 ||
            '',
          city: shippingAddress.city || '',
          state:
            shippingAddress.state ||
            shippingAddress.province ||
            shippingAddress.region ||
            'QC', // Default to QC if missing, safety net
          zip:
            shippingAddress.postalCode ||
            shippingAddress.zipCode ||
            shippingAddress.zip ||
            '',
          country:
            shippingAddress.country || shippingAddress.countryCode || 'CA',
          email:
            order.user?.email ||
            shippingAddress.email ||
            'customer@example.com',
          phone: shippingAddress.phone || '555-555-5555',
        };

        // Validation de base avant envoi
        if (
          !addressTo.street1 ||
          !addressTo.city ||
          !addressTo.zip ||
          !addressTo.country
        ) {
          logger.error(
            { addressTo },
            'Incomplete address for shipping calculation'
          );
          return NextResponse.json(
            {
              error:
                'Incomplete shipping address: ' + JSON.stringify(addressTo),
            },
            { status: 400 }
          );
        }

        const parcels = [
          {
            length: '20',
            width: '15',
            height: '10',
            distanceUnit: 'cm' as const,
            weight: '1',
            massUnit: 'kg' as const,
          },
        ];

        const shipment = await getShippingRates(
          addressFrom,
          addressTo,
          parcels
        );

        if (shipment && shipment.rates && shipment.rates.length > 0) {
          const firstRate = shipment.rates[0] as any;
          logger.info(
            { firstRateKeys: Object.keys(firstRate), firstRate },
            'DEBUG: First Rate Object'
          );

          // Support both SDK conventions
          rateId = firstRate.object_id || firstRate.objectId || firstRate.id;

          if (!rateId) {
            logger.error({ msg: 'Rate ID not found in rate object' });
            return NextResponse.json(
              { error: 'Rate ID missing from calculation' },
              { status: 400 }
            );
          }

          logger.info({ orderId, rateId }, 'Found fallback rate');
        } else {
          return NextResponse.json(
            { error: 'Could not calculate new rates' },
            { status: 400 }
          );
        }
      } catch (calcError: any) {
        logger.error({ error: calcError }, 'Failed to recalculate rates');
        return NextResponse.json(
          {
            error:
              'No shipping rate found and failed to recalculate. ' +
              calcError.message,
          },
          { status: 400 }
        );
      }
    }

    const { createTransaction } = await import(
      '../../../../../../lib/services/shippo'
    );

    if (typeof rateId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid rate ID format' },
        { status: 400 }
      );
    }

    const transaction = await createTransaction(rateId);

    if (transaction.status !== 'SUCCESS') {
      logger.error({ transaction }, 'Shippo transaction failed');
      return NextResponse.json(
        {
          error: 'Failed to purchase label',
          details: (transaction as any).messages,
        },
        { status: 400 }
      );
    }

    const trackingNumber =
      (transaction as any).tracking_number ||
      (transaction as any).trackingNumber;
    const labelUrl =
      (transaction as any).label_url || (transaction as any).labelUrl;
    const carrier =
      (transaction as any).rate && (transaction as any).rate.provider
        ? (transaction as any).rate.provider
        : 'Shippo';

    // Create Shipment record
    await prisma.shipment.create({
      data: {
        orderId: orderId,
        status: 'PENDING',
        trackingCode: trackingNumber,
        labelUrl: labelUrl,
        carrier: carrier,
      },
    });

    // We DO NOT update the order status to SHIPPED automatically here.
    // The admin will manually set it to SHIPPED when they physically drop the package.
    /*
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
      },
    });
    */

    logger.info(
      { orderId, trackingNumber },
      'Shipping label purchased successfully'
    );

    return NextResponse.json({
      success: true,
      trackingNumber,
      labelUrl,
    });
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error purchasing shipping label');
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const POST = withError(
  withAdmin(withRateLimit(purchaseLabelHandler, RateLimits.ADMIN))
);
