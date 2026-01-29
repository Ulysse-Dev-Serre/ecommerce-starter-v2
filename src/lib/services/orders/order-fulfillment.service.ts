import { env } from '@/lib/core/env';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  getReturnShippingRates,
  createTransaction,
} from '@/lib/integrations/shippo';
import { SITE_CURRENCY } from '@/lib/config/site';
import { resend, FROM_EMAIL } from '@/lib/core/resend';
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
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) throw new Error('Order not found');

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

  const warehouseAddress = {
    name: 'AgTechNest Warehouse',
    street1: '546 rue leclerc',
    street2: 'app 7',
    city: 'Repentigny',
    state: 'QC',
    zip: 'J6A7R3',
    country: 'CA',
    phone: env.SHIPPO_FROM_PHONE || '5140000000',
    email: 'agtechnest@gmail.com',
  };

  // Prepare a generic parcel (standard box)
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
