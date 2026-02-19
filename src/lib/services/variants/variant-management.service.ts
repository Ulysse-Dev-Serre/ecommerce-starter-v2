import { Language } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { VariantWithRelations } from '@/lib/types/domain/variant';
import { SUPPORTED_LOCALES } from '@/lib/config/site';
import { i18n } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';

export const GENERIC_ATTRIBUTE_KEY = 'variant_type';

/**
 * Helper to convert a locale string to a Prisma Language enum value.
 */
function toPrismaLanguage(locale: string): Language {
  const lang = locale.toUpperCase();
  if (Object.values(Language).includes(lang as Language)) {
    return lang as Language;
  }
  return i18n.defaultLocale.toUpperCase() as Language;
}

/**
 * Ensures a generic "variant_type" attribute exists.
 * Creates the attribute if it doesn't exist, otherwise returns it.
 * Uses dynamic dictionnaires i18n to populate names.
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
      'Creating generic attribute variant_type'
    );

    // Load translations from dictionaries
    const translations = await Promise.all(
      SUPPORTED_LOCALES.map(async locale => {
        const dict = await getDictionary(locale);
        // Fallback hierarchy: "Variant type" (from detail) -> "Variant" -> locale name
        const name =
          dict.admin?.products?.primaryAttribute ||
          dict.orders?.detail?.variant ||
          'Variant';

        return {
          language: toPrismaLanguage(locale),
          name: name,
        };
      })
    );

    attribute = await prisma.productAttribute.create({
      data: {
        key: GENERIC_ATTRIBUTE_KEY,
        inputType: 'select',
        isRequired: true,
        sortOrder: 0,
        translations: {
          create: translations,
        },
      },
    });
  }

  return attribute;
}

/**
 * Creates or retrieves an attribute value for variant names (multi-language).
 */
export async function ensureAttributeValue(
  attributeId: string,
  valueKey: string,
  names: Record<string, string>
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
          create: Object.entries(names).map(([locale, displayName]) => ({
            language: toPrismaLanguage(locale),
            displayName,
          })),
        },
      },
    });
  }

  return attributeValue;
}

/**
 * Retrieves all variants for a given product.
 */
export async function getProductVariants(
  productId: string
): Promise<VariantWithRelations[]> {
  logger.info({ productId }, 'Fetching product variants');

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
 * Retrieves a single variant by its ID.
 */
export async function getVariantById(
  variantId: string
): Promise<VariantWithRelations | null> {
  logger.info({ variantId }, 'Fetching variant');

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
