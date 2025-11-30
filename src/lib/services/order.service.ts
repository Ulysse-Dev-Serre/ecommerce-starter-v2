import Stripe from 'stripe';

import { OrderStatus } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';
import { calculateCart, type Currency } from './calculation.service';
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

  // Utiliser le service de calcul centralisé
  const currency = cart.currency as Currency;
  const calculation = calculateCart(cart, currency);

  const subtotalAmount = parseFloat(calculation.subtotal.toString());
  const taxAmount = 0; // Géré par Stripe Tax
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
        create: calculation.items.map(item => {
          const cartItem = cart.items.find(i => i.variantId === item.variantId);
          return {
            variantId: item.variantId,
            productId: cartItem?.variant.product.id || '',
            productSnapshot: {
              name: item.productName,
              sku: item.sku,
              image: cartItem?.variant.media.find(m => m.isPrimary)?.url,
            },
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice.toString()),
            totalPrice: parseFloat(item.lineTotal.toString()),
            currency: item.currency,
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

/**
 * Get all orders for a specific user
 */
export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      payments: {
        select: {
          status: true,
          method: true,
        },
      },
    },
  });

  return orders;
}

/**
 * Get all orders for admin (with pagination and filters)
 */
export async function getAllOrders({
  page = 1,
  limit = 20,
  status,
  search,
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                slug: true,
                translations: {
                  take: 1,
                },
              },
            },
            variant: {
              select: {
                sku: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            status: true,
            externalId: true,
            processedAt: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get order by ID for admin (no user restriction)
 */
export async function getOrderByIdAdmin(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          clerkId: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              translations: true,
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
            },
          },
        },
      },
      payments: true,
      shipments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  comment?: string,
  userId?: string
) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          comment,
          createdBy: userId,
        },
      },
    },
    include: {
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  logger.info(
    {
      orderId,
      newStatus: status,
      updatedBy: userId,
    },
    'Order status updated'
  );

  return order;
}
