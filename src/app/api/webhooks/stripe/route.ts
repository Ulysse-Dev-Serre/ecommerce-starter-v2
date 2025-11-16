import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '../../../../lib/db/prisma';
import { logger } from '../../../../lib/logger';
import {
  clearCart,
  getOrCreateCart,
} from '../../../../lib/services/cart.service';
import { releaseStock } from '../../../../lib/services/inventory.service';
import { createOrderFromCart } from '../../../../lib/services/order.service';
import {
  generatePayloadHash,
  validateWebhookSignature,
} from '../../../../lib/stripe/webhooks';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.error({ requestId }, 'Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error({ requestId }, 'STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const event = validateWebhookSignature(body, signature, webhookSecret);

    logger.info(
      {
        requestId,
        eventId: event.id,
        eventType: event.type,
      },
      'Webhook event received'
    );

    const payloadHash = generatePayloadHash(body);
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: {
        source_eventId: {
          source: 'stripe',
          eventId: event.id,
        },
      },
    });

    if (existingEvent?.processed) {
      logger.info(
        { requestId, eventId: event.id },
        'Webhook already processed, skipping'
      );
      return NextResponse.json({ received: true });
    }

    if (!existingEvent) {
      await prisma.webhookEvent.create({
        data: {
          source: 'stripe',
          eventId: event.id,
          eventType: event.type,
          payloadHash,
          processed: false,
        },
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, requestId);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent, requestId);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent, requestId);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(session, requestId);
        break;
      }

      default:
        logger.info(
          { requestId, eventType: event.type },
          'Unhandled webhook event type'
        );
    }

    await prisma.webhookEvent.update({
      where: {
        source_eventId: {
          source: 'stripe',
          eventId: event.id,
        },
      },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error(
      {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Webhook processing failed'
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  requestId: string
): Promise<void> {
  logger.info(
    {
      requestId,
      sessionId: session.id,
      paymentStatus: session.payment_status,
    },
    'Checkout session completed'
  );

  if (session.payment_status !== 'paid') {
    logger.warn(
      {
        requestId,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      },
      'Payment not completed yet'
    );
    return;
  }

  const cartId = session.metadata?.cartId;
  const userId = session.metadata?.userId;

  if (!cartId || !userId) {
    logger.error(
      { requestId, sessionId: session.id },
      'Missing cartId or userId in session metadata'
    );
    return;
  }

  const cart = await getOrCreateCart(userId, session.metadata?.anonymousId);

  const paymentIntentId = session.payment_intent as string;
  const existingPayment = await prisma.payment.findFirst({
    where: { externalId: paymentIntentId },
  });

  if (existingPayment) {
    logger.info(
      { requestId, sessionId: session.id },
      'Order already created for this payment intent'
    );
    return;
  }

  logger.info(
    { requestId, cartId, userId },
    'Creating order from checkout session'
  );

  await createOrderFromCart({
    cart,
    userId,
    paymentIntent: {
      id: paymentIntentId,
      amount: session.amount_total || 0,
      currency: session.currency || 'eur',
    } as Stripe.PaymentIntent,
  });

  logger.info(
    { requestId, sessionId: session.id, cartId },
    'Order created successfully from checkout session'
  );
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  requestId: string
): Promise<void> {
  logger.info(
    {
      requestId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
    },
    'Payment intent succeeded'
  );

  const cartId = paymentIntent.metadata?.cartId;
  const userId = paymentIntent.metadata?.userId;

  if (!cartId || !userId) {
    logger.warn(
      { requestId, paymentIntentId: paymentIntent.id },
      'Missing metadata in payment intent'
    );
    return;
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { externalId: paymentIntent.id },
  });

  if (existingPayment) {
    logger.info(
      { requestId, paymentIntentId: paymentIntent.id },
      'Order already created for this payment'
    );
    return;
  }

  const cart = await getOrCreateCart(userId);

  await createOrderFromCart({
    cart,
    userId,
    paymentIntent,
  });

  // Clear cart after successful order creation
  await clearCart(cartId);

  logger.info(
    {
      requestId,
      paymentIntentId: paymentIntent.id,
      cartId,
    },
    'Order created successfully and cart cleared'
  );
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  requestId: string
): Promise<void> {
  logger.warn(
    {
      requestId,
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    },
    'Payment intent failed'
  );

  const cartId = paymentIntent.metadata?.cartId;

  if (cartId) {
    const cart = await getOrCreateCart(
      paymentIntent.metadata?.userId,
      undefined
    );

    await releaseStock(
      cart.items.map(item => ({
        variantId: item.variant.id,
        quantity: item.quantity,
      }))
    );

    logger.info({ requestId, cartId }, 'Stock released after payment failure');
  }
}

async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  requestId: string
): Promise<void> {
  logger.info({ requestId, sessionId: session.id }, 'Checkout session expired');

  const cartId = session.metadata?.cartId;

  if (cartId) {
    const cart = await getOrCreateCart(
      session.metadata?.userId,
      session.metadata?.anonymousId
    );

    await releaseStock(
      cart.items.map(item => ({
        variantId: item.variant.id,
        quantity: item.quantity,
      }))
    );

    logger.info(
      { requestId, cartId },
      'Stock released after session expiration'
    );
  }
}
