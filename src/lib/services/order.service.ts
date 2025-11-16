import Stripe from 'stripe';

import { OrderStatus } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';
import { CartProjection } from './cart.service';
import { decrementStock } from './inventory.service';

export interface CreateOrderFromCartInput {
  cart: CartProjection;
  userId: string;
  paymentIntent: Stripe.PaymentIntent;
  shippingAddress?: any;
  billingAddress?: any;
}

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  const orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  return orderNumber;
}

export async function createOrderFromCart({
  cart,
  userId,
  paymentIntent,
  shippingAddress,
  billingAddress,
}: CreateOrderFromCartInput) {
  const orderNumber = await generateOrderNumber();

  const subtotalAmount = cart.items.reduce((sum, item) => {
    const pricing = item.variant.pricing.find(
      p => p.currency === cart.currency
    );
    const price = pricing ? parseFloat(pricing.price.toString()) : 0;
    return sum + price * item.quantity;
  }, 0);

  const taxAmount = 0;
  const shippingAmount = 0;
  const discountAmount = 0;
  const totalAmount =
    subtotalAmount + taxAmount + shippingAmount - discountAmount;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: OrderStatus.PAID,
      currency: cart.currency,
      subtotalAmount,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      shippingAddress: shippingAddress || {},
      billingAddress: billingAddress || {},
      items: {
        create: cart.items.map(item => {
          const pricing = item.variant.pricing.find(
            p => p.currency === cart.currency
          );
          const unitPrice = pricing ? parseFloat(pricing.price.toString()) : 0;

          return {
            variantId: item.variant.id,
            productId: item.variant.product.id,
            productSnapshot: {
              name: item.variant.product.translations[0]?.name || 'Product',
              sku: item.variant.sku,
              image: item.variant.media.find(m => m.isPrimary)?.url,
            },
            quantity: item.quantity,
            unitPrice,
            totalPrice: unitPrice * item.quantity,
            currency: cart.currency,
          };
        }),
      },
      payments: {
        create: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          method: 'STRIPE',
          externalId: paymentIntent.id,
          status: 'COMPLETED',
          transactionData: paymentIntent as any,
          processedAt: new Date(),
        },
      },
    },
    include: {
      items: true,
      payments: true,
    },
  });

  await decrementStock(
    cart.items.map(item => ({
      variantId: item.variant.id,
      quantity: item.quantity,
    }))
  );

  logger.info(
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      itemsCount: order.items.length,
    },
    'Order created from cart'
  );

  return order;
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.userId !== userId) {
    throw new Error('Unauthorized: This order does not belong to you');
  }

  return order;
}

export async function getOrderByNumber(orderNumber: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.userId !== userId) {
    throw new Error('Unauthorized: This order does not belong to you');
  }

  return order;
}
