import { createHash } from 'crypto';

import Stripe from 'stripe';

import { logger } from '../logger';
import { stripe } from './client';

export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    logger.error(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      'Webhook signature validation failed'
    );
    throw new Error('Invalid webhook signature');
  }
}

export function generatePayloadHash(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  logger.info(
    {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    },
    'Payment intent succeeded'
  );
}

export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  logger.warn(
    {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    },
    'Payment intent failed'
  );
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  logger.info(
    {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    },
    'Checkout session completed'
  );
}

export async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session
): Promise<void> {
  logger.info(
    {
      sessionId: session.id,
    },
    'Checkout session expired'
  );
}
