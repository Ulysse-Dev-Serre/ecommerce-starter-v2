import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { stripe } from '@/lib/integrations/stripe/client';
import { orderRepository } from '@/lib/repositories/order.repository';
import { incrementStock } from '@/lib/services/inventory';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import {
  RefundInput,
  RefundResult,
  UpdateOrderStatusInput,
} from '@/lib/types/domain/payment';

import { OrderStatus } from '@/generated/prisma';

/**
 * Traite un remboursement complet ou partiel sur Stripe
 * Wrapper simple pour faciliter l'utilisation depuis les routes API
 *
 * @param input - Paramètres du remboursement
 * @returns Résultat du remboursement
 */
export async function processRefund(input: RefundInput): Promise<RefundResult> {
  const { orderId, amount, reason } = input;

  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Order not found', 404);
  }

  const stripePayment = order.payments.find(
    p => p.method === 'STRIPE' && p.status === 'COMPLETED'
  );

  if (!stripePayment?.externalId) {
    throw new AppError(
      ErrorCode.PAYMENT_FAILED,
      'No Stripe payment found for this order',
      400
    );
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: stripePayment.externalId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
      reason,
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
      status: refund.status as 'pending' | 'succeeded' | 'failed',
      processedAt: new Date(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, orderId }, 'Refund processing failed');

    return {
      success: false,
      amount: amount || Number(order.totalAmount),
      currency: order.currency,
      status: 'failed',
      failureReason: errorMessage,
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

  // 1. Fetch current order state with items (needed for restocking)
  const existingOrder = await orderRepository.findById(orderId);

  if (!existingOrder) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Order not found', 404);
  }

  // 2. Process External Refund (Stripe) BEFORE DB updates
  // We want to ensure we can actually refund the money before marking it as refunded in our system.
  if (status === 'REFUNDED' || status === 'CANCELLED') {
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
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorCode = (error as { code?: string }).code;

        // If already refunded, allow the function to proceed to update local status
        if (errorCode === 'charge_already_refunded') {
          logger.warn(
            { orderId },
            'Charge already refunded in Stripe, proceeding with local status update'
          );
        } else {
          logger.error({ error, orderId }, 'Stripe refund failed');
          // Block the local update if Stripe refund fails for other reasons
          throw new AppError(
            ErrorCode.PAYMENT_FAILED,
            `Stripe refund failed: ${errorMessage}`,
            500
          );
        }
      }
    }
  }

  // 3. Atomic DB Update: Status Change + Stock Restoration
  const updatedOrder = await prisma.$transaction(async tx => {
    // Update status
    const order = await tx.order.update({
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
        items: true,
      },
    });

    // If order is now Cancelled or Refunded, restore stock
    if (
      (status === 'REFUNDED' || status === 'CANCELLED') &&
      existingOrder.status !== 'REFUNDED' &&
      existingOrder.status !== 'CANCELLED'
    ) {
      await incrementStock(
        existingOrder.items
          .map(item => ({
            variantId: item.variantId || '',
            quantity: item.quantity,
          }))
          .filter(i => i.variantId), // Safety filter
        tx
      );

      logger.info({ orderId }, 'Stock restored during cancellation/refund');
    }

    return order;
  });

  logger.info(
    {
      orderId,
      newStatus: status,
      updatedBy: userId,
    },
    'Order status updated (Atomic Transaction)'
  );

  return updatedOrder;
}
