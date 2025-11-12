import Stripe from 'stripe';

import { CartProjection } from '../services/cart.service';
import { toStripeAmount } from '../utils/currency';
import { stripe } from './client';

export interface CreateCheckoutSessionParams {
  cart: CartProjection;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  cart,
  userId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    cart.items.map(item => {
      const pricing = item.variant.pricing.find(
        p => p.currency === cart.currency
      );

      if (!pricing) {
        throw new Error(
          `No active pricing found for variant ${item.variant.sku}`
        );
      }

      const productName =
        item.variant.product.translations[0]?.name || 'Product';
      const imageUrl = item.variant.media.find(m => m.isPrimary)?.url;

      return {
        price_data: {
          currency: cart.currency.toLowerCase(),
          product_data: {
            name: `${productName} (${item.variant.sku})`,
            images: imageUrl ? [imageUrl] : undefined,
          },
          unit_amount: toStripeAmount(
            pricing.price.toString(),
            cart.currency as 'CAD' | 'USD' | 'EUR'
          ),
        },
        quantity: item.quantity,
      };
    });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      cartId: cart.id,
      userId: userId || '',
      anonymousId: cart.anonymousId || '',
    },
    payment_intent_data: {
      metadata: {
        cartId: cart.id,
        userId: userId || '',
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  return session;
}
