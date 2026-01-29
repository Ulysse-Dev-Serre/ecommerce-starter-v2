import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { clearCart, getOrCreateCart } from '@/lib/services/cart.service';
import { releaseStock } from '@/lib/services/inventory.service';
import {
  createOrderFromCart,
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlert,
} from '@/lib/services/orders';
import {
  alertInvalidSignature,
  alertWebhookFailure,
} from '@/lib/services/webhook-alert.service';
import {
  generatePayloadHash,
  validateWebhookSignature,
} from '@/lib/integrations/stripe/webhooks';

import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { env } from '@/lib/core/env';
import { withError } from '@/lib/middleware/withError';

import { SITE_CURRENCY } from '@/lib/config/site';
// ... (imports remain)

async function handler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  let stripeEvent: Stripe.Event | undefined;

  // REMOVED: Top-level try-catch block is now handled by withError

  const body = await request.text();

  // LOG TOTAL: RAW BODY
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

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error({ requestId }, 'STRIPE_WEBHOOK_SECRET not configured');
    // Using 500 triggers retry, which is correct for config error
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

  try {
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
    // Business logic error handling (DB updates, Alerts)
    // We bubble this up if we want standard 500, OR we handle it here if we need specific alert logic.
    // The original code handled retries and alerts here. We should KEEP this inner try/catch
    // for the business logic alerts, but rely on withError for anything that slips through.

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
        // Trigger retry
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }
    }
    // If no event found to update, still error out
    throw error; // Let withError handle the final fallback
  }
}

export const POST = withError(withRateLimit(handler, RateLimits.WEBHOOK));

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

  const order = await createOrderFromCart({
    cart: virtualCart as any,
    userId,
    paymentIntent: {
      id: paymentIntentId,
      amount: session.amount_total || 0,
      currency: session.currency || 'eur',
      receipt_email: (session.customer_details as any)?.email || null,
      metadata: session.metadata || {},
    } as Stripe.PaymentIntent,
    shippingAddress,
  });

  // Envoyer les emails de confirmation
  try {
    const recipientEmail = (session.customer_details as any)?.email;
    if (recipientEmail) {
      const calculation = {
        items: order.items.map((item: any) => ({
          productName: item.productSnapshot?.name || 'Product',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.totalPrice,
          variantId: item.variantId,
          sku: item.productSnapshot?.sku || '',
          currency: item.currency,
        })),
      };

      await sendOrderConfirmationEmail(
        order,
        calculation,
        shippingAddress,
        recipientEmail
      );
      await sendAdminNewOrderAlert(order, calculation, shippingAddress);
    }
  } catch (emailError) {
    logger.error(
      { error: emailError, orderId: order.id },
      'Failed to send order emails'
    );
  }

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
  // Strict: Ensure currency is correct using SITE_CURRENCY or PaymentIntent currency
  const currency = (paymentIntent.currency || SITE_CURRENCY).toUpperCase();

  const virtualCart = {
    id: 'virtual_' + paymentIntent.id,
    userId,
    currency: currency, // STRICT: Explicit currency
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

  const order = await createOrderFromCart({
    cart: virtualCart as any,
    userId,
    paymentIntent,
    shippingAddress,
  });

  // Envoyer les emails de confirmation
  try {
    const recipientEmail = paymentIntent.receipt_email;
    if (recipientEmail) {
      const calculation = {
        items: order.items.map((item: any) => ({
          productName: item.productSnapshot?.name || 'Product',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.totalPrice,
          variantId: item.variantId,
          sku: item.productSnapshot?.sku || '',
          currency: item.currency,
        })),
      };

      await sendOrderConfirmationEmail(
        order,
        calculation,
        shippingAddress,
        recipientEmail
      );
      await sendAdminNewOrderAlert(order, calculation, shippingAddress);
    }
  } catch (emailError) {
    logger.error(
      { error: emailError, orderId: order.id },
      'Failed to send order emails'
    );
  }

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
