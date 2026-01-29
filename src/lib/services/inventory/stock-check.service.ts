import { prisma } from '@/lib/core/db';
import { StockAvailability } from '@/lib/types/domain/inventory';

/**
 * Vérifie la disponibilité du stock pour une variante
 *
 * @param variantId - ID de la variante à vérifier
 * @param quantity - Quantité demandée
 * @returns Disponibilité et stock disponible
 */
export async function checkStockAvailability(
  variantId: string,
  quantity: number
): Promise<StockAvailability> {
  const inventory = await prisma.productVariantInventory.findUnique({
    where: { variantId },
  });

  if (!inventory) {
    return { available: false, availableStock: 0 };
  }

  // Si le tracking d'inventaire est désactivé, toujours disponible
  if (!inventory.trackInventory) {
    return { available: true, availableStock: Infinity };
  }

  const availableStock = inventory.stock - inventory.reservedStock;

  // Stock suffisant
  if (availableStock >= quantity) {
    return { available: true, availableStock };
  }

  // Stock insuffisant mais backorder autorisé
  if (inventory.allowBackorder) {
    return { available: true, availableStock };
  }

  // Stock insuffisant
  return { available: false, availableStock };
}

/**
 * Récupère les informations d'inventaire pour une variante
 *
 * @param variantId - ID de la variante
 * @returns Informations d'inventaire ou null
 */
export async function getInventoryInfo(variantId: string) {
  return prisma.productVariantInventory.findUnique({
    where: { variantId },
  });
}

/**
 * Vérifie si le stock est bas (sous le seuil)
 *
 * @param variantId - ID de la variante
 * @returns true si stock bas, false sinon
 */
export async function isLowStock(variantId: string): Promise<boolean> {
  const inventory = await getInventoryInfo(variantId);

  if (!inventory || !inventory.trackInventory) {
    return false;
  }

  if (!inventory.lowStockThreshold) {
    return false;
  }

  const availableStock = inventory.stock - inventory.reservedStock;
  return availableStock <= inventory.lowStockThreshold;
}
