import { env } from '@/lib/core/env';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  getReturnShippingRates,
  createTransaction,
} from '@/lib/integrations/shippo';
import {
  SITE_CURRENCY,
  STORE_ORIGIN_ADDRESS,
  resolveShippingOrigin,
  SHIPPING_UNITS,
} from '@/lib/config/site';
import { resend, FROM_EMAIL } from '@/lib/integrations/resend/client';
import { render } from '@react-email/render';

import type { ShippingAddress } from '@/lib/types/domain/shipping';
import type {
  ShippingRate,
  Transaction as ShippoTransaction,
} from '@/lib/integrations/shippo';

import { getDictionary } from '@/lib/i18n/get-dictionary';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import { ShippingService } from '../shipping/shipping.service';
import { SHIPPING_VARIANT_INCLUDE } from '../shipping/shipping.repository';

/**
 * Crée une étiquette de retour pour une commande
 * - Récupère les adresses (client → entrepôt)
 * - Calcule les tarifs de retour via Shippo
 * - Achète l'étiquette si !isPreview
 * - Envoie l'email avec le PDF
 */
export async function createReturnLabel(
  orderId: string,
  isPreview: boolean = false
) {
  // 1. Fetch order with product origin as backup (Hierarchical resolution)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: {
          variant: true,
          product: {
            include: {
              translations: true,
              shippingOrigin: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(ErrorCode.NOT_FOUND, `Order not found: ${orderId}`, 404);
  }

  const customerEmail = order.orderEmail;

  // Zero Fallback Policy: Transaction email is MANDATORY for labels (we need to send them)
  if (!customerEmail) {
    throw new AppError(
      ErrorCode.SHIPPING_DATA_MISSING,
      'Transaction email (orderEmail) is missing. Cannot generate label.',
      400
    );
  }

  const firstItem = order.items[0];
  const addr = order.shippingAddress as unknown as ShippingAddress;
  const customerAddress = ShippingService.validateAddress(
    { ...addr, email: customerEmail },
    `Customer Order: ${order.orderNumber}`
  );

  // 2. Resolve Warehouse Address (Decision logic centralized in site.ts)
  const warehouseAddress = resolveShippingOrigin(
    order.items[0]?.product?.shippingOrigin
  );

  // 0 Fallback Validation: Final stop if NO valid address is resolved
  if (
    !warehouseAddress.street1 ||
    !warehouseAddress.city ||
    !warehouseAddress.zip
  ) {
    throw new AppError(
      ErrorCode.SHIPPING_DATA_MISSING,
      'Logistics configuration missing: No valid origin address could be resolved (0 Fallback Policy).',
      400
    );
  }

  const calculatedWeight = order.items.reduce((acc, item) => {
    const unitWeight = Number(item.variant?.weight || item.product?.weight);

    if (!unitWeight || unitWeight <= 0) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        `Missing or invalid weight for product "${item.product?.slug || item.productId}". 0 Fallback Policy enforced.`,
        400
      );
    }

    return acc + unitWeight * item.quantity;
  }, 0);

  const finalWeight = calculatedWeight.toFixed(2);

  // 3. Resolve actual parcel dimensions from product/variant
  const dim = (firstItem?.variant?.dimensions ||
    firstItem?.product?.dimensions) as {
    width?: number;
    length?: number;
    height?: number;
  } | null;

  // 0 Fallback Validation: Dimensions must exist and be valid
  if (!dim?.length || !dim?.width || !dim?.height || dim.length <= 0) {
    throw new AppError(
      ErrorCode.SHIPPING_DATA_MISSING,
      `Missing or invalid dimensions for product "${firstItem?.product?.slug || firstItem?.productId}". Cannot generate return label (0 Fallback Policy).`,
      400
    );
  }

  // Prepare the parcel using real data
  const parcels = [
    {
      length: dim.length.toString(),
      width: dim.width.toString(),
      height: dim.height.toString(),
      distanceUnit: SHIPPING_UNITS.DISTANCE,
      weight: finalWeight,
      massUnit: SHIPPING_UNITS.MASS,
    },
  ];

  // International Return Customs (e.g. US -> Origin)
  let customsDeclaration = undefined;
  if (customerAddress.country !== STORE_ORIGIN_ADDRESS.country) {
    customsDeclaration = {
      contentsType: 'RETURN_MERCHANDISE' as const,
      contentsExplanation: 'Customer return',
      nonDeliveryOption: 'RETURN' as const,
      certify: true,
      certifySigner: customerAddress.name!, // Guaranteed by validateAddress
      items: order.items.map(item => {
        const product = item.product;
        if (!product) {
          throw new AppError(
            ErrorCode.NOT_FOUND,
            `Product data missing for item ${item.id}`,
            404
          );
        }

        const unitWeight = Number(item.variant?.weight || product.weight);
        return {
          description:
            product.translations.find(t => t.language === order.language)
              ?.name ||
            product.translations[0]?.name ||
            product.slug,
          quantity: item.quantity,
          netWeight: unitWeight.toString(),
          massUnit: SHIPPING_UNITS.MASS,
          valueAmount: item.unitPrice.toString(),
          valueCurrency: order.currency,
          originCountry: product.originCountry || STORE_ORIGIN_ADDRESS.country,
        };
      }),
    };
  }

  try {
    const shipment = await getReturnShippingRates(
      customerAddress,
      warehouseAddress,
      parcels,
      customsDeclaration
    );

    if (!shipment.rates || shipment.rates.length === 0) {
      throw new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'No return rates found from shipping carrier.',
        502
      );
    }

    // Sort rates by amount to find the cheapest
    const sortedRates = [...shipment.rates].sort(
      (a, b) => parseFloat(a.amount) - parseFloat(b.amount)
    );

    const bestRate = sortedRates[0] as unknown as ShippingRate;
    const rateId = (bestRate.objectId || bestRate.object_id) as string;

    // If we are just previewing, return the rate info now
    if (isPreview) {
      return {
        isPreview: true,
        amount: bestRate.amount,
        currency: bestRate.currency,
        provider: bestRate.provider,
      };
    }

    const transaction = (await createTransaction(
      rateId
    )) as unknown as ShippoTransaction;

    if (transaction.status !== 'SUCCESS') {
      const shippoMsg =
        transaction.messages?.[0]?.text || 'Unknown carrier error';
      throw new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to purchase return label: ${shippoMsg}`,
        502
      );
    }

    // Save the shipment in DB
    await prisma.shipment.create({
      data: {
        orderId,
        carrier: transaction.provider || bestRate.provider,
        trackingCode: transaction.trackingNumber || transaction.tracking_number,
        labelUrl: transaction.labelUrl || transaction.label_url,
        status: 'PENDING',
        carrierService: 'RETURN',
      },
    });

    // Send email
    try {
      const finalLabelUrl = transaction.labelUrl || transaction.label_url;

      if (!finalLabelUrl) {
        throw new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          'Carrier confirmed purchase but did not return a label URL.',
          502
        );
      }

      logger.info({ orderId, finalLabelUrl }, 'Preparing return label email');

      const { OrderReturnLabelEmail } = await import(
        '@/components/emails/order-return-label'
      );
      const emailHtml = await render(
        OrderReturnLabelEmail({
          orderId: order.orderNumber,
          customerName: addr.name?.split(' ')[0] || order.user?.firstName || '',
          labelUrl: finalLabelUrl,
          locale: order.language.toLowerCase(),
        })
      );

      const dict = await getDictionary(order.language.toLowerCase());
      const subject = dict.Emails.returnLabel.subject.replace(
        '{orderNumber}',
        order.orderNumber
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject,
        html: emailHtml,
      });
      logger.info(
        { orderId },
        'Return label created and email sent successfully'
      );
    } catch (emailErr) {
      logger.error({ emailErr, orderId }, 'Failed to send return label email');
    }

    return transaction;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err: msg, orderId }, 'Error in createReturnLabel');
    throw err;
  }
}

/**
 * Prévisualise les tarifs d'expédition pour une commande
 * (Utilisé par l'admin pour voir les coûts avant d'acheter l'étiquette)
 */
export async function previewShippingRates(orderId: string) {
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
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `Order findUnique returned null for ${orderId}`,
      404
    );
  }

  // Dynamic Rate Calculation
  const mappingItems = order.items
    .filter(item => item.variant)
    .map(item => ({
      variantId: item.variant!.id,
      quantity: item.quantity,
    }));

  const addressTo = ShippingService.validateAddress(
    {
      ...(order.shippingAddress as unknown as ShippingAddress),
      email: order.orderEmail,
    },
    `Order Preview: ${order.orderNumber}`
  );

  // Use ShippingService.getShippingRates to match user flow logic
  const rates = await ShippingService.getShippingRates(undefined, {
    addressTo,
    items: mappingItems,
  });

  if (!rates || rates.length === 0) {
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      'No shipping rates found matching your criteria.',
      404
    );
  }

  return rates;
}

/**
 * Achète une étiquette d'expédition pour une commande
 * - Recalcule les tarifs si rateId nest pas fourni
 * - Achète l'étiquette via Shippo
 * - Crée l'objet Shipment en base de données
 * - Envoie l'email d'expédition au client (via le changement de statut qui suivra, ou ici ?)
 *   -> NOTE: Ici on crée juste le Shipment. Le changement de statut "SHIPPED" est souvent une action séparée de l'admin.
 */
export async function purchaseShippingLabel(orderId: string, rateId?: string) {
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
    throw new AppError(ErrorCode.NOT_FOUND, `Order not found: ${orderId}`, 404);
  }

  // Check if shipment already exists with tracking
  const existingShipment = order.shipments.find(s => s.trackingCode);
  if (existingShipment) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'A shipping label already exists for this order.',
      400
    );
  }

  // RECALCULATION LOGIC: Use ShippingService if rate is missing or expired
  if (!rateId) {
    logger.info({ orderId }, 'No shipping rate provided, recalculating...');

    const mappingItems = order.items
      .filter(item => item.variant)
      .map(item => ({
        variantId: item.variant!.id,
        quantity: item.quantity,
      }));

    const addressTo = ShippingService.validateAddress(
      {
        ...(order.shippingAddress as unknown as ShippingAddress),
        email: order.orderEmail,
      },
      `Label Purchase: ${order.orderNumber}`
    );

    const rates = await ShippingService.getShippingRates(undefined, {
      addressTo,
      items: mappingItems,
    });

    if (rates && rates.length > 0) {
      // Automatically pick the cheapest rate for the recalculation
      const cheapestRate = rates[0] as ShippingRate;
      rateId = cheapestRate.object_id || cheapestRate.objectId;
    } else {
      throw new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'Could not recalculate shipping rates (0 Fallback Policy).',
        502
      );
    }
  }

  if (!rateId) {
    throw new AppError(
      ErrorCode.SHIPPING_DATA_MISSING,
      'Rate ID is required to purchase a label.',
      400
    );
  }

  // Purchase the label
  const transaction = (await createTransaction(
    rateId
  )) as unknown as ShippoTransaction;

  if (transaction.status !== 'SUCCESS') {
    const errorMsg = transaction.messages?.[0]?.text || 'Unknown carrier error';
    logger.error({ transaction, rateId }, 'Shippo transaction failed');
    throw new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `Failed to purchase label: ${errorMsg}`,
      502
    );
  }

  const trackingNumber =
    transaction.tracking_number || transaction.trackingNumber;
  const labelUrl = transaction.label_url || transaction.labelUrl;

  // Safely extract provider from rate if it's an object
  let carrier = 'Carrier';
  if (transaction.rate && typeof transaction.rate === 'object') {
    carrier = (transaction.rate as ShippingRate).provider || 'Carrier';
  } else if (transaction.provider) {
    carrier = transaction.provider;
  }

  // Create Shipment record
  const shipment = await prisma.shipment.create({
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
    'Shipping label purchased successfully'
  );

  return {
    success: true,
    trackingNumber,
    labelUrl,
    shipment,
  };
}
