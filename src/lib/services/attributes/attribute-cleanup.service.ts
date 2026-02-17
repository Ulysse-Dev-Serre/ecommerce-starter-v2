import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';

/**
 * Cleans up orphaned product attributes and attribute values.
 * An orphan is an attribute value that is no longer linked to any product variant,
 * or an attribute that has no values remaining.
 */
export async function cleanupOrphanedAttributes(): Promise<void> {
  try {
    // 1. Identify attribute values that are no longer used by any variant
    // We look for IDs in ProductAttributeValue that are not in ProductVariantAttributeValue
    const usedValueIds = await prisma.productVariantAttributeValue.findMany({
      select: { attributeValueId: true },
      distinct: ['attributeValueId'],
    });

    const usedIdsList = usedValueIds.map(v => v.attributeValueId);

    // 2. Delete orphaned ProductAttributeValues
    // Cascade delete in schema will handle ProductAttributeValueTranslation
    const deletedValues = await prisma.productAttributeValue.deleteMany({
      where: {
        id: {
          notIn: usedIdsList,
        },
      },
    });

    if (deletedValues.count > 0) {
      logger.info(
        { count: deletedValues.count },
        'Cleaned up orphaned product attribute values'
      );
    }

    // 3. Identify ProductAttributes that have no values remaining
    const orphanedAttributes = await prisma.productAttribute.findMany({
      where: {
        values: {
          none: {},
        },
      },
      select: { id: true },
    });

    if (orphanedAttributes.length > 0) {
      const attributeIds = orphanedAttributes.map(a => a.id);

      // 4. Delete orphaned ProductAttributes
      // Cascade delete will handle ProductAttributeTranslation
      const deletedAttributes = await prisma.productAttribute.deleteMany({
        where: {
          id: {
            in: attributeIds,
          },
        },
      });

      logger.info(
        { count: deletedAttributes.count },
        'Cleaned up orphaned product attributes'
      );
    }

    // 5. Clean up empty carts (Carts without CartItems)
    const emptyCarts = await prisma.cart.findMany({
      where: {
        items: {
          none: {},
        },
      },
      select: { id: true },
    });

    if (emptyCarts.length > 0) {
      const deletedCarts = await prisma.cart.deleteMany({
        where: {
          id: { in: emptyCarts.map(c => c.id) },
        },
      });
      logger.info({ count: deletedCarts.count }, 'Cleaned up empty carts');
    }
  } catch (error) {
    logger.error({ error }, 'Error during orphaned attributes cleanup');
    // We don't throw the error to avoid blocking the main deletion flow
  }
}
