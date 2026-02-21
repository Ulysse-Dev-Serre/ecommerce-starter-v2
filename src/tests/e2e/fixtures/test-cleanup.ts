/**
 * E2E test-specific cleanup utilities.
 *
 * These mirror production service logic but use the CJS-compatible
 * test Prisma client, avoiding the ESM import chain from @/lib/core/db.
 */
import { prisma } from './db';

/**
 * Clean up orphaned product attributes and values.
 * Mirrors @/lib/services/attributes/attribute-cleanup.service.ts
 * but uses the test Prisma client.
 */
export async function cleanupOrphanedAttributes(): Promise<void> {
  try {
    // 1. Find attribute values still in use
    const usedValueIds = await prisma.productVariantAttributeValue.findMany({
      select: { attributeValueId: true },
      distinct: ['attributeValueId'] as any,
    });

    const usedIdsList = usedValueIds.map((v: any) => v.attributeValueId);

    // 2. Delete orphaned ProductAttributeValues
    const deletedValues = await prisma.productAttributeValue.deleteMany({
      where: {
        id: { notIn: usedIdsList },
      },
    });

    if (deletedValues.count > 0) {
      console.log(
        `🧹 Cleaned up ${deletedValues.count} orphaned attribute values`
      );
    }

    // 3. Find ProductAttributes with no values remaining
    const orphanedAttributes = await prisma.productAttribute.findMany({
      where: { values: { none: {} } },
      select: { id: true },
    });

    if (orphanedAttributes.length > 0) {
      const attributeIds = orphanedAttributes.map((a: any) => a.id);

      const deletedAttributes = await prisma.productAttribute.deleteMany({
        where: { id: { in: attributeIds } },
      });

      console.log(
        `🧹 Cleaned up ${deletedAttributes.count} orphaned attributes`
      );
    }

    // 4. Clean up empty carts
    const emptyCarts = await prisma.cart.findMany({
      where: { items: { none: {} } },
      select: { id: true },
    });

    if (emptyCarts.length > 0) {
      const deletedCarts = await prisma.cart.deleteMany({
        where: { id: { in: emptyCarts.map((c: any) => c.id) } },
      });
      console.log(`🧹 Cleaned up ${deletedCarts.count} empty carts`);
    }
  } catch (error) {
    console.error('⚠️ Error during orphaned attributes cleanup:', error);
  }
}
