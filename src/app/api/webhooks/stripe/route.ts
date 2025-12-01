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
  alertInvalidSignature,
  alertWebhookFailure,
} from '../../../../lib/services/webhook-alert.service';
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
      await alertInvalidSignature({
        source: 'stripe',
        signature: 'MISSING',
        error: 'stripe-signature header not provided',
        timestamp: new Date(),
      });
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

    let event: Stripe.Event;
    try {
      event = validateWebhookSignature(body, signature, webhookSecret);
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
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        requestId,
        error: errorMsg,
        eventId: event?.id,
        eventType: event?.type,
      },
      'Webhook processing failed'
    );

    // Update webhook event with error details if event exists
    if (event?.id) {
      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: {
          source_eventId: {
            source: 'stripe',
            eventId: event.id,
          },
        },
      });

      if (webhookEvent) {
        const updatedEvent = await prisma.webhookEvent.update({
          where: {
            source_eventId: {
              source: 'stripe',
              eventId: event.id,
            },
          },
          data: {
            retryCount: { increment: 1 },
            lastError: errorMsg,
          },
        });

        // Check if max retries reached
        if (updatedEvent.retryCount >= updatedEvent.maxRetries) {
          logger.error(
            {
              requestId,
              eventId: event.id,
              retryCount: updatedEvent.retryCount,
              maxRetries: updatedEvent.maxRetries,
            },
            'Webhook max retries reached, alerting'
          );

          await alertWebhookFailure({
            webhookId: webhookEvent.id,
            source: 'stripe',
            eventId: event.id,
            eventType: event.type,
            error: errorMsg,
            retryCount: updatedEvent.retryCount,
            maxRetries: updatedEvent.maxRetries,
            timestamp: new Date(),
          });

          // Return 200 to stop Stripe from retrying
          return NextResponse.json({ received: true });
        }

        // Return 500 to trigger Stripe retry
        return NextResponse.json(
          { error: errorMsg, retryCount: updatedEvent.retryCount },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: errorMsg,
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

  const userId = session.metadata?.userId;
  const itemsMetadata = session.metadata?.items;

  if (!userId || !itemsMetadata) {
    logger.error(
      { requestId, sessionId: session.id },
      'Missing userId or items in session metadata'
    );
    return;
  }

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

  // Créer la commande depuis les items dans metadata (toujours)
  const items = JSON.parse(itemsMetadata) as Array<{
    variantId: string;
    quantity: number;
  }>;

  logger.info(
    { requestId, userId, itemsCount: items.length },
    'Creating order from purchased items'
  );

  // Récupérer les variants depuis la DB
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map(i => i.variantId) } },
    include: {
      pricing: {
        where: { isActive: true },
        orderBy: { validFrom: 'desc' },
        take: 1,
      },
      media: true,
      product: {
        include: {
          translations: { take: 1 },
        },
      },
    },
  });

  // Construire un "cart virtuel" pour réutiliser createOrderFromCart
  const virtualCart = {
    id: 'virtual_' + session.id,
    userId,
    currency: (session.currency || 'eur').toUpperCase(),
    anonymousId: session.metadata?.anonymousId || null,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: items.map(item => {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      return {
        id: 'temp_' + item.variantId,
        cartId: 'virtual',
        variantId: item.variantId,
        quantity: item.quantity,
        variant,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
  };

  await createOrderFromCart({
    cart: virtualCart as any,
    userId,
    paymentIntent: {
      id: paymentIntentId,
      amount: session.amount_total || 0,
      currency: session.currency || 'eur',
    } as Stripe.PaymentIntent,
  });

  // Si un cartId existe, vider le panier (optionnel)
  const cartId = session.metadata?.cartId;
  if (cartId) {
    await clearCart(cartId);
    logger.info({ requestId, cartId }, 'Cart cleared after order creation');
  }

  logger.info(
    { requestId, sessionId: session.id, itemsCount: items.length },
    'Order created successfully'
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

  const userId = paymentIntent.metadata?.userId;
  const itemsMetadata = paymentIntent.metadata?.items;

  if (!userId || !itemsMetadata) {
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

  const items = JSON.parse(itemsMetadata) as Array<{
    variantId: string;
    quantity: number;
  }>;

  logger.info(
    { requestId, userId, itemsCount: items.length },
    'Creating order from purchased items'
  );

  // Récupérer les variants depuis la DB
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map(i => i.variantId) } },
    include: {
      pricing: {
        where: { isActive: true },
        orderBy: { validFrom: 'desc' },
        take: 1,
      },
      media: true,
      product: {
        include: {
          translations: { take: 1 },
        },
      },
    },
  });

  // Construire un "cart virtuel" pour réutiliser createOrderFromCart
  const virtualCart = {
    id: 'virtual_' + paymentIntent.id,
    userId,
    currency: paymentIntent.currency.toUpperCase(),
    anonymousId: paymentIntent.metadata?.anonymousId || null,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: items.map(item => {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      return {
        id: 'temp_' + item.variantId,
        cartId: 'virtual',
        variantId: item.variantId,
        quantity: item.quantity,
        variant,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
  };

  await createOrderFromCart({
    cart: virtualCart as any,
    userId,
    paymentIntent,
  });

  // Si un cartId existe, vider le panier (optionnel)
  const cartId = paymentIntent.metadata?.cartId;
  if (cartId) {
    await clearCart(cartId);
    logger.info({ requestId, cartId }, 'Cart cleared after order creation');
  }

  logger.info(
    { requestId, paymentIntentId: paymentIntent.id, itemsCount: items.length },
    'Order created successfully'
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
