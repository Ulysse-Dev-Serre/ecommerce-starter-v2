import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { StockItem } from '@/lib/types/domain/inventory';

/**
 * Décrémente le stock et libère la réservation
 * Utilisé lors de la confirmation d'une commande
 *
 * @param items - Items à décrémenter
 */
export async function decrementStock(items: StockItem[]): Promise<void> {
  for (const item of items) {
    await prisma.productVariantInventory.update({
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
 */
export async function incrementStock(items: StockItem[]): Promise<void> {
  for (const item of items) {
    await prisma.productVariantInventory.update({
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
      },
      'Stock incremented (refund)'
    );
  }
}
