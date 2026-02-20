import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import {
  CreateVariantData,
  GenerateVariantsConfig,
} from '@/lib/types/domain/variant';

/**
 * Generates an automatic SKU based on an attribute value.
 */
export function generateSku(
  productSlug: string,
  attrValue: string,
  pattern?: string
): string {
  if (pattern) {
    return pattern
      .replace('{product}', productSlug.toUpperCase())
      .replace('{attr}', attrValue.toUpperCase());
  }

  // Default pattern: PRODUCTSLUG-ATTR
  return `${productSlug.toUpperCase()}-${attrValue.toUpperCase()}`;
}

/**
 * Validates that a variant has exactly 1 attribute value.
 */
export function validateVariantAttributes(attributeValueIds: string[]): void {
  if (attributeValueIds.length !== 1) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `A variant must have exactly 1 attribute (received ${attributeValueIds.length})`,
      400
    );
  }
}

/**
 * Generates all possible variant combinations for a single attribute.
 */
export async function generateVariantCombinations(
  productId: string,
  config: GenerateVariantsConfig
): Promise<CreateVariantData[]> {
  logger.info(
    {
      productId,
      attributeId: config.attributeId,
    },
    'Generating variants combinations'
  );

  // Fetch product with slug
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `Product not found: ${productId}`,
      404
    );
  }

  // Fetch attribute values
  const attrValues = await prisma.productAttributeValue.findMany({
    where: { attributeId: config.attributeId },
    select: { id: true, value: true },
  });

  if (attrValues.length === 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `No values found for attribute ${config.attributeId}`,
      400
    );
  }

  // Generate a variant for each value
  const variants: CreateVariantData[] = [];

  for (const attrValue of attrValues) {
    const sku = generateSku(product.slug, attrValue.value, config.skuPattern);

    variants.push({
      sku,
      attributeValueIds: [attrValue.id],
      pricing: { ...config.defaultPricing },
      inventory: config.defaultInventory
        ? { ...config.defaultInventory }
        : { stock: 0, trackInventory: true },
    });
  }

  logger.info(
    {
      productId,
      variantsGenerated: variants.length,
      attrValuesCount: attrValues.length,
    },
    `Successfully generated ${variants.length} variant(s)`
  );

  return variants;
}
