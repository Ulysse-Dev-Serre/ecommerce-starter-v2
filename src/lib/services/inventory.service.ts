import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';

export interface ReserveStockInput {
  variantId: string;
  quantity: number;
}

export async function checkStockAvailability(
  variantId: string,
  quantity: number
): Promise<{ available: boolean; availableStock: number }> {
  const inventory = await prisma.productVariantInventory.findUnique({
    where: { variantId },
  });

  if (!inventory) {
    return { available: false, availableStock: 0 };
  }

  if (!inventory.trackInventory) {
    return { available: true, availableStock: Infinity };
  }

  const availableStock = inventory.stock - inventory.reservedStock;

  if (availableStock >= quantity) {
    return { available: true, availableStock };
  }

  if (inventory.allowBackorder) {
    return { available: true, availableStock };
  }

  return { available: false, availableStock };
}

export async function reserveStock(items: ReserveStockInput[]): Promise<void> {
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

export async function releaseStock(items: ReserveStockInput[]): Promise<void> {
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

export async function decrementStock(
  items: ReserveStockInput[]
): Promise<void> {
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

export async function incrementStock(
  items: ReserveStockInput[]
): Promise<void> {
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
