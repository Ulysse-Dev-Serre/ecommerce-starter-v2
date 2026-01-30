/**
 * Centralized Checkout Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';

export interface CreateIntentOptions {
  cartId: string;
  currency: string;
  locale: string;
  directItem?: {
    variantId: string;
    quantity: number;
  };
}

export interface UpdateIntentOptions {
  paymentIntentId: string;
  shippingRate: any;
  currency: string;
  shippingDetails: any;
}

/**
 * Create a Stripe Payment Intent
 */
export async function createPaymentIntent(options: CreateIntentOptions) {
  const response = await fetch(API_ROUTES.CHECKOUT.CREATE_INTENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return await response.json();
}

/**
 * Update a Stripe Payment Intent with shipping details
 */
export async function updatePaymentIntent(options: UpdateIntentOptions) {
  const response = await fetch(API_ROUTES.CHECKOUT.UPDATE_INTENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update payment intent');
  }

  return await response.json();
}

/**
 * Legacy/Alternative Checkout (Stripe Checkout Session)
 */
export async function createCheckoutSession(
  items: Array<{ variantId: string; quantity: number }>,
  locale: string
) {
  const response = await fetch('/api/checkout/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      successUrl: `${window.location.origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/${locale}/cart`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  if (data.success && data.url) {
    window.location.href = data.url;
  }
  return data;
}
