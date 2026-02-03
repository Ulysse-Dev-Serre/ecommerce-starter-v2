import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import type { AuthContext } from '@/lib/middleware/withAuth';
import { ShippingService } from '@/lib/services/shipping/shipping.service';
import {
  ShippingItem,
  SHIPPING_VARIANT_INCLUDE,
} from '@/lib/services/shipping/shipping.repository';
import { createTransaction, getRate } from '@/lib/integrations/shippo';

async function previewLabelHandler(
  request: Request,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const params = await context.params;
  const orderId = params.id;
  const { role } = authContext;

  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: SHIPPING_VARIANT_INCLUDE,
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Dynamic Rate Calculation
    const mappingItems = order.items
      .filter(item => item.variant)
      .map(item => ({
        variantId: item.variant!.id,
        quantity: item.quantity,
      }));

    const addressTo = order.shippingAddress as any;

    // Use ShippingService.getShippingRates to match user flow logic (including filtering and currency)
    const rates = await ShippingService.getShippingRates(undefined, {
      addressTo,
      items: mappingItems,
    });

    if (!rates || rates.length === 0) {
      return NextResponse.json(
        { error: 'No shipping rates found' },
        { status: 404 }
      );
    }

    // Return the best rate (cheapest) by default for preview
    const bestRate = rates[0];

    return NextResponse.json({
      amount: bestRate.amount,
      currency: bestRate.currency,
      provider: bestRate.provider,
      rateId: (bestRate as any).object_id || (bestRate as any).objectId, // Return ID for the POST
    });
  } catch (error: any) {
    logger.error({ error, orderId }, 'Error calculating shipping rates');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function purchaseLabelHandler(
  request: Request,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const params = await context.params;
  const orderId = params.id;
  const { role, userId } = authContext;

  logger.info(
    { role, userId, orderId },
    'Checking permission for purchase-label'
  );

  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        shipments: true,
        items: {
          include: {
            variant: {
              include: SHIPPING_VARIANT_INCLUDE,
            },
          },
        },
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

    // Parse body for optional rateId
    let bodyRateId: string | undefined;
    try {
      const body = await request.json();
      bodyRateId = body.rateId;
    } catch {
      // Body might be empty, ignore
    }

    let rateId = bodyRateId;

    // RECALCULATION LOGIC: Use ShippingService if rate is missing or expired
    if (!rateId) {
      logger.info(
        { orderId },
        'No shipping rate found in metadata, recalculating with ShippingService...'
      );

      const mappingItems = order.items
        .filter(item => item.variant)
        .map(item => ({
          variantId: item.variant!.id,
          quantity: item.quantity,
        }));

      const addressTo = order.shippingAddress as any;

      // Use ShippingService.getShippingRates to match user flow logic
      const rates = await ShippingService.getShippingRates(undefined, {
        addressTo,
        items: mappingItems,
      });

      if (rates && rates.length > 0) {
        // Automatically pick the cheapest rate for the recalculation
        const cheapestRate = rates[0];
        rateId =
          (cheapestRate as any).object_id ||
          (cheapestRate as any).objectId ||
          (cheapestRate as any).id;
      } else {
        return NextResponse.json(
          { error: 'Could not calculate new shipping rates' },
          { status: 400 }
        );
      }
    }

    if (!rateId) {
      return NextResponse.json(
        { error: 'Rate ID missing and recalculation failed' },
        { status: 400 }
      );
    }

    // Purchase the label
    const transaction = await createTransaction(rateId);

    if (transaction.status !== 'SUCCESS') {
      logger.error({ transaction, rateId }, 'Shippo transaction failed');
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
    const carrier = (transaction as any).rate?.provider || 'Shippo';

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

    logger.info(
      { orderId, trackingNumber },
      'Shipping label purchased successfully via refactored Admin API'
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

export const GET = withError(
  withAdmin(withRateLimit(previewLabelHandler, RateLimits.ADMIN))
);

export const POST = withError(
  withAdmin(withRateLimit(purchaseLabelHandler, RateLimits.ADMIN))
);
