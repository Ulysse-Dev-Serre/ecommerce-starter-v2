import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { StockItem } from '@/lib/types/domain/inventory';
import { checkStockAvailability } from './stock-check.service';

/**
 * Réserve du stock pour un ensemble d'items
 * Utilisé lors de la création d'un PaymentIntent
 *
 * @param items - Items à réserver
 * @throws Error si stock insuffisant
 */
export async function reserveStock(items: StockItem[]): Promise<void> {
  for (const item of items) {
    const { available } = await checkStockAvailability(
      item.variantId,
      item.quantity
    );

    if (!available) {
      throw new Error(
        `Insufficient stock for variant ${item.variantId}. Requested: ${item.quantity}`
      );
    }

    await prisma.productVariantInventory.update({
      where: { variantId: item.variantId },
      data: {
        reservedStock: {
          increment: item.quantity,
        },
      },
    });

    logger.info(
      {
        variantId: item.variantId,
        quantity: item.quantity,
      },
      'Stock reserved'
    );
  }
}

/**
 * Libère du stock réservé
 * Utilisé lors de l'expiration d'une réservation ou annulation de commande
 *
 * @param items - Items à libérer
 */
export async function releaseStock(items: StockItem[]): Promise<void> {
  for (const item of items) {
    await prisma.productVariantInventory.update({
      where: { variantId: item.variantId },
      data: {
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
      'Stock released'
    );
  }
}
