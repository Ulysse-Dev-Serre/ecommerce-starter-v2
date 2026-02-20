import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '@/lib/core/db';
import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import {
  generatePayloadHash,
  validateWebhookSignature,
} from '@/lib/integrations/stripe/webhooks';
import { ApiContext } from '@/lib/middleware/types';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { StripeWebhookService } from '@/lib/services/orders/stripe-webhook.service';
import {
  alertInvalidSignature,
  alertWebhookFailure,
} from '@/lib/services/webhooks';

/**
 * Stripe Webhook Handler
 * Delegates business logic to StripeWebhookService
 */
async function handler(
  request: NextRequest,
  _context: ApiContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  let stripeEvent: Stripe.Event | undefined;

  const body = await request.text();

  // LOG TOTAL: RAW BODY (Debug only, restrict in production if PII)
  logger.info(
    {
      length: body.length,
    },
    'DEBUG: STRIPE WEBHOOK RECEIVED'
  );

  const signature = request.headers.get('stripe-signature');

  // 1. Validate Headers
  if (!signature) {
    logger.error({ requestId }, 'Missing stripe-signature header');
    await alertInvalidSignature({
      source: 'stripe',
      signature: 'MISSING',
      error: 'stripe-signature header not provided',
      timestamp: new Date(),
    });
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error({ requestId }, 'STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  // 2. Validate Signature
  try {
    stripeEvent = validateWebhookSignature(body, signature, webhookSecret);
  } catch (error) {
    await alertInvalidSignature({
      source: 'stripe',
      signature: signature.substring(0, 20),
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  logger.info(
    {
      requestId,
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
    },
    'Webhook event signature verified'
  );

  // 3. Idempotency Check
  const payloadHash = generatePayloadHash(body);
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: {
      source_eventId: {
        source: 'stripe',
        eventId: stripeEvent.id,
      },
    },
  });

  if (existingEvent?.processed) {
    logger.info(
      { requestId, eventId: stripeEvent.id },
      'Webhook already processed, skipping'
    );
    return NextResponse.json({ received: true });
  }

  if (!existingEvent) {
    await prisma.webhookEvent.create({
      data: {
        source: 'stripe',
        eventId: stripeEvent.id,
        eventType: stripeEvent.type,
        payloadHash,
        processed: false,
      },
    });
  }

  // 4. Process Event via Service
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await StripeWebhookService.handleCheckoutSessionCompleted(
          stripeEvent.data.object as Stripe.Checkout.Session,
          requestId
        );
        break;

      case 'payment_intent.succeeded':
        await StripeWebhookService.handlePaymentIntentSucceeded(
          stripeEvent.data.object as Stripe.PaymentIntent,
          requestId
        );
        break;

      case 'payment_intent.payment_failed':
        await StripeWebhookService.handlePaymentIntentFailed(
          stripeEvent.data.object as Stripe.PaymentIntent,
          requestId
        );
        break;

      case 'checkout.session.expired':
        await StripeWebhookService.handleCheckoutSessionExpired(
          stripeEvent.data.object as Stripe.Checkout.Session,
          requestId
        );
        break;

      default:
        logger.info(
          { requestId, eventType: stripeEvent.type },
          'Unhandled webhook event type'
        );
    }

    // 5. Mark as Processed
    await prisma.webhookEvent.update({
      where: {
        source_eventId: {
          source: 'stripe',
          eventId: stripeEvent.id,
        },
      },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    // 6. Error Handling & Retry Logic
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        requestId,
        error: errorMsg,
        eventId: stripeEvent?.id,
        eventType: stripeEvent?.type,
      },
      'Webhook processing failed'
    );

    if (stripeEvent?.id) {
      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: {
          source_eventId: { source: 'stripe', eventId: stripeEvent.id },
        },
      });

      if (webhookEvent) {
        const updatedEvent = await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            retryCount: { increment: 1 },
            lastError: errorMsg,
          },
        });

        if (updatedEvent.retryCount >= updatedEvent.maxRetries) {
          await alertWebhookFailure({
            webhookId: webhookEvent.id,
            source: 'stripe',
            eventId: stripeEvent.id,
            eventType: stripeEvent.type,
            error: errorMsg,
            retryCount: updatedEvent.retryCount,
            maxRetries: updatedEvent.maxRetries,
            timestamp: new Date(),
          });
          return NextResponse.json({ received: true }); // Stop retrying
        }
        // Return 500 to trigger Stripe Retry
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }
    }
    throw error;
  }
}

export const POST = withError(withRateLimit(handler, RateLimits.WEBHOOK));
