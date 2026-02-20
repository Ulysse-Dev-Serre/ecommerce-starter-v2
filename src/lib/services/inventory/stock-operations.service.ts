import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { StockItem } from '@/lib/types/domain/inventory';

import { Prisma } from '@/generated/prisma';

/**
 * Décrémente le stock et libère la réservation
 * Utilisé lors de la confirmation d'une commande
 *
 * @param items - Items à décrémenter
 * @param tx - Transaction client optionnelle
 */
export async function decrementStock(
  items: StockItem[],
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || prisma;

  for (const item of items) {
    await client.productVariantInventory.update({
      where: { variantId: item.variantId },
      data: {
        stock: {
          decrement: item.quantity,
        },
        reservedStock: {
          decrement: item.quantity,
        },
      },
    });

    logger.info(
      {
        variantId: item.variantId,
        quantity: item.quantity,
        inTransaction: !!tx,
      },
      'Stock decremented'
    );
  }
}

/**
 * Incrémente le stock (remboursement/annulation)
 * Utilisé lors d'un refund ou annulation de commande
 *
 * @param items - Items à incrémenter
 * @param tx - Transaction client optionnelle
 */
export async function incrementStock(
  items: StockItem[],
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || prisma;

  for (const item of items) {
    await client.productVariantInventory.update({
      where: { variantId: item.variantId },
      data: {
        stock: {
          increment: item.quantity,
        },
      },
    });

    logger.info(
      {
        variantId: item.variantId,
        quantity: item.quantity,
        inTransaction: !!tx,
      },
      'Stock incremented (refund)'
    );
  }
}
