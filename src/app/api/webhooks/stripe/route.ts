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

  let stripeEvent: Stripe.Event | undefined;

  try {
    const body = await request.text();

    // LOG TOTAL: RAW BODY (Tronqué à 5000 chars pour éviter le spam, mais suffisant pour le début)
    logger.info(
      {
        rawBodyPreview: body.substring(0, 5000),
        length: body.length,
      },
      'DEBUG: STRIPE WEBHOOK RAW BODY'
    );

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
      'Webhook event received'
    );

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

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, requestId);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent, requestId);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent, requestId);
        break;
      }

      case 'checkout.session.expired': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(session, requestId);
        break;
      }

      default:
        logger.info(
          { requestId, eventType: stripeEvent.type },
          'Unhandled webhook event type'
        );
    }

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

    // Update webhook event with error details if event exists
    if (stripeEvent?.id) {
      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: {
          source_eventId: {
            source: 'stripe',
            eventId: stripeEvent.id,
          },
        },
      });

      if (webhookEvent) {
        const updatedEvent = await prisma.webhookEvent.update({
          where: {
            source_eventId: {
              source: 'stripe',
              eventId: stripeEvent.id,
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
              eventId: stripeEvent.id,
              retryCount: updatedEvent.retryCount,
              maxRetries: updatedEvent.maxRetries,
            },
            'Webhook max retries reached, alerting'
          );

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

// Helper pour extraire l'adresse de Stripe
function extractShippingAddress(
  source: Stripe.Checkout.Session | Stripe.PaymentIntent
): any {
  let shippingDetails;

  if ('customer_details' in source && source.customer_details) {
    shippingDetails = source.customer_details; // Checkout Session
  } else if ('shipping' in source && source.shipping) {
    shippingDetails = source.shipping; // Payment Intent
  }

  if (!shippingDetails || !shippingDetails.address) return undefined;

  const addr = shippingDetails.address;

  return {
    name: shippingDetails.name,
    street1: addr.line1,
    street2: addr.line2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postal_code,
    country: addr.country,
    // On essaie de préserver le format
    firstName: shippingDetails.name?.split(' ')[0] || '',
    lastName: shippingDetails.name?.split(' ').slice(1).join(' ') || '',
    phone: shippingDetails.phone,
    email:
      'email' in shippingDetails ? (shippingDetails as any).email : undefined,
  };
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  requestId: string
): Promise<void> {
  // ... (logs existants)
  logger.info(
    {
      requestId,
      sessionId: session.id,
      paymentStatus: session.payment_status,
    },
    'Checkout session completed'
  );

  if (session.payment_status !== 'paid') {
    // ...
    return;
  }

  const userId = session.metadata?.userId;
  const itemsMetadata = session.metadata?.items;

  if (!userId || !itemsMetadata) {
    // ...
    return;
  }

  const paymentIntentId = session.payment_intent as string;
  const existingPayment = await prisma.payment.findFirst({
    where: { externalId: paymentIntentId },
  });

  if (existingPayment) {
    // ...
    return;
  }

  // Créer la commande depuis les items dans metadata
  const items = JSON.parse(itemsMetadata) as Array<{
    variantId: string;
    quantity: number;
  }>;

  logger.info(
    { requestId, userId, itemsCount: items.length },
    'Creating order from purchased items'
  );

  // ... (récupération variants inchangée)
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

  // Construire un "cart virtuel"
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

  // Extraction de l'adresse
  const shippingAddress = extractShippingAddress(session);

  await createOrderFromCart({
    cart: virtualCart as any,
    userId,
    paymentIntent: {
      id: paymentIntentId,
      amount: session.amount_total || 0,
      currency: session.currency || 'eur',
      // On mock le reste pour satisfaire le type si besoin, ou on fait confiance au cast
    } as Stripe.PaymentIntent,
    shippingAddress, // <--- AJOUT IMPORTANT
  });

  // ... (reste de la fonction)
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
  // ... (logs)
  logger.info(
    {
      requestId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      debug_receipt_email: paymentIntent.receipt_email,
      debug_charges_count: (paymentIntent as any).charges?.data?.length,
      // charges data might be expandable
      debug_charge_email: (paymentIntent as any).charges?.data?.[0]
        ?.billing_details?.email,
    },
    'Payment intent succeeded'
  );

  logger.info(
    {
      paymentIntentFull: JSON.stringify(paymentIntent, null, 2),
    },
    'DEBUG: Full Payment Intent Object'
  );

  const userId = paymentIntent.metadata?.userId;
  const itemsMetadata = paymentIntent.metadata?.items;

  if (!userId || !itemsMetadata) {
    // ...
    return;
  }

  // ... (check existing payment)
  const existingPayment = await prisma.payment.findFirst({
    where: { externalId: paymentIntent.id },
  });

  if (existingPayment) {
    return;
  }

  const items = JSON.parse(itemsMetadata) as Array<{
    variantId: string;
    quantity: number;
  }>;

  // ... (récupération variants)
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

  // Virtual Cart
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

  // Extraction de l'adresse
  const shippingAddress = extractShippingAddress(paymentIntent);

  // CORRECTION: Pour un PaymentIntent, l'email n'est pas dans shipping, mais dans receipt_email
  if (shippingAddress && paymentIntent.receipt_email) {
    shippingAddress.email = paymentIntent.receipt_email;
  }

  await createOrderFromCart({
    cart: virtualCart as any,
    userId,
    paymentIntent,
    shippingAddress, // <--- Contient maintenant l'email
  });

  // ... (reste)
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
