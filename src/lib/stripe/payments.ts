import Stripe from 'stripe';

import { PaymentMethod, PaymentStatus } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';

export async function createPaymentRecord(
  orderId: string,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  await prisma.payment.create({
    data: {
      orderId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      method: PaymentMethod.STRIPE,
      externalId: paymentIntent.id,
      status: PaymentStatus.COMPLETED,
      transactionData: paymentIntent as any,
      processedAt: new Date(),
    },
  });

  logger.info(
    {
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
    },
    'Payment record created'
  );
}

export async function updatePaymentStatus(
  externalId: string,
  status: PaymentStatus,
  failureReason?: string
): Promise<void> {
  await prisma.payment.updateMany({
    where: { externalId },
    data: {
      status,
      failureReason,
      processedAt: new Date(),
    },
  });

  logger.info(
    {
      externalId,
      status,
      failureReason,
    },
    'Payment status updated'
  );
}
