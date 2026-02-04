import { env } from '@/lib/core/env';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  getReturnShippingRates,
  createTransaction,
} from '@/lib/integrations/shippo';
import { SITE_CURRENCY } from '@/lib/config/site';
import { resend, FROM_EMAIL } from '@/lib/integrations/resend/client';
import { render } from '@react-email/render';

import fr from '@/lib/i18n/dictionaries/fr.json';
import en from '@/lib/i18n/dictionaries/en.json';
const dictionaries: Record<string, any> = { fr, en };

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
  // 0 Fallback Policy: Resolve Origin Address from the first product's Shipping Origin
  const orderWithOrigin = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        take: 1, // We assume all items in an order ship from the same origin for now, or we take the first one as the return point
        include: {
          product: {
            include: {
              shippingOrigin: true,
            },
          },
        },
      },
      user: true,
    },
  });

  if (!orderWithOrigin) throw new Error('Order not found');

  // Use the fetched order with relations
  const order = orderWithOrigin;

  const addr = order.shippingAddress as any;
  const customerAddress = {
    name: addr.name || `${addr.firstName} ${addr.lastName}`,
    street1: addr.street1 || addr.line1,
    street2: addr.street2 || addr.line2,
    city: addr.city,
    state: addr.state,
    zip: (addr.postalCode || addr.postal_code || addr.zip || '').replace(
      /\s+/g,
      ''
    ),
    country: addr.country,
    phone: addr.phone,
    email: order.user?.email || addr.email,
  };

  const firstProduct = order.items[0]?.product;
  const originData = firstProduct?.shippingOrigin;

  if (!originData || !originData.address) {
    throw new Error(
      `0 Fallback Policy: Cannot generate return label. Product ${firstProduct?.id} has no configured Shipping Origin (Supplier).`
    );
  }

  // Validate and format the warehouse address (Return Destination)
  // We use the simpler validation here as we are inside the service logic,
  // but we could reuse the shared validation logic if extracted.
  const rawAddress = originData.address as any;
  const warehouseAddress = {
    name: originData.name,
    street1: rawAddress.street1 || rawAddress.line1,
    street2: rawAddress.street2 || rawAddress.line2 || '',
    city: rawAddress.city,
    state: rawAddress.state,
    zip: (rawAddress.postalCode || rawAddress.zip || '').replace(/\s+/g, ''),
    country: rawAddress.country,
    phone: originData.contactPhone || env.SHIPPO_FROM_PHONE || '5140000000',
    email: originData.contactEmail || 'agtechnest@gmail.com',
  };

  // Ensure required fields for Shippo are present
  if (
    !warehouseAddress.street1 ||
    !warehouseAddress.city ||
    !warehouseAddress.country ||
    !warehouseAddress.zip
  ) {
    throw new Error(
      `Invalid warehouse address for ${originData.name}. Missing required fields.`
    );
  }

  // Calculate real total weight
  // Note: We use existing order items (which already include quantity).
  // Ideally, Prisma includes product info so we can get unit weight.
  // Since we only fetched limited data above, we need to ensure we have weight.
  const totalWeight = order.items.reduce((acc, item) => {
    // We need to fetch product weight. The previous query only took 1 item deep.
    // Let's rely on stored variant info if available or assume standard return weight logic if needed.
    // However, to be strict, we should really use the data we have.
    // Since 'include: { items: { include: { product: true } } }' was used (via orderWithOrigin's query logic which was a bit limited to 'take: 1'),
    // we actually need to fetch ALL items properly to calculate weight.
    // FIX: Let's assume for a return we might return everything OR a specific weight.
    // For now, let's just sum up the weight of the items we know about.
    // But wait, the previous query was `take: 1` on items! That's a bug for weight calc of the WHOLE order.
    // We should refactor the initial query to get ALL items if we want total weight.
    return acc + 1; // Placeholder until query is fixed below.
  }, 0);

  // FIX: Re-query to get ALL items for weight calculation
  const fullOrderItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    include: { variant: true, product: true },
  });

  const calculatedWeight = fullOrderItems.reduce((acc, item) => {
    const unitWeight = Number(item.variant?.weight || item.product?.weight);

    if (!unitWeight || unitWeight <= 0) {
      throw new Error(
        `0 Fallback Policy: Missing or invalid weight for product "${item.product?.slug || item.productId}". Cannot generate return label.`
      );
    }

    return acc + unitWeight * item.quantity;
  }, 0);

  const finalWeight = calculatedWeight.toFixed(2);

  // Prepare a generic parcel (sized for the return)
  const parcels = [
    {
      length: '20',
      width: '15',
      height: '10',
      distanceUnit: 'cm' as const,
      weight: finalWeight,
      massUnit: 'kg' as const,
    },
  ];

  // International Return Customs (e.g. US -> CA)
  let customsDeclaration = undefined;
  if (customerAddress.country !== 'CA') {
    customsDeclaration = {
      contentsType: 'RETURN_MERCHANDISE' as const,
      contentsExplanation: 'Customer return',
      nonDeliveryOption: 'RETURN' as const,
      certify: true,
      certifySigner: customerAddress.name,
      items: [
        {
          description: 'Return items',
          quantity: 1,
          netWeight: '1',
          massUnit: 'kg' as const,
          valueAmount: '50.00',
          valueCurrency: SITE_CURRENCY,
          originCountry: 'CA',
        },
      ],
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
      throw new Error('No return rates found');
    }

    // Sort rates by amount to find the cheapest
    const sortedRates = [...shipment.rates].sort(
      (a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount)
    );

    const bestRate = sortedRates[0] as any;
    const rateId = bestRate.objectId || bestRate.object_id;

    // If we are just previewing, return the rate info now
    if (isPreview) {
      return {
        isPreview: true,
        amount: bestRate.amount,
        currency: bestRate.currency,
        provider: bestRate.provider,
      };
    }

    const transaction = (await createTransaction(rateId)) as any;

    if (transaction.status !== 'SUCCESS') {
      throw new Error(
        'Failed to purchase return label: ' +
          (transaction.messages?.[0]?.text || 'Unknown error')
      );
    }

    // Save the shipment in DB
    await prisma.shipment.create({
      data: {
        orderId,
        carrier: transaction.provider || bestRate.provider,
        trackingCode: transaction.trackingNumber || transaction.tracking_number,
        trackingUrl: transaction.trackingUrl || transaction.tracking_url,
        labelUrl: transaction.labelUrl || transaction.label_url,
        status: 'PENDING',
        carrierService: 'RETURN',
      } as any,
    });

    // Send email
    try {
      const finalLabelUrl = transaction.labelUrl || transaction.label_url;

      if (!finalLabelUrl) {
        throw new Error(
          "Shippo a confirmé l'achat mais n'a pas renvoyé d'URL pour le PDF. Veuillez réessayer ou vérifier sur Shippo."
        );
      }

      logger.info({ orderId, finalLabelUrl }, 'Preparing return label email');

      const { OrderReturnLabelEmail } = await import(
        '@/components/emails/order-return-label'
      );
      const emailHtml = await render(
        OrderReturnLabelEmail({
          orderId: order.orderNumber,
          customerName:
            addr.name?.split(' ')[0] || order.user?.firstName || 'Client',
          labelUrl: finalLabelUrl,
          locale: order.language.toLowerCase(),
        })
      );

      const dict =
        dictionaries[order.language.toLowerCase()] || dictionaries.en;
      const subject = dict.Emails.returnLabel.subject.replace(
        '{orderNumber}',
        order.orderNumber
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerAddress.email,
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
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, 'Error in createReturnLabel');
    throw err;
  }
}

