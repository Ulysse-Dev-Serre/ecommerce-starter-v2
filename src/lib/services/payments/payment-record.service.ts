import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  CreatePaymentRecordInput,
  UpdatePaymentStatusInput,
} from '@/lib/types/domain/payment';
import { Prisma } from '@/generated/prisma';

/**
 * Crée un enregistrement de paiement en base de données
 * Appelé après succès d'un paiement Stripe
 *
 * @param input - Données du paiement à enregistrer
 */
export async function createPaymentRecord(
  input: CreatePaymentRecordInput
): Promise<void> {
  const {
    orderId,
    amount,
    currency,
    method,
    externalId,
    status,
    transactionData,
  } = input;

  await prisma.payment.create({
    data: {
      orderId,
      amount,
      currency,
      method,
      externalId,
      status,
      transactionData: transactionData as Prisma.InputJsonValue,
      processedAt: new Date(),
    },
  });

  logger.info(
    {
      orderId,
      externalId,
      amount,
      currency,
      method,
      status,
    },
    'Payment record created in database'
  );
}

/**
 * Met à jour le statut d'un paiement existant
 * Utilisé pour gérer les échecs ou changements de statut
 *
 * @param input - Paramètres de mise à jour
 */
export async function updatePaymentStatus(
  input: UpdatePaymentStatusInput
): Promise<void> {
  const { externalId, status, failureReason } = input;

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
    'Payment status updated in database'
  );
}

/**
 * Récupère un paiement par son ID externe (Stripe Payment Intent ID)
 *
 * @param externalId - ID du paiement externe
 * @returns Paiement trouvé ou null
 */
export async function getPaymentByExternalId(externalId: string) {
  return prisma.payment.findFirst({
    where: { externalId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          currency: true,
        },
      },
    },
  });
}
