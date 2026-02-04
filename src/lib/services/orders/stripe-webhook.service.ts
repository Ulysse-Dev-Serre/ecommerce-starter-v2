import Stripe from 'stripe';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { SITE_CURRENCY } from '@/lib/config/site';
import {
  parseStripeItems,
  StripeMetadata,
} from '@/lib/validators/stripe-webhook';
import { clearCart, getOrCreateCart } from '@/lib/services/cart';
import { releaseStock } from '@/lib/services/inventory';
import {
  createOrderFromCart,
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlert,
} from '@/lib/services/orders';

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
      logger.warn(
        { requestId, metadata },
        'Missing critical metadata (userId or items)'
      );
      return;
    }

    const paymentIntentId = session.payment_intent as string;
    const existingPayment = await prisma.payment.findFirst({
      where: { externalId: paymentIntentId },
    });

    if (existingPayment) {
      logger.info({ requestId, paymentIntentId }, 'Payment already processed');
      return;
    }

    // Create Virtual Cart & Order
    await this.processOrderCreation(
      session.id,
      paymentIntentId,
      metadata.userId!,
      items,
      session.amount_total || 0,
      session.currency || 'eur',
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
      paymentIntent.shipping || (paymentIntent as any).customer_details;
    const addressSource = {
      ...shippingDetails,
      email: paymentIntent.receipt_email, // IMPORTANT for PI
    };

    await this.processOrderCreation(
      'pi_' + paymentIntent.id, // Virtual ID prefix
      paymentIntent.id,
      metadata.userId, // Can be undefined (Guest)
      items,
      paymentIntent.amount,
      paymentIntent.currency,
      addressSource,
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
    addressSource: any,
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

    // 3. Extract Address
    const shippingAddress = this.extractShippingAddress(addressSource);

    const orderEmail = addressSource?.email || fullPaymentIntent?.receipt_email;

    // 4. Create Order
    const order = await createOrderFromCart({
      cart: virtualCart as any,
      userId: userId || undefined,
      orderEmail: orderEmail,
      paymentIntent:
        fullPaymentIntent ||
        ({
          id: paymentIntentId,
          amount: amountTotal,
          currency: currencyCode,
          metadata: metadata as any,
          receipt_email: orderEmail,
        } as Stripe.PaymentIntent),
      shippingAddress,
    });

    logger.info(
      { requestId, orderId: order.id },
      'Order created successfully via Stripe Webhook'
    );

    // 5. Send Emails
    await this.sendConfirmationEmails(
      order,
      shippingAddress,
      addressSource?.email || orderEmail
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

  private static extractShippingAddress(source: any): any {
    if (!source) return undefined;

    // Stripe structures vary (shipping vs customer_details)
    // We expect a normalized "source" passed in (either customer_details or shipping)
    const addr = source.address;
    if (!addr) return undefined;

    return {
      name: source.name,
      street1: addr.line1,
      street2: addr.line2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      country: addr.country,
      firstName: source.name?.split(' ')[0] || '',
      lastName: source.name?.split(' ').slice(1).join(' ') || '',
      phone: source.phone,
      email: source.email,
    };
  }

  private static async sendConfirmationEmails(
    order: any,
    shippingAddress: any,
    recipientEmail: string
  ) {
    if (!recipientEmail) return;

    try {
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
    } catch (e) {
      logger.error(
        { error: e, orderId: order.id },
        'Failed to send confirmation emails'
      );
    }
  }
}
