import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';

/**
 * Nettoie les attributs et valeurs d'attributs orphelins.
 * Un orphelin est une valeur d'attribut qui n'est plus liée à aucun variant de produit,
 * ou un attribut qui n'a plus aucune valeur.
 */
export async function cleanupOrphanedAttributes(): Promise<void> {
  try {
    // 1. Identifier les valeurs d'attributs qui ne sont plus utilisées par aucun variant
    // On cherche les IDs dans ProductAttributeValue qui ne sont pas dans ProductVariantAttributeValue
    const usedValueIds = await prisma.productVariantAttributeValue.findMany({
      select: { attributeValueId: true },
      distinct: ['attributeValueId'],
    });

    const usedIdsList = usedValueIds.map(v => v.attributeValueId);

    // 2. Supprimer les ProductAttributeValue orphelines
    // Le cascade delete dans le schéma s'occupera des ProductAttributeValueTranslation
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

    // 3. Identifier les ProductAttribute qui n'ont plus aucune valeur
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

      // 4. Supprimer les ProductAttribute orphelins
      // Le cascade delete s'occupera des ProductAttributeTranslation
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

    // 5. Nettoyer les paniers vides (Carts sans CartItems)
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
    // On ne jette pas l'erreur pour ne pas bloquer le flux principal de suppression
  }
}
