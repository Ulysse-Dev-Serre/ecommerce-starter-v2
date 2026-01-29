import { OrderStatus } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { stripe } from '@/lib/integrations/stripe/client';

/**
 * Met à jour le statut d'une commande
 * - Gère les remboursements Stripe automatiquement si status = REFUNDED/CANCELLED
 * - Enregistre l'historique de statut
 * - Note: N'envoie PAS d'emails - utilisez order-notifications.service.ts pour ça
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  comment?: string,
  userId?: string
) {
  // Logic to process Stripe refund before updating local status
  if (status === 'REFUNDED' || status === 'CANCELLED') {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (existingOrder) {
      const stripePayment = existingOrder.payments.find(
        p => p.method === 'STRIPE' && p.status === 'COMPLETED'
      );

      if (stripePayment?.externalId) {
        try {
          await stripe.refunds.create({
            payment_intent: stripePayment.externalId,
          });
          logger.info(
            { orderId, paymentIntent: stripePayment.externalId },
            'Stripe refund executed successfully'
          );
        } catch (error: any) {
          // If already refunded, allow the function to proceed to update local status
          if (error.code === 'charge_already_refunded') {
            logger.warn(
              { orderId },
              'Charge already refunded in Stripe, proceeding with local status update'
            );
          } else {
            logger.error({ error, orderId }, 'Stripe refund failed');
            // Block the local update if Stripe refund fails for other reasons
            throw new Error(`Stripe refund failed: ${error.message}`);
          }
        }
      }
    }
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatus,
      statusHistory: {
        create: {
          status: status as OrderStatus,
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
      shipments: true,
      payments: true,
      user: true,
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

/**
 * Traite un remboursement sur Stripe
 * Wrapper pour faciliter l'utilisation depuis les routes API
 */
export async function processRefund(orderId: string, amount?: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const stripePayment = order.payments.find(
    p => p.method === 'STRIPE' && p.status === 'COMPLETED'
  );

  if (!stripePayment?.externalId) {
    throw new Error('No Stripe payment found for this order');
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: stripePayment.externalId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
    });

    logger.info(
      { orderId, refundId: refund.id, amount: refund.amount },
      'Refund processed successfully'
    );

    return refund;
  } catch (error: any) {
    logger.error({ error, orderId }, 'Refund processing failed');
    throw new Error(`Refund failed: ${error.message}`);
  }
}
