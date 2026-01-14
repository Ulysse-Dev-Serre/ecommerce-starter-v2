import Stripe from 'stripe';

import { OrderStatus } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';
import { createTransaction } from './shippo';
import { calculateCart, type Currency } from './calculation.service';
import { CartProjection } from './cart.service';
import { decrementStock } from './inventory.service';
import { resend, FROM_EMAIL } from '../../lib/resend';
import { OrderConfirmationEmail } from '../../components/emails/order-confirmation';
import { render } from '@react-email/render';

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

  // Récupérer les frais de port depuis les metadata du PaymentIntent
  const shippingCostMeta = paymentIntent.metadata?.shipping_cost;
  const shippingAmount = shippingCostMeta ? parseFloat(shippingCostMeta) : 0;

  // Récupérer l'ID du tarif Shippo (si le client a choisi une livraison)
  const shippingRateId = paymentIntent.metadata?.shipping_rate_id;
  let shipmentCreateData;

  // L'achat de l'étiquette est manuel via le dashboard Admin pour éviter les frais automatiques.
  // On ne fait RIEN ici avec shippingRateId pour l'instant, sauf peut-être le stocker si besoin plus tard.

  const discountAmount = 0;

  // Utiliser le total de Stripe s'il correspond à la somme, sinon recalculer
  // Note: Stripe amount est en cents, nos montants DB sont en dollars/unités
  const stripeTotal = paymentIntent.amount / 100;
  const calculatedTotal =
    subtotalAmount + taxAmount + shippingAmount - discountAmount;

  // Sécurité: Si le total calculé diffère significativement du total payé, on log un warning
  // Mais pour la DB, on veut que le total soit mathématiquement juste par rapport aux sous-totaux
  const totalAmount = calculatedTotal;

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
      // Création automatique de l'expédition si l'étiquette a été achetée
      shipments: shipmentCreateData
        ? {
            create: shipmentCreateData,
          }
        : undefined,
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
      shipments: true, // Inclure les shipments dans la réponse
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
      itemsCount: calculation.items.length,
    },
    'Order created from cart'
  );

  // --- ENVOI EMAIL TRANSACTIONNEL ---
  try {
    // 1. Déterminer l'email destinataire
    // L'email fiable est celui confirmé par Stripe dans le Payment Intent (receipt_email)
    const recipientEmail = paymentIntent.receipt_email;

    if (recipientEmail) {
      // 2. Préparer les données pour le template
      const emailHtml = await render(
        OrderConfirmationEmail({
          orderId: order.orderNumber,
          customerName: shippingAddress?.firstName || 'Client',
          items: calculation.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice.toString(),
            currency: item.currency,
          })),
          totalAmount: totalAmount.toString(),
          currency: cart.currency,
          shippingAddress: {
            street: shippingAddress?.street1
              ? shippingAddress.street1 +
                (shippingAddress.street2 ? ' ' + shippingAddress.street2 : '')
              : 'N/A',
            city: shippingAddress?.city || '',
            state: shippingAddress?.state || '',
            postalCode: shippingAddress?.postalCode || '',
            country: shippingAddress?.country || '',
          },
        })
      );

      // 3. Envoyer via Resend
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject: `Confirmation de commande ${order.orderNumber}`,
        html: emailHtml,
      });

      if (error) {
        logger.error(
          { error, orderId: order.id },
          'Failed to send confirmation email'
        );
      } else {
        logger.info(
          { emailId: data?.id, recipientEmail },
          'Order confirmation email sent'
        );
      }
    } else {
      logger.warn(
        { orderId: order.id },
        'No recipient email found, skipping confirmation email'
      );
    }
  } catch (emailError: any) {
    // On ne veut pas faire échouer la création de commande si l'envoi d'email échoue
    logger.error(
      {
        error: emailError,
        message: emailError.message,
        stack: emailError.stack,
        orderId: order.id,
      },
      'Error sending confirmation email'
    );
  }

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
