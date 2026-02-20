import Stripe from 'stripe';

import { SITE_CURRENCY } from '@/lib/config/site';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { clearCart, getOrCreateCart } from '@/lib/services/cart';
import { releaseStock } from '@/lib/services/inventory';
import {
  createOrderFromCart,
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlert,
} from '@/lib/services/orders';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import { CartProjection } from '@/lib/types/domain/cart';
import {
  Address,
  OrderWithIncludes,
  OrderItem,
} from '@/lib/types/domain/order';
import {
  parseStripeItems,
  StripeMetadata,
} from '@/lib/validators/stripe-webhook';

export class StripeWebhookService {
  /**
   * Handle checkout.session.completed
   */
  static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
    requestId: string
  ): Promise<void> {
    logger.info(
      {
        requestId,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      },
      'Processing checkout session completed'
    );

    if (session.payment_status !== 'paid') {
      logger.warn(
        { requestId, sessionId: session.id },
        'Session not paid, skipping order creation'
      );
      return;
    }

    const metadata = session.metadata as StripeMetadata;
    const items = parseStripeItems(metadata.items);

    if (!metadata.userId || items.length === 0) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Missing critical metadata: userId=${metadata.userId}, itemsCount=${items.length}`,
        400
      );
    }

    const paymentIntentId = session.payment_intent as string;
    const existingPayment = await prisma.payment.findFirst({
      where: { externalId: paymentIntentId },
    });

    if (existingPayment) {
      logger.info({ requestId, paymentIntentId }, 'Payment already processed');
      return;
    }

    if (!session.amount_total || !session.currency) {
      throw new AppError(
        ErrorCode.PAYMENT_FAILED,
        `Missing amount or currency in Stripe Session: ${session.id}`,
        400
      );
    }

    // Create Virtual Cart & Order
    await this.processOrderCreation(
      session.id,
      paymentIntentId,
      metadata.userId ?? '',
      items,
      session.amount_total,
      session.currency,
      session.customer_details, // Address source for Session
      metadata,
      requestId,
      metadata.anonymousId
    );
  }

  /**
   * Handle payment_intent.succeeded
   */
  static async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    requestId: string
  ): Promise<void> {
    logger.info(
      {
        requestId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
      },
      'Processing payment intent succeeded'
    );

    const metadata = paymentIntent.metadata as StripeMetadata;
    const items = parseStripeItems(metadata.items);

    // For PaymentIntents, userId might be empty for guests, but we need items
    if (items.length === 0) {
      logger.warn({ requestId }, 'Missing items in payment intent metadata');
      return;
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { externalId: paymentIntent.id },
    });

    if (existingPayment) {
      logger.info(
        { requestId, paymentIntentId: paymentIntent.id },
        'Payment already processed'
      );
      return;
    }

    // Determine address source. For PaymentIntent, email is in receipt_email
    const shippingDetails =
      paymentIntent.shipping ||
      (
        paymentIntent as unknown as {
          customer_details?: Stripe.Checkout.Session.CustomerDetails;
        }
      ).customer_details;
    const addressSource = {
      ...shippingDetails,
      email: paymentIntent.receipt_email, // IMPORTANT for PI
    };

    if (!paymentIntent.amount || !paymentIntent.currency) {
      throw new AppError(
        ErrorCode.PAYMENT_FAILED,
        `Missing amount or currency in PaymentIntent: ${paymentIntent.id}`,
        400
      );
    }

    await this.processOrderCreation(
      paymentIntent.id,
      paymentIntent.id,
      metadata.userId, // Can be undefined (Guest)
      items,
      paymentIntent.amount,
      paymentIntent.currency,
      addressSource as Stripe.Checkout.Session.CustomerDetails,
      metadata,
      requestId,
      metadata.anonymousId,
      paymentIntent // Pass full object for flexibility
    );
  }

  /**
   * Handle payment_intent.payment_failed
   */
  static async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
    requestId: string
  ): Promise<void> {
    const errorMsg = paymentIntent.last_payment_error?.message;
    logger.warn(
      { requestId, paymentIntentId: paymentIntent.id, error: errorMsg },
      'Payment intent failed'
    );

    const cartId = paymentIntent.metadata?.cartId;
    if (cartId) {
      await this.releaseReservedStock(
        cartId,
        paymentIntent.metadata?.userId,
        paymentIntent.metadata?.anonymousId
      );
      logger.info(
        { requestId, cartId },
        'Stock released after payment failure'
      );
    }
  }

  /**
   * Handle checkout.session.expired
   */
  static async handleCheckoutSessionExpired(
    session: Stripe.Checkout.Session,
    requestId: string
  ): Promise<void> {
    logger.info(
      { requestId, sessionId: session.id },
      'Checkout session expired'
    );

    const cartId = session.metadata?.cartId;
    if (cartId) {
      await this.releaseReservedStock(
        cartId,
        session.metadata?.userId,
        session.metadata?.anonymousId
      );
      logger.info(
        { requestId, cartId },
        'Stock released after session expiration'
      );
    }
  }

  // --- PRIVATE HELPERS ---

  private static async releaseReservedStock(
    cartId: string,
    userId?: string,
    anonymousId?: string
  ) {
    try {
      const cart = await getOrCreateCart(userId, anonymousId);
      // We assume the cart items still exist and match.
      // In a real scenario, we might want to use the metadata items to be precise,
      // but releasing the user's current cart is a decent fallback for "releasing reservation".
      await releaseStock(
        cart.items.map(item => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        }))
      );
    } catch (e) {
      logger.error({ error: e, cartId }, 'Failed to release stock');
    }
  }

  private static async processOrderCreation(
    virtualCartInfoId: string,
    paymentIntentId: string,
    userId: string | undefined, // undefined if Guest
    items: Array<{ variantId: string; quantity: number }>,
    amountTotal: number,
    currencyCode: string,
    addressSource:
      | Stripe.Checkout.Session.CustomerDetails
      | Stripe.PaymentIntent.Shipping
      | null
      | undefined,
    metadata: StripeMetadata,
    requestId: string,
    anonymousId?: string,
    fullPaymentIntent?: Stripe.PaymentIntent
  ) {
    // 1. Fetch Variants
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: items.map(i => i.variantId) } },
      include: {
        pricing: { where: { isActive: true }, orderBy: { validFrom: 'desc' } },
        media: true,
        product: { include: { translations: { take: 1 } } },
      },
    });

    // 2. Build Virtual Cart
    const currency = (currencyCode || SITE_CURRENCY).toUpperCase();
    const virtualCart = {
      id: 'virtual_' + virtualCartInfoId,
      userId: userId || undefined,
      currency: currency,
      anonymousId: anonymousId || null,
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

    const shippingAddress = this.extractShippingAddress(addressSource);

    const orderEmail =
      (addressSource && 'email' in addressSource
        ? (addressSource as { email?: string | null }).email
        : undefined) || fullPaymentIntent?.receipt_email;

    if (!orderEmail) {
      throw new Error(
        'Order creation aborted: Missing orderEmail from Stripe metadata or session.'
      );
    }

    const order = (await createOrderFromCart({
      cart: virtualCart as unknown as CartProjection,
      userId: userId || undefined,
      orderEmail: orderEmail,
      paymentIntent:
        fullPaymentIntent ||
        ({
          id: paymentIntentId,
          amount: amountTotal,
          currency: currencyCode,
          metadata: metadata as Record<string, string>,
          receipt_email: orderEmail,
        } as Stripe.PaymentIntent),
      shippingAddress: shippingAddress as Address,
    })) as unknown as OrderWithIncludes;

    logger.info(
      { requestId, orderId: order.id },
      'Order created successfully via Stripe Webhook'
    );

    // 5. Send Emails
    await this.sendConfirmationEmails(
      order,
      shippingAddress ?? ({} as Address),
      orderEmail
    );

    // 6. Clear Original Cart
    if (metadata.cartId) {
      await clearCart(metadata.cartId);
      logger.info(
        { requestId, cartId: metadata.cartId },
        'Original cart cleared'
      );
    }
  }

  private static extractShippingAddress(
    source:
      | Stripe.Checkout.Session.CustomerDetails
      | Stripe.PaymentIntent.Shipping
      | null
      | undefined
  ): Address | undefined {
    if (!source) return undefined;

    // Stripe structures vary (shipping vs customer_details)
    // We expect a normalized "source" passed in (either customer_details or shipping)
    const addr = source.address;
    if (!addr || !addr.line1 || !source.name || !addr.city || !addr.country) {
      logger.error(
        { source },
        'Missing critical shipping information in Stripe webhook'
      );
      throw new Error('Critical shipping information missing');
    }

    return {
      name: source.name,
      street1: addr.line1,
      street2: addr.line2 || undefined,
      city: addr.city,
      state: addr.state || '',
      zip: addr.postal_code || '',
      country: addr.country,
      firstName: source.name.split(' ')[0] || '',
      lastName: source.name.split(' ').slice(1).join(' ') || '',
      phone: source.phone || undefined,
      email: (source as { email?: string }).email,
    };
  }

  private static async sendConfirmationEmails(
    order: OrderWithIncludes,
    shippingAddress: Address,
    recipientEmail: string | null | undefined
  ) {
    if (!recipientEmail) return;

    try {
      const calculation = {
        items: order.items.map((item: OrderItem) => {
          const snapshot = item.productSnapshot as Record<string, unknown>;
          return {
            productName: (snapshot?.name as string) || 'Product',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.totalPrice,
            variantId: item.variantId,
            sku: (snapshot?.sku as string) || '',
            currency:
              item.currency as import('@/lib/config/site').SupportedCurrency,
          };
        }),
      };

      await sendOrderConfirmationEmail(
        order,
        calculation,
        shippingAddress,
        recipientEmail
      );
      await sendAdminNewOrderAlert(order, calculation, shippingAddress);
    } catch (e) {
      logger.error(
        { error: e, orderId: order.id },
        'Failed to send confirmation emails'
      );
    }
  }
}
