import Stripe from 'stripe';

import { prisma } from '../db/prisma';
import { toStripeAmount } from '../utils/currency';
import { stripe } from './client';

export interface CreateCheckoutSessionParams {
  items: Array<{ variantId: string; quantity: number }>;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  items,
  userId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  // Récupérer les détails des variants depuis la DB
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: items.map(i => i.variantId) },
      deletedAt: null,
    },
    include: {
      pricing: {
        where: { isActive: true, priceType: 'base' },
        orderBy: { validFrom: 'desc' },
        take: 1,
      },
      media: {
        where: { isPrimary: true },
        take: 1,
      },
      product: {
        include: {
          translations: {
            take: 1,
          },
        },
      },
    },
  });

  if (variants.length !== items.length) {
    throw new Error('Some variants not found');
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    item => {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      const pricing = variant.pricing[0];
      if (!pricing) {
        throw new Error(`No active pricing found for variant ${variant.sku}`);
      }

      const productName = variant.product.translations[0]?.name || 'Product';
      const imageUrl = variant.media[0]?.url;

      return {
        price_data: {
          currency: pricing.currency.toLowerCase(),
          product_data: {
            name: `${productName} (${variant.sku})`,
            images: imageUrl ? [imageUrl] : undefined,
          },
          unit_amount: toStripeAmount(
            pricing.price.toString(),
            pricing.currency as 'CAD' | 'USD' | 'EUR'
          ),
        },
        quantity: item.quantity,
      };
    }
  );

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId || '',
      items: JSON.stringify(items),
    },
    payment_intent_data: {
      metadata: {
        userId: userId || '',
        items: JSON.stringify(items),
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  return session;
}
