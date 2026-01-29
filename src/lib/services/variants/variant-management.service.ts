import { Language } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { VariantWithRelations } from '@/lib/types/domain/variant';

export const GENERIC_ATTRIBUTE_KEY = 'variant_type';

/**
 * Assure qu'un attribut générique "variant_type" existe
 * Crée l'attribut s'il n'existe pas, sinon le retourne
 */
export async function ensureGenericVariantAttribute() {
  let attribute = await prisma.productAttribute.findUnique({
    where: { key: GENERIC_ATTRIBUTE_KEY },
  });

  if (!attribute) {
    logger.info(
      {
        action: 'create_generic_attribute',
        key: GENERIC_ATTRIBUTE_KEY,
      },
      "Création de l'attribut générique variant_type"
    );

    attribute = await prisma.productAttribute.create({
      data: {
        key: GENERIC_ATTRIBUTE_KEY,
        inputType: 'select',
        isRequired: true,
        sortOrder: 0,
        translations: {
          create: [
            { language: Language.EN, name: 'Variant' },
            { language: Language.FR, name: 'Variante' },
          ],
        },
      },
    });
  }

  return attribute;
}

/**
 * Crée ou récupère une valeur d'attribut pour un nom de variante
 */
export async function ensureAttributeValue(
  attributeId: string,
  valueKey: string,
  nameEN: string,
  nameFR: string
) {
  let attributeValue = await prisma.productAttributeValue.findUnique({
    where: {
      attributeId_value: {
        attributeId,
        value: valueKey,
      },
    },
  });

  if (!attributeValue) {
    attributeValue = await prisma.productAttributeValue.create({
      data: {
        attributeId,
        value: valueKey,
        translations: {
          create: [
            { language: Language.EN, displayName: nameEN },
            { language: Language.FR, displayName: nameFR },
          ],
        },
      },
    });
  }

  return attributeValue;
}

/**
 * Récupérer toutes les variantes d'un produit
 */
export async function getProductVariants(
  productId: string
): Promise<VariantWithRelations[]> {
  logger.info({ productId }, 'Récupération des variantes du produit');

  return prisma.productVariant.findMany({
    where: {
      productId,
      deletedAt: null,
    },
    include: {
      attributeValues: {
        include: {
          attributeValue: {
            include: {
              attribute: {
                include: {
                  translations: true,
                },
              },
              translations: true,
            },
          },
        },
      },
      pricing: {
        where: { isActive: true },
      },
      inventory: true,
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  }) as unknown as VariantWithRelations[];
}

/**
 * Récupérer une variante par ID
 */
export async function getVariantById(
  variantId: string
): Promise<VariantWithRelations | null> {
  logger.info({ variantId }, 'Récupération de la variante');

  return prisma.productVariant.findFirst({
    where: {
      id: variantId,
      deletedAt: null,
    },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
        },
      },
      attributeValues: {
        include: {
          attributeValue: {
            include: {
              attribute: {
                include: {
                  translations: true,
                },
              },
              translations: true,
            },
          },
        },
      },
      pricing: {
        where: { isActive: true },
      },
      inventory: true,
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  }) as unknown as VariantWithRelations | null;
}
