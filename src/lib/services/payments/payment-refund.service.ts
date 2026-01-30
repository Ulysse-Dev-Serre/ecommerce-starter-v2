import { OrderStatus } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { stripe } from '@/lib/integrations/stripe/client';
import {
  RefundInput,
  RefundResult,
  UpdateOrderStatusInput,
} from '@/lib/types/domain/payment';

/**
 * Traite un remboursement complet ou partiel sur Stripe
 * Wrapper simple pour faciliter l'utilisation depuis les routes API
 *
 * @param input - Paramètres du remboursement
 * @returns Résultat du remboursement
 */
export async function processRefund(input: RefundInput): Promise<RefundResult> {
  const { orderId, amount, reason } = input;

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
      reason: reason as any,
    });

    logger.info(
      { orderId, refundId: refund.id, amount: refund.amount / 100 },
      'Refund processed successfully'
    );

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency.toUpperCase(),
      status: refund.status as any,
      processedAt: new Date(),
    };
  } catch (error: any) {
    logger.error({ error, orderId }, 'Refund processing failed');

    return {
      success: false,
      amount: amount || Number(order.totalAmount),
      currency: order.currency,
      status: 'failed',
      failureReason: error.message,
      processedAt: new Date(),
    };
  }
}

/**
 * Met à jour le statut d'une commande
 * - Gère les remboursements Stripe automatiquement si status = REFUNDED/CANCELLED
 * - Enregistre l'historique de statut
 * - Note: N'envoie PAS d'emails - utilisez order-notifications.service.ts pour ça
 *
 * @param input - Paramètres de mise à jour
 * @returns Commande mise à jour
 */
export async function updateOrderStatus(input: UpdateOrderStatusInput) {
  const { orderId, status, comment, userId } = input;

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