import { SHIPPING_VARIANT_INCLUDE } from '@/lib/services/shipping/shipping.repository';
import { ShippingService } from '@/lib/services/shipping/shipping.service';

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
    throw new Error('Order not found');
  }

  // Dynamic Rate Calculation
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

  if (!rates || rates.length === 0) {
    throw new Error('No shipping rates found');
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
    throw new Error('Order not found');
  }

  // Check if shipment already exists with tracking
  const existingShipment = order.shipments.find(s => s.trackingCode);
  if (existingShipment) {
    throw new Error('Label already exists');
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

    const addressTo = order.shippingAddress as any;

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
      throw new Error('Could not calculate new shipping rates');
    }
  }

  if (!rateId) {
    throw new Error('Rate ID missing and recalculation failed');
  }

  // Purchase the label
  const transaction = await createTransaction(rateId);

  if (transaction.status !== 'SUCCESS') {
    logger.error({ transaction, rateId }, 'Shippo transaction failed');
    throw new Error(
      'Failed to purchase label: ' +
        ((transaction as any).messages?.[0]?.text || 'Unknown error')
    );
  }

  const trackingNumber =
    (transaction as any).tracking_number || (transaction as any).trackingNumber;
  const labelUrl =
    (transaction as any).label_url || (transaction as any).labelUrl;
  const carrier = (transaction as any).rate?.provider || 'Shippo';

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
